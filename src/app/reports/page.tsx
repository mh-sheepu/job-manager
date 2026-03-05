"use client";

import { useEffect, useState } from "react";
import ProtectedLayout from "@/components/ProtectedLayout";
import {
  BarChart3,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Download,
} from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from "date-fns";

interface ReportData {
  leaveStats: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
    byType: { type: string; count: number }[];
  };
  absentStats: {
    total: number;
    excused: number;
    unexcused: number;
    byMonth: { month: string; count: number }[];
  };
  projectStats: {
    total: number;
    active: number;
    completed: number;
  };
  taskStats: {
    total: number;
    completed: number;
    inProgress: number;
    todo: number;
    byPriority: { priority: string; count: number }[];
  };
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("6months");

  useEffect(() => {
    fetchReportData();
  }, [selectedPeriod]);

  const fetchReportData = async () => {
    try {
      const response = await fetch(`/api/reports?period=${selectedPeriod}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    if (!data) return;

    const reportText = `
Job Manager Report - ${format(new Date(), "MMMM yyyy")}
================================================

LEAVE STATISTICS
----------------
Total Requests: ${data.leaveStats.total}
Approved: ${data.leaveStats.approved}
Pending: ${data.leaveStats.pending}
Rejected: ${data.leaveStats.rejected}

Leave by Type:
${data.leaveStats.byType.map((item) => `  - ${item.type}: ${item.count}`).join("\n")}

ABSENT STATISTICS
-----------------
Total Absents: ${data.absentStats.total}
Excused: ${data.absentStats.excused}
Unexcused: ${data.absentStats.unexcused}

PROJECT STATISTICS
------------------
Total Projects: ${data.projectStats.total}
Active: ${data.projectStats.active}
Completed: ${data.projectStats.completed}

TASK STATISTICS
---------------
Total Tasks: ${data.taskStats.total}
Completed: ${data.taskStats.completed}
In Progress: ${data.taskStats.inProgress}
To Do: ${data.taskStats.todo}
    `.trim();

    const blob = new Blob([reportText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${format(new Date(), "yyyy-MM")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const ProgressBar = ({
    value,
    max,
    color,
  }: {
    value: number;
    max: number;
    color: string;
  }) => {
    const percentage = max > 0 ? (value / max) * 100 : 0;
    return (
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className={`h-3 rounded-full ${color}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    );
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

  if (!data) {
    return (
      <ProtectedLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Failed to load report data</p>
        </div>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="1month">Last Month</option>
              <option value="3months">Last 3 Months</option>
              <option value="6months">Last 6 Months</option>
              <option value="1year">Last Year</option>
            </select>
            <button
              onClick={exportReport}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm text-gray-500">Total Leaves</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{data.leaveStats.total}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <span className="text-sm text-gray-500">Total Absents</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{data.absentStats.total}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-sm text-gray-500">Active Projects</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{data.projectStats.active}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-sm text-gray-500">Tasks Completed</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{data.taskStats.completed}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Leave Statistics */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Leave Statistics</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Approved</span>
                  <span className="font-medium text-green-600">
                    {data.leaveStats.approved}
                  </span>
                </div>
                <ProgressBar
                  value={data.leaveStats.approved}
                  max={data.leaveStats.total}
                  color="bg-green-500"
                />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Pending</span>
                  <span className="font-medium text-yellow-600">
                    {data.leaveStats.pending}
                  </span>
                </div>
                <ProgressBar
                  value={data.leaveStats.pending}
                  max={data.leaveStats.total}
                  color="bg-yellow-500"
                />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Rejected</span>
                  <span className="font-medium text-red-600">
                    {data.leaveStats.rejected}
                  </span>
                </div>
                <ProgressBar
                  value={data.leaveStats.rejected}
                  max={data.leaveStats.total}
                  color="bg-red-500"
                />
              </div>
            </div>

            <h3 className="text-sm font-medium text-gray-700 mt-6 mb-3">By Type</h3>
            <div className="space-y-2">
              {data.leaveStats.byType.map((item) => (
                <div
                  key={item.type}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                >
                  <span className="text-sm text-gray-600">{item.type}</span>
                  <span className="text-sm font-medium text-gray-900">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Task Statistics */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Task Statistics</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Completed</span>
                  <span className="font-medium text-green-600">
                    {data.taskStats.completed}
                  </span>
                </div>
                <ProgressBar
                  value={data.taskStats.completed}
                  max={data.taskStats.total}
                  color="bg-green-500"
                />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">In Progress</span>
                  <span className="font-medium text-blue-600">
                    {data.taskStats.inProgress}
                  </span>
                </div>
                <ProgressBar
                  value={data.taskStats.inProgress}
                  max={data.taskStats.total}
                  color="bg-blue-500"
                />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">To Do</span>
                  <span className="font-medium text-gray-600">{data.taskStats.todo}</span>
                </div>
                <ProgressBar
                  value={data.taskStats.todo}
                  max={data.taskStats.total}
                  color="bg-gray-400"
                />
              </div>
            </div>

            <h3 className="text-sm font-medium text-gray-700 mt-6 mb-3">By Priority</h3>
            <div className="grid grid-cols-2 gap-2">
              {data.taskStats.byPriority.map((item) => (
                <div
                  key={item.priority}
                  className={`p-3 rounded-lg text-center ${
                    item.priority === "URGENT"
                      ? "bg-red-50 text-red-700"
                      : item.priority === "HIGH"
                      ? "bg-orange-50 text-orange-700"
                      : item.priority === "MEDIUM"
                      ? "bg-yellow-50 text-yellow-700"
                      : "bg-gray-50 text-gray-700"
                  }`}
                >
                  <p className="text-2xl font-bold">{item.count}</p>
                  <p className="text-xs">{item.priority}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Absent Trend */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Absent Trend</h2>
            <div className="flex items-end justify-between h-48 gap-2">
              {data.absentStats.byMonth.map((item) => (
                <div key={item.month} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-red-400 rounded-t"
                    style={{
                      height: `${Math.max(
                        (item.count / Math.max(...data.absentStats.byMonth.map((m) => m.count), 1)) *
                          120,
                        4
                      )}px`,
                    }}
                  ></div>
                  <span className="text-xs text-gray-500 mt-2">{item.month}</span>
                  <span className="text-xs font-medium text-gray-700">{item.count}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span className="text-gray-600">Excused: {data.absentStats.excused}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span className="text-gray-600">
                    Unexcused: {data.absentStats.unexcused}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Project Overview */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Overview</h2>
            <div className="flex items-center justify-center h-48">
              <div className="relative w-40 h-40">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="12"
                  />
                  {data.projectStats.total > 0 && (
                    <>
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#22c55e"
                        strokeWidth="12"
                        strokeDasharray={`${
                          (data.projectStats.completed / data.projectStats.total) * 251.2
                        } 251.2`}
                        transform="rotate(-90 50 50)"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#6366f1"
                        strokeWidth="12"
                        strokeDasharray={`${
                          (data.projectStats.active / data.projectStats.total) * 251.2
                        } 251.2`}
                        strokeDashoffset={`${
                          -(data.projectStats.completed / data.projectStats.total) * 251.2
                        }`}
                        transform="rotate(-90 50 50)"
                      />
                    </>
                  )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-gray-900">
                    {data.projectStats.total}
                  </span>
                  <span className="text-xs text-gray-500">Total</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-indigo-500 rounded"></div>
                <span className="text-sm text-gray-600">
                  Active ({data.projectStats.active})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span className="text-sm text-gray-600">
                  Completed ({data.projectStats.completed})
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedLayout>
  );
}
