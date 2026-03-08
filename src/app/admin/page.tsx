"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ProtectedLayout from "@/components/ProtectedLayout";
import {
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  AlertTriangle,
  Search,
  Filter,
  Eye,
  UserCheck,
  UserX,
} from "lucide-react";
import { format } from "date-fns";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  department: string | null;
  createdAt: string;
}

interface LeaveRequest {
  id: string;
  startDate: string;
  endDate: string;
  type: string;
  reason: string;
  status: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    department: string | null;
  };
}

interface DashboardStats {
  totalUsers: number;
  pendingLeaves: number;
  approvedLeavesMonth: number;
  totalAbsentsMonth: number;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"requests" | "users" | "all-leaves">("requests");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [allLeaves, setAllLeaves] = useState<LeaveRequest[]>([]);

  useEffect(() => {
    if (status === "loading") return;
    
    const userRole = (session?.user as any)?.role;
    if (!session || (userRole !== "admin" && userRole !== "hr")) {
      router.push("/dashboard");
      return;
    }
    
    fetchDashboardData();
  }, [session, status, router]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/admin/dashboard");
      if (!response.ok) throw new Error("Failed to fetch");
      
      const data = await response.json();
      setStats(data.stats);
      setLeaveRequests(data.recentLeaveRequests);
      setAllUsers(data.allUsers);
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllLeaves = async () => {
    try {
      const response = await fetch("/api/admin/leaves");
      if (response.ok) {
        const data = await response.json();
        setAllLeaves(data);
      }
    } catch (error) {
      console.error("Error fetching all leaves:", error);
    }
  };

  useEffect(() => {
    if (activeTab === "all-leaves" && allLeaves.length === 0) {
      fetchAllLeaves();
    }
  }, [activeTab]);

  const handleLeaveAction = async (leaveId: string, newStatus: "APPROVED" | "REJECTED") => {
    setProcessingId(leaveId);
    try {
      const response = await fetch("/api/admin/dashboard", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leaveId, status: newStatus }),
      });

      if (response.ok) {
        // Refresh data
        fetchDashboardData();
        if (activeTab === "all-leaves") {
          fetchAllLeaves();
        }
      }
    } catch (error) {
      console.error("Error updating leave:", error);
    } finally {
      setProcessingId(null);
    }
  };

  const filteredUsers = allUsers.filter((user) => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.department?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const filteredLeaves = (activeTab === "all-leaves" ? allLeaves : leaveRequests).filter((leave) => {
    const matchesSearch =
      leave.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      leave.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      leave.reason.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || leave.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <ProtectedLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-500">Manage employees and leave requests</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 text-sm font-medium bg-indigo-100 text-indigo-700 rounded-full">
              {(session?.user as any)?.role?.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalUsers || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pending Requests</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.pendingLeaves || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Approved (Month)</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.approvedLeavesMonth || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Absents (Month)</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalAbsentsMonth || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab("requests")}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "requests"
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Clock size={18} />
                  Pending Requests
                  {(stats?.pendingLeaves || 0) > 0 && (
                    <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded-full">
                      {stats?.pendingLeaves}
                    </span>
                  )}
                </div>
              </button>
              <button
                onClick={() => setActiveTab("all-leaves")}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "all-leaves"
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Calendar size={18} />
                  All Leaves
                </div>
              </button>
              <button
                onClick={() => setActiveTab("users")}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "users"
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Users size={18} />
                  All Users
                </div>
              </button>
            </nav>
          </div>

          {/* Search and Filter */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              {(activeTab === "requests" || activeTab === "all-leaves") && (
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            {activeTab === "users" ? (
              /* Users Table */
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-500 border-b">
                      <th className="pb-3 font-medium">Name</th>
                      <th className="pb-3 font-medium">Email</th>
                      <th className="pb-3 font-medium">Role</th>
                      <th className="pb-3 font-medium">Department</th>
                      <th className="pb-3 font-medium">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-indigo-600">
                                {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                              </span>
                            </div>
                            <span className="font-medium text-gray-900">
                              {user.name || "No name"}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 text-gray-600">{user.email}</td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              user.role === "admin"
                                ? "bg-purple-100 text-purple-700"
                                : user.role === "hr"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="py-3 text-gray-600">{user.department || "-"}</td>
                        <td className="py-3 text-gray-500 text-sm">
                          {format(new Date(user.createdAt), "MMM d, yyyy")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredUsers.length === 0 && (
                  <div className="text-center py-8 text-gray-500">No users found</div>
                )}
              </div>
            ) : (
              /* Leave Requests Table */
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-500 border-b">
                      <th className="pb-3 font-medium">Employee</th>
                      <th className="pb-3 font-medium">Type</th>
                      <th className="pb-3 font-medium">Dates</th>
                      <th className="pb-3 font-medium">Reason</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredLeaves.map((leave) => (
                      <tr key={leave.id} className="hover:bg-gray-50">
                        <td className="py-3">
                          <div>
                            <p className="font-medium text-gray-900">
                              {leave.user.name || "Unknown"}
                            </p>
                            <p className="text-sm text-gray-500">{leave.user.email}</p>
                            {leave.user.department && (
                              <p className="text-xs text-gray-400">{leave.user.department}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              leave.type === "ANNUAL"
                                ? "bg-blue-100 text-blue-700"
                                : leave.type === "SICK"
                                ? "bg-red-100 text-red-700"
                                : leave.type === "CASUAL"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {leave.type}
                          </span>
                        </td>
                        <td className="py-3 text-sm text-gray-600">
                          <div>
                            {format(new Date(leave.startDate), "MMM d")} -{" "}
                            {format(new Date(leave.endDate), "MMM d, yyyy")}
                          </div>
                          <div className="text-xs text-gray-400">
                            {Math.ceil(
                              (new Date(leave.endDate).getTime() -
                                new Date(leave.startDate).getTime()) /
                                (1000 * 60 * 60 * 24)
                            ) + 1}{" "}
                            days
                          </div>
                        </td>
                        <td className="py-3 text-sm text-gray-600 max-w-xs truncate">
                          {leave.reason}
                        </td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              leave.status === "PENDING"
                                ? "bg-yellow-100 text-yellow-700"
                                : leave.status === "APPROVED"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {leave.status}
                          </span>
                        </td>
                        <td className="py-3">
                          {leave.status === "PENDING" ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleLeaveAction(leave.id, "APPROVED")}
                                disabled={processingId === leave.id}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                                title="Approve"
                              >
                                <UserCheck size={18} />
                              </button>
                              <button
                                onClick={() => handleLeaveAction(leave.id, "REJECTED")}
                                disabled={processingId === leave.id}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                title="Reject"
                              >
                                <UserX size={18} />
                              </button>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredLeaves.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    {activeTab === "requests"
                      ? "No pending leave requests"
                      : "No leave records found"}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedLayout>
  );
}
