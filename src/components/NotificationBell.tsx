'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Check, Clock, X, AlertTriangle, Calendar, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNotifications } from '@/lib/hooks';

interface Notification {
  id: string;
  type: 'leave_approved' | 'leave_rejected' | 'leave_upcoming' | 'task_due' | 'task_overdue' | 'absent_added';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { data, isLoading } = useNotifications();
  
  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'leave_approved':
        return <Check className="w-4 h-4 text-green-600" />;
      case 'leave_rejected':
        return <X className="w-4 h-4 text-red-600" />;
      case 'leave_upcoming':
        return <Calendar className="w-4 h-4 text-blue-600" />;
      case 'task_due':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'task_overdue':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'absent_added':
        return <FileText className="w-4 h-4 text-gray-600" />;
      default:
        return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  const getNotificationBg = (type: string) => {
    switch (type) {
      case 'leave_approved':
        return 'bg-green-50';
      case 'leave_rejected':
        return 'bg-red-50';
      case 'leave_upcoming':
        return 'bg-blue-50';
      case 'task_due':
        return 'bg-yellow-50';
      case 'task_overdue':
        return 'bg-red-50';
      case 'absent_added':
        return 'bg-gray-50';
      default:
        return 'bg-white';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden">
          <div className="p-3 border-b border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-sm text-gray-500">{unreadCount} new</span>
              )}
            </div>
          </div>

          <div className="overflow-y-auto max-h-72">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${getNotificationBg(notification.type)}`}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-600 truncate">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-2 border-t border-gray-200 bg-gray-50">
              <a
                href="/notifications"
                className="block text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View All Notifications
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
