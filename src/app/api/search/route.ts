import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'all'; // all, projects, tasks, leaves, absents

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const searchQuery = `%${query}%`;
    const results: Array<{
      id: string;
      type: 'project' | 'task' | 'leave' | 'absent';
      title: string;
      subtitle: string;
      status?: string;
      date?: string;
      url: string;
    }> = [];

    // Search Projects
    if (type === 'all' || type === 'projects') {
      const projects = await prisma.project.findMany({
        where: {
          userId,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } }
          ]
        },
        take: 10
      });

      projects.forEach(project => {
        results.push({
          id: project.id,
          type: 'project',
          title: project.name,
          subtitle: project.description || 'No description',
          status: project.status,
          url: '/works'
        });
      });
    }

    // Search Tasks
    if (type === 'all' || type === 'tasks') {
      const tasks = await prisma.task.findMany({
        where: {
          section: {
            project: { userId }
          },
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } }
          ]
        },
        include: {
          section: {
            include: { project: true }
          }
        },
        take: 10
      });

      tasks.forEach(task => {
        results.push({
          id: task.id,
          type: 'task',
          title: task.name,
          subtitle: `${task.section.project.name} → ${task.section.name}`,
          status: task.status,
          date: task.dueDate?.toISOString(),
          url: '/works'
        });
      });
    }

    // Search Leaves
    if (type === 'all' || type === 'leaves') {
      const leaves = await prisma.leave.findMany({
        where: {
          userId,
          reason: { contains: query, mode: 'insensitive' }
        },
        take: 10
      });

      leaves.forEach(leave => {
        results.push({
          id: leave.id,
          type: 'leave',
          title: `${leave.type} Leave`,
          subtitle: leave.reason,
          status: leave.status,
          date: leave.startDate.toISOString(),
          url: '/leaves'
        });
      });
    }

    // Search Absents
    if (type === 'all' || type === 'absents') {
      const absents = await prisma.absent.findMany({
        where: {
          userId,
          reason: { contains: query, mode: 'insensitive' }
        },
        take: 10
      });

      absents.forEach(absent => {
        results.push({
          id: absent.id,
          type: 'absent',
          title: 'Absence',
          subtitle: absent.reason,
          date: absent.date.toISOString(),
          url: '/absents'
        });
      });
    }

    return NextResponse.json({ 
      results,
      query,
      total: results.length
    });

  } catch (error) {
    console.error('Error searching:', error);
    return NextResponse.json(
      { error: 'Failed to search' },
      { status: 500 }
    );
  }
}
