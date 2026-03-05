"use client";

import { useEffect, useState } from "react";
import ProtectedLayout from "@/components/ProtectedLayout";
import {
  Calendar,
  CalendarX,
  FolderKanban,
  CheckCircle2,
  Clock,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";

interface DashboardData {
  leaveBalance: {
    totalLeaves: number;
    usedLeaves: number;
    sickLeaves: number;
    usedSick: number;
    casualLeaves: number;
    usedCasual: number;
  };
  absentStats: {
    thisMonth: number;
    thisYear: number;
  };
  projectStats: {
    active: number;
    completed: number;
    total: number;
  };
  taskStats: {
    total: number;
    completed: number;
    inProgress: number;
  };
  recentLeaves: any[];
  recentAbsents: any[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await fetch("/api/dashboard");
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Error fetching dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ProtectedLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </ProtectedLayout>
    );
  }

  const remainingLeaves = data
    ? data.leaveBalance.totalLeaves - data.leaveBalance.usedLeaves
    : 0;

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Remaining Leaves */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Remaining Leaves
                </p>
                <p className="text-3xl font-bold text-indigo-600 mt-1">
                  {remainingLeaves}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  of {data?.leaveBalance.totalLeaves} total
                </p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-full">
                <Calendar className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Used</span>
                <span>
                  {data?.leaveBalance.usedLeaves}/{data?.leaveBalance.totalLeaves}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full"
                  style={{
                    width: `${
                      ((data?.leaveBalance.usedLeaves || 0) /
                        (data?.leaveBalance.totalLeaves || 1)) *
                      100
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Absent Days */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Absent Days
                </p>
                <p className="text-3xl font-bold text-red-500 mt-1">
                  {data?.absentStats.thisMonth || 0}
                </p>
                <p className="text-xs text-gray-400 mt-1">this month</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <CalendarX className="h-6 w-6 text-red-500" />
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              {data?.absentStats.thisYear || 0} total this year
            </p>
          </div>

          {/* Active Projects */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Active Projects
                </p>
                <p className="text-3xl font-bold text-emerald-600 mt-1">
                  {data?.projectStats.active || 0}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {data?.projectStats.completed} completed
                </p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-full">
                <FolderKanban className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              {data?.projectStats.total || 0} total projects
            </p>
          </div>

          {/* Tasks Progress */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Tasks Completed
                </p>
                <p className="text-3xl font-bold text-amber-600 mt-1">
                  {data?.taskStats.completed || 0}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {data?.taskStats.inProgress} in progress
                </p>
              </div>
              <div className="p-3 bg-amber-100 rounded-full">
                <CheckCircle2 className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              {data?.taskStats.total || 0} total tasks
            </p>
          </div>
        </div>

        {/* Leave Balance Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Leave Balance Breakdown
            </h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Sick Leave</span>
                  <span className="text-sm font-medium">
                    {(data?.leaveBalance.sickLeaves || 0) -
                      (data?.leaveBalance.usedSick || 0)}{" "}
                    / {data?.leaveBalance.sickLeaves} remaining
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{
                      width: `${
                        ((data?.leaveBalance.usedSick || 0) /
                          (data?.leaveBalance.sickLeaves || 1)) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Casual Leave</span>
                  <span className="text-sm font-medium">
                    {(data?.leaveBalance.casualLeaves || 0) -
                      (data?.leaveBalance.usedCasual || 0)}{" "}
                    / {data?.leaveBalance.casualLeaves} remaining
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full"
                    style={{
                      width: `${
                        ((data?.leaveBalance.usedCasual || 0) /
                          (data?.leaveBalance.casualLeaves || 1)) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Overview
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <Clock className="h-8 w-8 text-gray-400" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {data?.taskStats.inProgress || 0}
                  </p>
                  <p className="text-xs text-gray-500">Tasks In Progress</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <TrendingUp className="h-8 w-8 text-gray-400" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {data?.projectStats.active || 0}
                  </p>
                  <p className="text-xs text-gray-500">Active Projects</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Leaves */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Recent Leave Requests
            </h2>
            {data?.recentLeaves && data.recentLeaves.length > 0 ? (
              <div className="space-y-3">
                {data.recentLeaves.slice(0, 5).map((leave: any) => (
                  <div
                    key={leave.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {leave.type} Leave
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(leave.startDate), "MMM d")} -{" "}
                        {format(new Date(leave.endDate), "MMM d, yyyy")}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        leave.status === "APPROVED"
                          ? "bg-green-100 text-green-700"
                          : leave.status === "REJECTED"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {leave.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No recent leave requests</p>
            )}
          </div>

          {/* Recent Absents */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Recent Absent Days
            </h2>
            {data?.recentAbsents && data.recentAbsents.length > 0 ? (
              <div className="space-y-3">
                {data.recentAbsents.slice(0, 5).map((absent: any) => (
                  <div
                    key={absent.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {format(new Date(absent.date), "EEEE, MMM d, yyyy")}
                      </p>
                      <p className="text-xs text-gray-500 truncate max-w-[200px]">
                        {absent.reason}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        absent.isExcused
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {absent.isExcused ? "Excused" : "Unexcused"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No recent absents</p>
            )}
          </div>
        </div>
      </div>
    </ProtectedLayout>
  );
}
