'use client';

import { useState, useEffect } from 'react';
import { Bell, Check, Clock, X, AlertTriangle, Calendar, FileText, RefreshCw } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface Notification {
  id: string;
  type: 'leave_approved' | 'leave_rejected' | 'leave_upcoming' | 'task_due' | 'task_overdue' | 'absent_added';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'leave_approved':
        return <Check className="w-5 h-5 text-green-600" />;
      case 'leave_rejected':
        return <X className="w-5 h-5 text-red-600" />;
      case 'leave_upcoming':
        return <Calendar className="w-5 h-5 text-blue-600" />;
      case 'task_due':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'task_overdue':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'absent_added':
        return <FileText className="w-5 h-5 text-gray-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getNotificationBg = (type: string) => {
    switch (type) {
      case 'leave_approved':
        return 'bg-green-50 border-green-200';
      case 'leave_rejected':
        return 'bg-red-50 border-red-200';
      case 'leave_upcoming':
        return 'bg-blue-50 border-blue-200';
      case 'task_due':
        return 'bg-yellow-50 border-yellow-200';
      case 'task_overdue':
        return 'bg-red-50 border-red-200';
      case 'absent_added':
        return 'bg-gray-50 border-gray-200';
      default:
        return 'bg-white border-gray-200';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'leave_approved':
      case 'leave_rejected':
      case 'leave_upcoming':
        return 'Leave';
      case 'task_due':
      case 'task_overdue':
        return 'Task';
      case 'absent_added':
        return 'Absent';
      default:
        return 'Other';
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'leaves') return n.type.startsWith('leave');
    if (filter === 'tasks') return n.type.startsWith('task');
    if (filter === 'absents') return n.type === 'absent_added';
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600">Stay updated with your work activities</p>
        </div>
        <button
          onClick={fetchNotifications}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['all', 'leaves', 'tasks', 'absents'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin text-gray-400" />
            <p className="text-gray-500">Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
            <p className="text-gray-500">
              {filter === 'all'
                ? "You're all caught up! Check back later for updates."
                : `No ${filter} notifications to show.`}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-white rounded-lg shadow border-l-4 p-4 transition-all hover:shadow-md ${getNotificationBg(notification.type)}`}
            >
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                      <p className="text-gray-600 mt-1">{notification.message}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      notification.type.includes('approved') ? 'bg-green-100 text-green-700' :
                      notification.type.includes('rejected') || notification.type.includes('overdue') ? 'bg-red-100 text-red-700' :
                      notification.type.includes('due') || notification.type.includes('upcoming') ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {getTypeLabel(notification.type)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                    <span>{formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}</span>
                    <span className="text-gray-300">•</span>
                    <span>{format(new Date(notification.timestamp), 'MMM d, yyyy h:mm a')}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Legend */}
      <div className="mt-8 bg-white rounded-lg shadow p-4">
        <h3 className="font-medium text-gray-900 mb-3">Notification Types</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-600" />
            <span className="text-sm text-gray-600">Leave Approved</span>
          </div>
          <div className="flex items-center gap-2">
            <X className="w-4 h-4 text-red-600" />
            <span className="text-sm text-gray-600">Leave Rejected</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-gray-600">Upcoming Leave</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-yellow-600" />
            <span className="text-sm text-gray-600">Task Due Soon</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span className="text-sm text-gray-600">Task Overdue</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-600">Absence Recorded</span>
          </div>
        </div>
      </div>
    </div>
  );
}
