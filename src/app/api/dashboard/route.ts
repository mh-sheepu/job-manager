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
    const startOfMonth = new Date(currentYear, new Date().getMonth(), 1);
    const endOfMonth = new Date(currentYear, new Date().getMonth() + 1, 0);
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31);

    // Run all queries in parallel - use COUNT queries instead of fetching all data
    const [
      leaveBalanceResult,
      absentCountMonth,
      totalAbsentsYear,
      activeProjectCount,
      completedProjectCount,
      totalProjectCount,
      taskCounts,
      recentLeaves,
      recentAbsents
    ] = await Promise.all([
      // Get leave balance
      prisma.leaveBalance.findFirst({
        where: { userId, year: currentYear },
      }),
      // Get absent count this month
      prisma.absent.count({
        where: {
          userId,
          date: { gte: startOfMonth, lte: endOfMonth },
        },
      }),
      // Get total absents this year
      prisma.absent.count({
        where: {
          userId,
          date: { gte: startOfYear, lte: endOfYear },
        },
      }),
      // Count active projects (fast count query)
      prisma.project.count({
        where: { userId, status: "ACTIVE" },
      }),
      // Count completed projects
      prisma.project.count({
        where: { userId, status: "COMPLETED" },
      }),
      // Count total projects
      prisma.project.count({
        where: { userId },
      }),
      // Get task counts using raw SQL for efficiency
      prisma.$queryRaw<{ status: string; count: bigint }[]>`
        SELECT t.status, COUNT(*)::bigint as count
        FROM "Task" t
        JOIN "Section" s ON t."sectionId" = s.id
        JOIN "Project" p ON s."projectId" = p.id
        WHERE p."userId" = ${userId}
        GROUP BY t.status
      `,
      // Recent leaves (limited)
      prisma.leave.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          startDate: true,
          endDate: true,
          type: true,
          status: true,
          reason: true,
          createdAt: true,
        },
      }),
      // Recent absents (limited)
      prisma.absent.findMany({
        where: { userId },
        orderBy: { date: "desc" },
        take: 5,
        select: {
          id: true,
          date: true,
          reason: true,
          isExcused: true,
        },
      })
    ]);

    // Create leave balance if not exists
    let leaveBalance = leaveBalanceResult;
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

    // Process task counts from raw query
    let totalTasks = 0;
    let completedTasks = 0;
    let inProgressTasks = 0;

    taskCounts.forEach((row) => {
      const count = Number(row.count);
      totalTasks += count;
      if (row.status === "DONE") completedTasks = count;
      if (row.status === "IN_PROGRESS") inProgressTasks = count;
    });

    return NextResponse.json({
      leaveBalance,
      absentStats: {
        thisMonth: absentCountMonth,
        thisYear: totalAbsentsYear,
      },
      projectStats: {
        active: activeProjectCount,
        completed: completedProjectCount,
        total: totalProjectCount,
      },
      taskStats: {
        total: totalTasks,
        completed: completedTasks,
        inProgress: inProgressTasks,
      },
      recentLeaves,
      recentAbsents,
    }, {
      headers: {
        'Cache-Control': 'private, s-maxage=10, stale-while-revalidate=30',
      }
    });
  } catch (error) {
    console.error("Error fetching dashboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
