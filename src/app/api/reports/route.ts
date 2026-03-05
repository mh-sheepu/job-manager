import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { subMonths, subYears, format, startOfMonth, endOfMonth } from "date-fns";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "6months";

    // Calculate date range
    let startDate = new Date();
    switch (period) {
      case "1month":
        startDate = subMonths(new Date(), 1);
        break;
      case "3months":
        startDate = subMonths(new Date(), 3);
        break;
      case "6months":
        startDate = subMonths(new Date(), 6);
        break;
      case "1year":
        startDate = subYears(new Date(), 1);
        break;
    }

    // Fetch leaves
    const leaves = await prisma.leave.findMany({
      where: {
        userId,
        createdAt: { gte: startDate },
      },
    });

    const leaveByType = leaves.reduce((acc: any, leave) => {
      acc[leave.type] = (acc[leave.type] || 0) + 1;
      return acc;
    }, {});

    // Fetch absents
    const absents = await prisma.absent.findMany({
      where: {
        userId,
        date: { gte: startDate },
      },
    });

    // Calculate absent by month
    const absentByMonth: Record<string, number> = {};
    const monthCount = period === "1year" ? 12 : period === "6months" ? 6 : period === "3months" ? 3 : 1;

    for (let i = monthCount - 1; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      absentByMonth[format(date, "MMM")] = 0;
    }

    absents.forEach((absent) => {
      const month = format(new Date(absent.date), "MMM");
      if (absentByMonth[month] !== undefined) {
        absentByMonth[month]++;
      }
    });

    // Fetch projects
    const projects = await prisma.project.findMany({
      where: { userId },
      include: {
        sections: {
          include: { tasks: true },
        },
      },
    });

    // Calculate task stats
    const allTasks = projects.flatMap((p) => p.sections.flatMap((s) => s.tasks));

    const taskByPriority = allTasks.reduce((acc: any, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {});

    const reportData = {
      leaveStats: {
        total: leaves.length,
        approved: leaves.filter((l) => l.status === "APPROVED").length,
        pending: leaves.filter((l) => l.status === "PENDING").length,
        rejected: leaves.filter((l) => l.status === "REJECTED").length,
        byType: Object.entries(leaveByType).map(([type, count]) => ({
          type,
          count,
        })),
      },
      absentStats: {
        total: absents.length,
        excused: absents.filter((a) => a.isExcused).length,
        unexcused: absents.filter((a) => !a.isExcused).length,
        byMonth: Object.entries(absentByMonth).map(([month, count]) => ({
          month,
          count,
        })),
      },
      projectStats: {
        total: projects.length,
        active: projects.filter((p) => p.status === "ACTIVE").length,
        completed: projects.filter((p) => p.status === "COMPLETED").length,
      },
      taskStats: {
        total: allTasks.length,
        completed: allTasks.filter((t) => t.status === "DONE").length,
        inProgress: allTasks.filter((t) => t.status === "IN_PROGRESS").length,
        todo: allTasks.filter((t) => t.status === "TODO").length,
        byPriority: ["URGENT", "HIGH", "MEDIUM", "LOW"].map((priority) => ({
          priority,
          count: taskByPriority[priority] || 0,
        })),
      },
    };

    return NextResponse.json(reportData);
  } catch (error) {
    console.error("Error fetching report:", error);
    return NextResponse.json({ error: "Failed to fetch report" }, { status: 500 });
  }
}
