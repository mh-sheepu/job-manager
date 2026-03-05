import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'
import { getSupabase, ATTACHMENTS_BUCKET } from '@/lib/supabase'

interface SessionUser {
  id: string
  email: string
  name?: string
}

// GET - List attachments for a leave or task
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const leaveId = searchParams.get('leaveId')
    const taskId = searchParams.get('taskId')

    if (!leaveId && !taskId) {
      return NextResponse.json({ error: 'leaveId or taskId required' }, { status: 400 })
    }

    const attachments = await prisma.attachment.findMany({
      where: {
        ...(leaveId && { leaveId }),
        ...(taskId && { taskId }),
      },
      include: {
        uploader: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(attachments)
  } catch (error) {
    console.error('Error fetching attachments:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: `Failed to fetch attachments: ${errorMessage}` }, { status: 500 })
  }
}

// POST - Upload attachment
export async function POST(request: NextRequest) {
  try {
    console.log('Step 1: Starting upload...')
    
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as SessionUser
    console.log('Step 2: User authenticated:', user.id)

    const formData = await request.formData()
    const file = formData.get('file') as File
    const leaveId = formData.get('leaveId') as string | null
    const taskId = formData.get('taskId') as string | null
    
    console.log('Step 3: Form data received:', { fileName: file?.name, leaveId, taskId })

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!leaveId && !taskId) {
      return NextResponse.json({ error: 'leaveId or taskId required' }, { status: 400 })
    }

    // Validate file size (max 10MB)
    const MAX_SIZE = 10 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 })
    }

    // Allowed file types
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: `File type not allowed: ${file.type}` }, { status: 400 })
    }

    console.log('Step 4: File validation passed')

    // Generate unique filename
    const timestamp = Date.now()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filename = `${timestamp}-${sanitizedName}`
    const folder = leaveId ? 'leaves' : 'tasks'
    const path = `${folder}/${user.id}/${filename}`
    
    console.log('Step 5: Generated path:', path)

    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    console.log('Step 6: Buffer created, size:', buffer.length)

    // Upload to Supabase Storage
    console.log('Step 7: Uploading to Supabase...')
    const { data: uploadData, error: uploadError } = await getSupabase().storage
      .from(ATTACHMENTS_BUCKET)
      .upload(path, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: `Failed to upload file: ${uploadError.message}` }, { status: 500 })
    }
    
    console.log('Step 8: Upload successful:', uploadData.path)

    // Get public URL
    const { data: urlData } = getSupabase().storage
      .from(ATTACHMENTS_BUCKET)
      .getPublicUrl(uploadData.path)
      
    console.log('Step 9: Public URL:', urlData.publicUrl)

    // Save to database
    console.log('Step 10: Saving to database...')
    const attachment = await prisma.attachment.create({
      data: {
        filename,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        url: urlData.publicUrl,
        path: uploadData.path,
        uploadedBy: user.id,
        ...(leaveId && { leaveId }),
        ...(taskId && { taskId }),
      },
      include: {
        uploader: {
          select: { id: true, name: true, email: true },
        },
      },
    })
    
    console.log('Step 11: Database save successful:', attachment.id)

    return NextResponse.json(attachment)
  } catch (error) {
    console.error('Error uploading attachment:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: `Failed to upload attachment: ${errorMessage}` }, { status: 500 })
  }
}

// DELETE - Remove attachment
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as SessionUser
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Attachment ID required' }, { status: 400 })
    }

    // Find attachment
    const attachment = await prisma.attachment.findUnique({
      where: { id },
    })

    if (!attachment) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
    }

    // Check ownership
    if (attachment.uploadedBy !== user.id) {
      return NextResponse.json({ error: 'Not authorized to delete this attachment' }, { status: 403 })
    }

    // Delete from Supabase Storage
    const { error: deleteError } = await getSupabase().storage
      .from(ATTACHMENTS_BUCKET)
      .remove([attachment.path])

    if (deleteError) {
      console.error('Storage delete error:', deleteError)
    }

    // Delete from database
    await prisma.attachment.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting attachment:', error)
    return NextResponse.json({ error: 'Failed to delete attachment' }, { status: 500 })
  }
}
