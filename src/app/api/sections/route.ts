import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, projectId } = body;

    if (!name || !projectId) {
      return NextResponse.json(
        { error: "Name and project ID are required" },
        { status: 400 }
      );
    }

    // Get highest order for this project
    const lastSection = await prisma.section.findFirst({
      where: { projectId },
      orderBy: { order: "desc" },
    });

    const section = await prisma.section.create({
      data: {
        name,
        description,
        projectId,
        order: (lastSection?.order ?? -1) + 1,
      },
      include: { tasks: true },
    });

    return NextResponse.json(section, { status: 201 });
  } catch (error) {
    console.error("Error creating section:", error);
    return NextResponse.json(
      { error: "Failed to create section" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, description, order } = body;

    if (!id) {
      return NextResponse.json({ error: "Section ID required" }, { status: 400 });
    }

    const section = await prisma.section.update({
      where: { id },
      data: {
        name,
        description,
        order,
      },
      include: { tasks: true },
    });

    return NextResponse.json(section);
  } catch (error) {
    console.error("Error updating section:", error);
    return NextResponse.json(
      { error: "Failed to update section" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sectionId = searchParams.get("id");

    if (!sectionId) {
      return NextResponse.json({ error: "Section ID required" }, { status: 400 });
    }

    await prisma.section.delete({
      where: { id: sectionId },
    });

    return NextResponse.json({ message: "Section deleted successfully" });
  } catch (error) {
    console.error("Error deleting section:", error);
    return NextResponse.json(
      { error: "Failed to delete section" },
      { status: 500 }
    );
  }
}
