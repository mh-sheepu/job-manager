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

    // Run all queries in parallel for better performance
    const [
      leaveBalanceResult,
      absentCountMonth,
      totalAbsentsYear,
      projects,
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
      // Get projects with sections and tasks
      prisma.project.findMany({
        where: { userId },
        include: {
          sections: {
            include: { tasks: true },
          },
        },
      }),
      // Recent leaves
      prisma.leave.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      // Recent absents
      prisma.absent.findMany({
        where: { userId },
        orderBy: { date: "desc" },
        take: 5,
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

    const activeProjects = projects.filter((p: { status: string }) => p.status === "ACTIVE").length;
    const completedProjects = projects.filter((p: { status: string }) => p.status === "COMPLETED").length;

    // Task stats
    let totalTasks = 0;
    let completedTasks = 0;
    let inProgressTasks = 0;

    projects.forEach((project: { sections: { tasks: { status: string }[] }[] }) => {
      project.sections.forEach((section: { tasks: { status: string }[] }) => {
        section.tasks.forEach((task: { status: string }) => {
          totalTasks++;
          if (task.status === "DONE") completedTasks++;
          if (task.status === "IN_PROGRESS") inProgressTasks++;
        });
      });
    });

    return NextResponse.json({
      leaveBalance,
      absentStats: {
        thisMonth: absentCountMonth,
        thisYear: totalAbsentsYear,
      },
      projectStats: {
        active: activeProjects,
        completed: completedProjects,
        total: projects.length,
      },
      taskStats: {
        total: totalTasks,
        completed: completedTasks,
        inProgress: inProgressTasks,
      },
      recentLeaves,
      recentAbsents,
    });
  } catch (error) {
    console.error("Error fetching dashboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
