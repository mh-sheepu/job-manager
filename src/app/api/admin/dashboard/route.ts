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

    const userRole = (session.user as any).role;
    if (userRole !== "admin" && userRole !== "hr") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const currentYear = new Date().getFullYear();
    const startOfMonth = new Date(currentYear, new Date().getMonth(), 1);
    const endOfMonth = new Date(currentYear, new Date().getMonth() + 1, 0);

    // Run all queries in parallel
    const [
      totalUsers,
      pendingLeaves,
      approvedLeavesMonth,
      totalAbsentsMonth,
      recentLeaveRequests,
      allUsers,
    ] = await Promise.all([
      // Total users
      prisma.user.count(),
      // Pending leave requests
      prisma.leave.count({
        where: { status: "PENDING" },
      }),
      // Approved leaves this month
      prisma.leave.count({
        where: {
          status: "APPROVED",
          startDate: { gte: startOfMonth, lte: endOfMonth },
        },
      }),
      // Total absents this month
      prisma.absent.count({
        where: {
          date: { gte: startOfMonth, lte: endOfMonth },
        },
      }),
      // Recent leave requests with user info
      prisma.leave.findMany({
        where: { status: "PENDING" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              department: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      // All users
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          department: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json({
      stats: {
        totalUsers,
        pendingLeaves,
        approvedLeavesMonth,
        totalAbsentsMonth,
      },
      recentLeaveRequests,
      allUsers,
    });
  } catch (error) {
    console.error("Error fetching admin dashboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin dashboard data" },
      { status: 500 }
    );
  }
}

// Approve or reject leave
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== "admin" && userRole !== "hr") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { leaveId, status } = body;

    if (!leaveId || !status) {
      return NextResponse.json(
        { error: "Leave ID and status are required" },
        { status: 400 }
      );
    }

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    // Get the leave request
    const leave = await prisma.leave.findUnique({
      where: { id: leaveId },
    });

    if (!leave) {
      return NextResponse.json(
        { error: "Leave request not found" },
        { status: 404 }
      );
    }

    // Update leave status
    const updatedLeave = await prisma.leave.update({
      where: { id: leaveId },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // If approved, update leave balance
    if (status === "APPROVED") {
      const days = Math.ceil(
        (new Date(leave.endDate).getTime() - new Date(leave.startDate).getTime()) /
          (1000 * 60 * 60 * 24)
      ) + 1;

      const currentYear = new Date().getFullYear();
      
      // Update leave balance based on leave type
      if (leave.type === "ANNUAL") {
        await prisma.leaveBalance.updateMany({
          where: { userId: leave.userId, year: currentYear },
          data: { usedLeaves: { increment: days } },
        });
      } else if (leave.type === "SICK") {
        await prisma.leaveBalance.updateMany({
          where: { userId: leave.userId, year: currentYear },
          data: { usedSick: { increment: days } },
        });
      } else if (leave.type === "CASUAL") {
        await prisma.leaveBalance.updateMany({
          where: { userId: leave.userId, year: currentYear },
          data: { usedCasual: { increment: days } },
        });
      }
    }

    return NextResponse.json(updatedLeave);
  } catch (error) {
    console.error("Error updating leave status:", error);
    return NextResponse.json(
      { error: "Failed to update leave status" },
      { status: 500 }
    );
  }
}