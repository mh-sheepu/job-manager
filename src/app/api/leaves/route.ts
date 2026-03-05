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
    const currentYear = new Date().getFullYear();

    let leaveBalance = await prisma.leaveBalance.findFirst({
      where: { userId, year: currentYear },
    });

    if (!leaveBalance) {
      leaveBalance = await prisma.leaveBalance.create({
        data: {
          userId,
          year: currentYear,
          totalLeaves: 20,
          sickLeaves: 10,
          casualLeaves: 10,
        },
      });
    }

    const leaves = await prisma.leave.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        attachments: {
          select: {
            id: true,
            filename: true,
            originalName: true,
            mimeType: true,
            size: true,
            url: true,
            createdAt: true,
          },
        },
      },
    });

    return NextResponse.json({ leaveBalance, leaves });
  } catch (error) {
    console.error("Error fetching leaves:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaves" },
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
    const { startDate, endDate, type, reason } = body;

    if (!startDate || !endDate || !type || !reason) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const leave = await prisma.leave.create({
      data: {
        userId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        type,
        reason,
      },
    });

    // Update leave balance
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const currentYear = new Date().getFullYear();

    const updateData: any = {};
    if (type === "SICK") {
      updateData.usedSick = { increment: days };
    } else if (type === "CASUAL") {
      updateData.usedCasual = { increment: days };
    }
    updateData.usedLeaves = { increment: days };

    await prisma.leaveBalance.updateMany({
      where: { userId, year: currentYear },
      data: updateData,
    });

    return NextResponse.json(leave, { status: 201 });
  } catch (error) {
    console.error("Error creating leave:", error);
    return NextResponse.json(
      { error: "Failed to create leave" },
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
    const leaveId = searchParams.get("id");

    if (!leaveId) {
      return NextResponse.json({ error: "Leave ID required" }, { status: 400 });
    }

    const leave = await prisma.leave.findUnique({
      where: { id: leaveId },
    });

    if (!leave) {
      return NextResponse.json({ error: "Leave not found" }, { status: 404 });
    }

    // Restore leave balance
    const days = Math.ceil(
      (leave.endDate.getTime() - leave.startDate.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;
    const currentYear = new Date().getFullYear();

    const updateData: any = { usedLeaves: { decrement: days } };
    if (leave.type === "SICK") {
      updateData.usedSick = { decrement: days };
    } else if (leave.type === "CASUAL") {
      updateData.usedCasual = { decrement: days };
    }

    await prisma.leaveBalance.updateMany({
      where: { userId: leave.userId, year: currentYear },
      data: updateData,
    });

    await prisma.leave.delete({
      where: { id: leaveId },
    });

    return NextResponse.json({ message: "Leave deleted successfully" });
  } catch (error) {
    console.error("Error deleting leave:", error);
    return NextResponse.json(
      { error: "Failed to delete leave" },
      { status: 500 }
    );
  }
}
