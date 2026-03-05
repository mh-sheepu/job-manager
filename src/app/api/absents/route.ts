import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const absents = await prisma.absent.findMany({
      where: { userId },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(absents);
  } catch (error) {
    console.error("Error fetching absents:", error);
    return NextResponse.json(
      { error: "Failed to fetch absents" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();
    const { date, reason, isExcused } = body;

    if (!date || !reason) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const absent = await prisma.absent.create({
      data: {
        userId,
        date: new Date(date),
        reason,
        isExcused: isExcused || false,
      },
    });

    return NextResponse.json(absent, { status: 201 });
  } catch (error) {
    console.error("Error creating absent:", error);
    return NextResponse.json(
      { error: "Failed to create absent" },
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
    const { id, date, reason, isExcused } = body;

    if (!id) {
      return NextResponse.json({ error: "Absent ID required" }, { status: 400 });
    }

    const absent = await prisma.absent.update({
      where: { id },
      data: {
        date: date ? new Date(date) : undefined,
        reason,
        isExcused,
      },
    });

    return NextResponse.json(absent);
  } catch (error) {
    console.error("Error updating absent:", error);
    return NextResponse.json(
      { error: "Failed to update absent" },
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
    const absentId = searchParams.get("id");

    if (!absentId) {
      return NextResponse.json({ error: "Absent ID required" }, { status: 400 });
    }

    await prisma.absent.delete({
      where: { id: absentId },
    });

    return NextResponse.json({ message: "Absent deleted successfully" });
  } catch (error) {
    console.error("Error deleting absent:", error);
    return NextResponse.json(
      { error: "Failed to delete absent" },
      { status: 500 }
    );
  }
}
