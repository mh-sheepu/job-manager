import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Get user details including leave balance, leaves, absents
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== "admin" && userRole !== "hr") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const userId = params.id;
    const currentYear = new Date().getFullYear();

    const [user, leaveBalance, leaves, absents, projects] = await Promise.all([
      // Get user info
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          department: true,
          createdAt: true,
          image: true,
        },
      }),
      // Get leave balance
      prisma.leaveBalance.findFirst({
        where: { userId, year: currentYear },
      }),
      // Get recent leaves
      prisma.leave.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      // Get recent absents
      prisma.absent.findMany({
        where: { userId },
        orderBy: { date: "desc" },
        take: 10,
      }),
      // Get project count
      prisma.project.count({
        where: { userId },
      }),
    ]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create leave balance if doesn't exist
    let balance = leaveBalance;
    if (!balance) {
      balance = await prisma.leaveBalance.create({
        data: {
          userId,
          year: currentYear,
          totalLeaves: 20,
          sickLeaves: 10,
          casualLeaves: 10,
        },
      });
    }

    return NextResponse.json({
      user,
      leaveBalance: balance,
      leaves,
      absents,
      projectCount: projects,
    });
  } catch (error) {
    console.error("Error fetching user details:", error);
    return NextResponse.json(
      { error: "Failed to fetch user details" },
      { status: 500 }
    );
  }
}

// Update user details (role, department, leave balance)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== "admin" && userRole !== "hr") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const userId = params.id;
    const body = await request.json();
    const { role, department, leaveBalance } = body;

    // Only admin can change roles
    if (role && userRole !== "admin") {
      return NextResponse.json(
        { error: "Only admin can change user roles" },
        { status: 403 }
      );
    }

    // Update user
    if (role || department !== undefined) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          ...(role && { role }),
          ...(department !== undefined && { department }),
        },
      });
    }

    // Update leave balance
    if (leaveBalance) {
      const currentYear = new Date().getFullYear();
      await prisma.leaveBalance.upsert({
        where: { userId },
        create: {
          userId,
          year: currentYear,
          totalLeaves: leaveBalance.totalLeaves,
          usedLeaves: leaveBalance.usedLeaves || 0,
          sickLeaves: leaveBalance.sickLeaves,
          usedSick: leaveBalance.usedSick || 0,
          casualLeaves: leaveBalance.casualLeaves,
          usedCasual: leaveBalance.usedCasual || 0,
        },
        update: {
          totalLeaves: leaveBalance.totalLeaves,
          sickLeaves: leaveBalance.sickLeaves,
          casualLeaves: leaveBalance.casualLeaves,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}
