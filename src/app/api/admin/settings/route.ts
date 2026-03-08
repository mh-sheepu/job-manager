import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Get global leave settings
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

    // Get settings from a settings table or return defaults
    // For now, we'll use default values that can be updated
    const settings = {
      defaultAnnualLeaves: 20,
      defaultSickLeaves: 10,
      defaultCasualLeaves: 10,
    };

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// Update global leave settings - applies to all new users
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== "admin") {
      return NextResponse.json({ error: "Only admin can update global settings" }, { status: 403 });
    }

    const body = await request.json();
    const { applyToAll, defaultAnnualLeaves, defaultSickLeaves, defaultCasualLeaves } = body;

    // If applyToAll is true, update all existing leave balances for current year
    if (applyToAll) {
      const currentYear = new Date().getFullYear();
      
      await prisma.leaveBalance.updateMany({
        where: { year: currentYear },
        data: {
          totalLeaves: defaultAnnualLeaves,
          sickLeaves: defaultSickLeaves,
          casualLeaves: defaultCasualLeaves,
        },
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: applyToAll 
        ? "Settings applied to all users" 
        : "Default settings updated for new users" 
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
