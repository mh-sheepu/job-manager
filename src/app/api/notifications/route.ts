import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { subDays } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const sevenDaysAgo = subDays(new Date(), 7);

    // Get recent leaves (approved/rejected in last 7 days)
    const recentLeaves = await prisma.leave.findMany({
      where: {
        userId,
        updatedAt: { gte: sevenDaysAgo },
        status: { in: ['APPROVED', 'REJECTED'] }
      },
      orderBy: { updatedAt: 'desc' },
      take: 10
    });

    // Get leaves starting soon (within 3 days)
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    
    const upcomingLeaves = await prisma.leave.findMany({
      where: {
        userId,
        status: 'APPROVED',
        startDate: {
          gte: new Date(),
          lte: threeDaysFromNow
        }
      },
      orderBy: { startDate: 'asc' }
    });

    // Get tasks due soon or overdue
    const tasks = await prisma.task.findMany({
      where: {
        section: {
          project: { userId }
        },
        status: { not: 'COMPLETED' },
        dueDate: { lte: threeDaysFromNow }
      },
      include: {
        section: {
          include: { project: true }
        }
      },
      orderBy: { dueDate: 'asc' },
      take: 10
    });

    // Get recent absents entered
    const recentAbsents = await prisma.absent.findMany({
      where: {
        userId,
        createdAt: { gte: subDays(new Date(), 3) }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // Build notifications array
    const notifications: Array<{
      id: string;
      type: 'leave_approved' | 'leave_rejected' | 'leave_upcoming' | 'task_due' | 'task_overdue' | 'absent_added';
      title: string;
      message: string;
      timestamp: Date;
      read: boolean;
    }> = [];

    // Add leave status notifications
    recentLeaves.forEach(leave => {
      notifications.push({
        id: `leave-${leave.id}`,
        type: leave.status === 'APPROVED' ? 'leave_approved' : 'leave_rejected',
        title: leave.status === 'APPROVED' ? 'Leave Approved' : 'Leave Rejected',
        message: `Your ${leave.type.toLowerCase()} leave request has been ${leave.status.toLowerCase()}`,
        timestamp: leave.updatedAt,
        read: false
      });
    });

    // Add upcoming leave notifications
    upcomingLeaves.forEach(leave => {
      const daysUntil = Math.ceil((leave.startDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      notifications.push({
        id: `upcoming-${leave.id}`,
        type: 'leave_upcoming',
        title: 'Upcoming Leave',
        message: `Your ${leave.type.toLowerCase()} leave starts in ${daysUntil} day${daysUntil > 1 ? 's' : ''}`,
        timestamp: new Date(),
        read: false
      });
    });

    // Add task due/overdue notifications
    tasks.forEach(task => {
      const isOverdue = task.dueDate && task.dueDate < new Date();
      notifications.push({
        id: `task-${task.id}`,
        type: isOverdue ? 'task_overdue' : 'task_due',
        title: isOverdue ? 'Task Overdue' : 'Task Due Soon',
        message: `"${task.name}" in ${task.section.project.name} is ${isOverdue ? 'overdue' : 'due soon'}`,
        timestamp: task.dueDate || new Date(),
        read: false
      });
    });

    // Add recent absent notifications
    recentAbsents.forEach(absent => {
      notifications.push({
        id: `absent-${absent.id}`,
        type: 'absent_added',
        title: 'Absence Recorded',
        message: `Absence on ${absent.date.toLocaleDateString()} has been recorded`,
        timestamp: absent.createdAt,
        read: false
      });
    });

    // Sort by timestamp (most recent first)
    notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({
      notifications: notifications.slice(0, 20),
      unreadCount: notifications.length
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}
