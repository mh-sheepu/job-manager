"use client";

import { useEffect, useState, useRef } from "react";
import ProtectedLayout from "@/components/ProtectedLayout";
import { Calendar, Plus, Trash2, X, Paperclip, Eye, Upload } from "lucide-react";
import { format } from "date-fns";
import FileUpload from "@/components/FileUpload";

interface Attachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
  uploader: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface Leave {
  id: string;
  startDate: string;
  endDate: string;
  type: string;
  reason: string;
  status: string;
  createdAt: string;
  attachments?: Attachment[];
}

interface LeaveBalance {
  totalLeaves: number;
  usedLeaves: number;
  sickLeaves: number;
  usedSick: number;
  casualLeaves: number;
  usedCasual: number;
}

export default function LeavesPage() {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    type: "ANNUAL",
    reason: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      const response = await fetch("/api/leaves");
      const data = await response.json();
      setLeaves(data.leaves || []);
      setLeaveBalance(data.leaveBalance);
    } catch (error) {
      console.error("Error fetching leaves:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttachments = async (leaveId: string) => {
    try {
      const response = await fetch(`/api/attachments?leaveId=${leaveId}`);
      const data = await response.json();
      setAttachments(data);
    } catch (error) {
      console.error("Error fetching attachments:", error);
    }
  };

  const handleUploadAttachment = async (file: File) => {
    if (!selectedLeave) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("leaveId", selectedLeave.id);

    const response = await fetch("/api/attachments", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Upload failed");
    }

    await fetchAttachments(selectedLeave.id);
    fetchLeaves();
  };

  const handleDeleteAttachment = async (id: string) => {
    const response = await fetch(`/api/attachments?id=${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Delete failed");
    }

    if (selectedLeave) {
      await fetchAttachments(selectedLeave.id);
      fetchLeaves();
    }
  };

  const openLeaveDetails = async (leave: Leave) => {
    setSelectedLeave(leave);
    await fetchAttachments(leave.id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch("/api/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const newLeave = await response.json();
        
        // Upload pending files if any
        if (pendingFiles.length > 0) {
          for (const file of pendingFiles) {
            const uploadData = new FormData();
            uploadData.append("file", file);
            uploadData.append("leaveId", newLeave.id);
            await fetch("/api/attachments", {
              method: "POST",
              body: uploadData,
            });
          }
        }
        
        setShowModal(false);
        setFormData({
          startDate: "",
          endDate: "",
          type: "ANNUAL",
          reason: "",
        });
        setPendingFiles([]);
        fetchLeaves();
      }
    } catch (error) {
      console.error("Error creating leave:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setPendingFiles((prev) => [...prev, ...newFiles].slice(0, 5)); // Max 5 files
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removePendingFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this leave request?")) return;

    try {
      const response = await fetch(`/api/leaves?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchLeaves();
      }
    } catch (error) {
      console.error("Error deleting leave:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-700";
      case "REJECTED":
        return "bg-red-100 text-red-700";
      default:
        return "bg-yellow-100 text-yellow-700";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "SICK":
        return "bg-blue-100 text-blue-700";
      case "CASUAL":
        return "bg-purple-100 text-purple-700";
      case "UNPAID":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-indigo-100 text-indigo-700";
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

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus size={20} />
            Request Leave
          </button>
        </div>

        {/* Leave Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-100 rounded-full">
                <Calendar className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Remaining</p>
                <p className="text-2xl font-bold text-indigo-600">
                  {(leaveBalance?.totalLeaves || 0) -
                    (leaveBalance?.usedLeaves || 0)}
                </p>
                <p className="text-xs text-gray-400">
                  {leaveBalance?.usedLeaves} used of {leaveBalance?.totalLeaves}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Sick Leave</p>
                <p className="text-2xl font-bold text-blue-600">
                  {(leaveBalance?.sickLeaves || 0) -
                    (leaveBalance?.usedSick || 0)}
                </p>
                <p className="text-xs text-gray-400">
                  {leaveBalance?.usedSick} used of {leaveBalance?.sickLeaves}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-full">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Casual Leave</p>
                <p className="text-2xl font-bold text-purple-600">
                  {(leaveBalance?.casualLeaves || 0) -
                    (leaveBalance?.usedCasual || 0)}
                </p>
                <p className="text-xs text-gray-400">
                  {leaveBalance?.usedCasual} used of {leaveBalance?.casualLeaves}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Leave List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">
              Leave Requests
            </h2>
          </div>

          {leaves.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No leave requests yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reason
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attachments
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {leaves.map((leave) => (
                    <tr key={leave.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${getTypeColor(
                            leave.type
                          )}`}
                        >
                          {leave.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {format(new Date(leave.startDate), "MMM d, yyyy")} -{" "}
                        {format(new Date(leave.endDate), "MMM d, yyyy")}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {leave.reason}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {leave.attachments && leave.attachments.length > 0 ? (
                          <span className="flex items-center gap-1 text-sm text-indigo-600">
                            <Paperclip size={14} />
                            {leave.attachments.length}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                            leave.status
                          )}`}
                        >
                          {leave.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openLeaveDetails(leave)}
                            className="text-indigo-500 hover:text-indigo-700 transition-colors"
                            title="View details & attachments"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(leave.id)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">
                  Request Leave
                </h3>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setPendingFiles([]);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Leave Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                  >
                    <option value="ANNUAL">Annual Leave</option>
                    <option value="SICK">Sick Leave</option>
                    <option value="CASUAL">Casual Leave</option>
                    <option value="UNPAID">Unpaid Leave</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) =>
                        setFormData({ ...formData, startDate: e.target.value })
                      }
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) =>
                        setFormData({ ...formData, endDate: e.target.value })
                      }
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason
                  </label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) =>
                      setFormData({ ...formData, reason: e.target.value })
                    }
                    required
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-gray-900"
                    placeholder="Reason for leave..."
                  />
                </div>

                {/* Attachments (Optional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Attachments <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                    multiple
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
                  >
                    <Upload size={18} />
                    <span>Add medical certificate or documents</span>
                  </button>
                  {pendingFiles.length > 0 && (
                    <ul className="mt-3 space-y-2">
                      {pendingFiles.map((file, index) => (
                        <li
                          key={index}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Paperclip size={14} className="text-gray-400 flex-shrink-0" />
                            <span className="truncate text-gray-700">{file.name}</span>
                            <span className="text-gray-400 text-xs flex-shrink-0">
                              ({formatFileSize(file.size)})
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removePendingFile(index)}
                            className="text-gray-400 hover:text-red-500 p-1"
                          >
                            <X size={16} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setPendingFiles([]);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    {submitting ? "Submitting..." : "Submit Request"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Leave Details Modal */}
        {selectedLeave && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
                <h3 className="text-lg font-semibold text-gray-900">
                  Leave Details
                </h3>
                <button
                  onClick={() => {
                    setSelectedLeave(null);
                    setAttachments([]);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Leave Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Type</p>
                    <span
                      className={`inline-block mt-1 px-2 py-1 text-xs rounded-full ${getTypeColor(
                        selectedLeave.type
                      )}`}
                    >
                      {selectedLeave.type}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <span
                      className={`inline-block mt-1 px-2 py-1 text-xs rounded-full ${getStatusColor(
                        selectedLeave.status
                      )}`}
                    >
                      {selectedLeave.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Start Date</p>
                    <p className="mt-1 text-gray-900">
                      {format(new Date(selectedLeave.startDate), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">End Date</p>
                    <p className="mt-1 text-gray-900">
                      {format(new Date(selectedLeave.endDate), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Reason</p>
                  <p className="mt-1 text-gray-900">{selectedLeave.reason}</p>
                </div>

                {/* Attachments */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-3">
                    Attachments (Medical certificates, documents, etc.)
                  </p>
                  <FileUpload
                    attachments={attachments}
                    onUpload={handleUploadAttachment}
                    onDelete={handleDeleteAttachment}
                    disabled={selectedLeave.status !== "PENDING"}
                  />
                  {selectedLeave.status !== "PENDING" && (
                    <p className="mt-2 text-xs text-gray-500">
                      * Attachments can only be modified for pending leave requests
                    </p>
                  )}
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    onClick={() => {
                      setSelectedLeave(null);
                      setAttachments([]);
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}
