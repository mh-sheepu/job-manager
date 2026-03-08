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
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // Title
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Job Manager Report", pageWidth / 2, yPos, { align: "center" });
    yPos += 8;
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(format(new Date(), "MMMM yyyy"), pageWidth / 2, yPos, { align: "center" });
    yPos += 15;

    // Leave Statistics Section
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(79, 70, 229); // Indigo
    doc.text("Leave Statistics", 14, yPos);
    yPos += 8;

    doc.setTextColor(0, 0, 0);
    autoTable(doc, {
      startY: yPos,
      head: [["Status", "Count"]],
      body: [
        ["Total Requests", data.leaveStats.total.toString()],
        ["Approved", data.leaveStats.approved.toString()],
        ["Pending", data.leaveStats.pending.toString()],
        ["Rejected", data.leaveStats.rejected.toString()],
      ],
      theme: "striped",
      headStyles: { fillColor: [79, 70, 229] },
      margin: { left: 14, right: 14 },
    });
    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Leave by Type
    if (data.leaveStats.byType.length > 0) {
      autoTable(doc, {
        startY: yPos,
        head: [["Leave Type", "Count"]],
        body: data.leaveStats.byType.map((item) => [item.type, item.count.toString()]),
        theme: "striped",
        headStyles: { fillColor: [79, 70, 229] },
        margin: { left: 14, right: 14 },
      });
      yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // Absent Statistics Section
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(239, 68, 68); // Red
    doc.text("Absent Statistics", 14, yPos);
    yPos += 8;

    doc.setTextColor(0, 0, 0);
    autoTable(doc, {
      startY: yPos,
      head: [["Category", "Count"]],
      body: [
        ["Total Absents", data.absentStats.total.toString()],
        ["Excused", data.absentStats.excused.toString()],
        ["Unexcused", data.absentStats.unexcused.toString()],
      ],
      theme: "striped",
      headStyles: { fillColor: [239, 68, 68] },
      margin: { left: 14, right: 14 },
    });
    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Absents by Month
    if (data.absentStats.byMonth.length > 0) {
      autoTable(doc, {
        startY: yPos,
        head: [["Month", "Absents"]],
        body: data.absentStats.byMonth.map((item) => [item.month, item.count.toString()]),
        theme: "striped",
        headStyles: { fillColor: [239, 68, 68] },
        margin: { left: 14, right: 14 },
      });
      yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // Check if we need a new page
    if (yPos > 230) {
      doc.addPage();
      yPos = 20;
    }

    // Project Statistics Section
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(16, 185, 129); // Green
    doc.text("Project Statistics", 14, yPos);
    yPos += 8;

    doc.setTextColor(0, 0, 0);
    autoTable(doc, {
      startY: yPos,
      head: [["Status", "Count"]],
      body: [
        ["Total Projects", data.projectStats.total.toString()],
        ["Active", data.projectStats.active.toString()],
        ["Completed", data.projectStats.completed.toString()],
      ],
      theme: "striped",
      headStyles: { fillColor: [16, 185, 129] },
      margin: { left: 14, right: 14 },
    });
    yPos = (doc as any).lastAutoTable.finalY + 15;

    // Task Statistics Section
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(245, 158, 11); // Amber
    doc.text("Task Statistics", 14, yPos);
    yPos += 8;

    doc.setTextColor(0, 0, 0);
    autoTable(doc, {
      startY: yPos,
      head: [["Status", "Count"]],
      body: [
        ["Total Tasks", data.taskStats.total.toString()],
        ["Completed", data.taskStats.completed.toString()],
        ["In Progress", data.taskStats.inProgress.toString()],
        ["To Do", data.taskStats.todo.toString()],
      ],
      theme: "striped",
      headStyles: { fillColor: [245, 158, 11] },
      margin: { left: 14, right: 14 },
    });
    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Tasks by Priority
    if (data.taskStats.byPriority.length > 0) {
      autoTable(doc, {
        startY: yPos,
        head: [["Priority", "Count"]],
        body: data.taskStats.byPriority.map((item) => [item.priority, item.count.toString()]),
        theme: "striped",
        headStyles: { fillColor: [245, 158, 11] },
        margin: { left: 14, right: 14 },
      });
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Generated on ${format(new Date(), "PPpp")} - Page ${i} of ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: "center" }
      );
    }

    // Save PDF
    doc.save(`report-${format(new Date(), "yyyy-MM")}.pdf`);
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
