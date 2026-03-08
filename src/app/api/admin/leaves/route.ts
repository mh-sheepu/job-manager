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

    // Get all leaves with user info
    const leaves = await prisma.leave.findMany({
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
    });

    return NextResponse.json(leaves);
  } catch (error) {
    console.error("Error fetching all leaves:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaves" },
      { status: 500 }
    );
  }
}
