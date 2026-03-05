"use client";

import { useEffect, useState } from "react";
import ProtectedLayout from "@/components/ProtectedLayout";
import { CalendarX, Plus, Trash2, X, Edit2 } from "lucide-react";
import { format } from "date-fns";

interface Absent {
  id: string;
  date: string;
  reason: string;
  isExcused: boolean;
  createdAt: string;
}

export default function AbsentsPage() {
  const [absents, setAbsents] = useState<Absent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAbsent, setEditingAbsent] = useState<Absent | null>(null);
  const [formData, setFormData] = useState({
    date: "",
    reason: "",
    isExcused: false,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAbsents();
  }, []);

  const fetchAbsents = async () => {
    try {
      const response = await fetch("/api/absents");
      const data = await response.json();
      setAbsents(data || []);
    } catch (error) {
      console.error("Error fetching absents:", error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (absent?: Absent) => {
    if (absent) {
      setEditingAbsent(absent);
      setFormData({
        date: absent.date.split("T")[0],
        reason: absent.reason,
        isExcused: absent.isExcused,
      });
    } else {
      setEditingAbsent(null);
      setFormData({
        date: "",
        reason: "",
        isExcused: false,
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAbsent(null);
    setFormData({
      date: "",
      reason: "",
      isExcused: false,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = "/api/absents";
      const method = editingAbsent ? "PUT" : "POST";
      const body = editingAbsent
        ? { ...formData, id: editingAbsent.id }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        closeModal();
        fetchAbsents();
      }
    } catch (error) {
      console.error("Error saving absent:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this absent record?")) return;

    try {
      const response = await fetch(`/api/absents?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchAbsents();
      }
    } catch (error) {
      console.error("Error deleting absent:", error);
    }
  };

  // Group absents by month
  const groupedAbsents = absents.reduce((acc, absent) => {
    const monthYear = format(new Date(absent.date), "MMMM yyyy");
    if (!acc[monthYear]) {
      acc[monthYear] = [];
    }
    acc[monthYear].push(absent);
    return acc;
  }, {} as Record<string, Absent[]>);

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
          <h1 className="text-2xl font-bold text-gray-900">Absent Days</h1>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus size={20} />
            Add Absent Day
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-full">
                <CalendarX className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Absents</p>
                <p className="text-2xl font-bold text-red-600">
                  {absents.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-full">
                <CalendarX className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Excused</p>
                <p className="text-2xl font-bold text-green-600">
                  {absents.filter((a) => a.isExcused).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-full">
                <CalendarX className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Unexcused</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {absents.filter((a) => !a.isExcused).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Absents List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">
              Absent Records
            </h2>
          </div>

          {absents.length === 0 ? (
            <div className="p-12 text-center">
              <CalendarX className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No absent records yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {Object.entries(groupedAbsents).map(([monthYear, monthAbsents]) => (
                <div key={monthYear}>
                  <div className="px-6 py-3 bg-gray-50">
                    <h3 className="text-sm font-medium text-gray-600">
                      {monthYear}
                    </h3>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {monthAbsents.map((absent) => (
                      <div
                        key={absent.id}
                        className="px-6 py-4 flex items-center justify-between hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-gray-100 flex flex-col items-center justify-center">
                            <span className="text-xs text-gray-500">
                              {format(new Date(absent.date), "MMM")}
                            </span>
                            <span className="text-lg font-bold text-gray-900">
                              {format(new Date(absent.date), "d")}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {format(new Date(absent.date), "EEEE")}
                            </p>
                            <p className="text-sm text-gray-500 max-w-md truncate">
                              {absent.reason}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-3 py-1 text-xs rounded-full ${
                              absent.isExcused
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {absent.isExcused ? "Excused" : "Unexcused"}
                          </span>
                          <button
                            onClick={() => openModal(absent)}
                            className="text-gray-400 hover:text-indigo-600 transition-colors"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(absent.id)}
                            className="text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingAbsent ? "Edit Absent Record" : "Add Absent Day"}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                  />
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
                    placeholder="Reason for absence..."
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isExcused"
                    checked={formData.isExcused}
                    onChange={(e) =>
                      setFormData({ ...formData, isExcused: e.target.checked })
                    }
                    className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                  />
                  <label
                    htmlFor="isExcused"
                    className="text-sm text-gray-700"
                  >
                    Mark as excused absence
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    {submitting
                      ? "Saving..."
                      : editingAbsent
                      ? "Update"
                      : "Add Record"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}
