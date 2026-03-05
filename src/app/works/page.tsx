"use client";

import { useEffect, useState } from "react";
import ProtectedLayout from "@/components/ProtectedLayout";
import {
  FolderKanban,
  Plus,
  Trash2,
  X,
  ChevronDown,
  ChevronRight,
  Edit2,
  MoreVertical,
  ListPlus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Paperclip,
  Eye,
} from "lucide-react";
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

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  attachments?: Attachment[];
}

interface Section {
  id: string;
  name: string;
  description: string | null;
  order: number;
  tasks: Task[];
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  sections: Section[];
}

export default function WorksPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
    new Set()
  );
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set()
  );

  // Modal states
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    null
  );
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [taskAttachments, setTaskAttachments] = useState<Attachment[]>([]);

  // Form data
  const [projectForm, setProjectForm] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    status: "ACTIVE",
  });
  const [sectionForm, setSectionForm] = useState({
    name: "",
    description: "",
  });
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    status: "TODO",
    dueDate: "",
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects");
      const data = await response.json();
      setProjects(data || []);
      // Auto-expand all projects initially
      setExpandedProjects(new Set(data.map((p: Project) => p.id)));
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleProject = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  // Project CRUD
  const openProjectModal = (project?: Project) => {
    if (project) {
      setEditingProject(project);
      setProjectForm({
        name: project.name,
        description: project.description || "",
        startDate: project.startDate?.split("T")[0] || "",
        endDate: project.endDate?.split("T")[0] || "",
        status: project.status,
      });
    } else {
      setEditingProject(null);
      setProjectForm({
        name: "",
        description: "",
        startDate: "",
        endDate: "",
        status: "ACTIVE",
      });
    }
    setShowProjectModal(true);
  };

  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const method = editingProject ? "PUT" : "POST";
      const body = editingProject
        ? { ...projectForm, id: editingProject.id }
        : projectForm;

      const response = await fetch("/api/projects", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setShowProjectModal(false);
        fetchProjects();
      }
    } catch (error) {
      console.error("Error saving project:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteProject = async (id: string) => {
    if (!confirm("Delete this project and all its contents?")) return;

    try {
      await fetch(`/api/projects?id=${id}`, { method: "DELETE" });
      fetchProjects();
    } catch (error) {
      console.error("Error deleting project:", error);
    }
  };

  // Section CRUD
  const openSectionModal = (projectId: string) => {
    setSelectedProjectId(projectId);
    setSectionForm({ name: "", description: "" });
    setShowSectionModal(true);
  };

  const handleSectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch("/api/sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...sectionForm,
          projectId: selectedProjectId,
        }),
      });

      if (response.ok) {
        setShowSectionModal(false);
        fetchProjects();
      }
    } catch (error) {
      console.error("Error creating section:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteSection = async (id: string) => {
    if (!confirm("Delete this section and all its tasks?")) return;

    try {
      await fetch(`/api/sections?id=${id}`, { method: "DELETE" });
      fetchProjects();
    } catch (error) {
      console.error("Error deleting section:", error);
    }
  };

  // Task CRUD
  const openTaskModal = (sectionId: string, task?: Task) => {
    setSelectedSectionId(sectionId);
    if (task) {
      setEditingTask(task);
      setTaskForm({
        title: task.title,
        description: task.description || "",
        priority: task.priority,
        status: task.status,
        dueDate: task.dueDate?.split("T")[0] || "",
      });
    } else {
      setEditingTask(null);
      setTaskForm({
        title: "",
        description: "",
        priority: "MEDIUM",
        status: "TODO",
        dueDate: "",
      });
    }
    setShowTaskModal(true);
  };

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const method = editingTask ? "PUT" : "POST";
      const body = editingTask
        ? { ...taskForm, id: editingTask.id, sectionId: selectedSectionId }
        : { ...taskForm, sectionId: selectedSectionId };

      const response = await fetch("/api/tasks", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setShowTaskModal(false);
        fetchProjects();
      }
    } catch (error) {
      console.error("Error saving task:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteTask = async (id: string) => {
    if (!confirm("Delete this task?")) return;

    try {
      await fetch(`/api/tasks?id=${id}`, { method: "DELETE" });
      fetchProjects();
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  // Task Attachments
  const fetchTaskAttachments = async (taskId: string) => {
    try {
      const response = await fetch(`/api/attachments?taskId=${taskId}`);
      const data = await response.json();
      setTaskAttachments(data);
    } catch (error) {
      console.error("Error fetching attachments:", error);
    }
  };

  const openTaskDetails = async (task: Task) => {
    setViewingTask(task);
    await fetchTaskAttachments(task.id);
  };

  const handleUploadTaskAttachment = async (file: File) => {
    if (!viewingTask) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("taskId", viewingTask.id);

    const response = await fetch("/api/attachments", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Upload failed");
    }

    await fetchTaskAttachments(viewingTask.id);
    fetchProjects();
  };

  const handleDeleteTaskAttachment = async (id: string) => {
    const response = await fetch(`/api/attachments?id=${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Delete failed");
    }

    if (viewingTask) {
      await fetchTaskAttachments(viewingTask.id);
      fetchProjects();
    }
  };

  const updateTaskStatus = async (taskId: string, status: string) => {
    try {
      await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, status }),
      });
      fetchProjects();
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "DONE":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "IN_PROGRESS":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "REVIEW":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "bg-red-100 text-red-700";
      case "HIGH":
        return "bg-orange-100 text-orange-700";
      case "MEDIUM":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getProjectStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-700";
      case "ON_HOLD":
        return "bg-yellow-100 text-yellow-700";
      case "CANCELLED":
        return "bg-red-100 text-red-700";
      default:
        return "bg-blue-100 text-blue-700";
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
          <h1 className="text-2xl font-bold text-gray-900">Works / Projects</h1>
          <button
            onClick={() => openProjectModal()}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus size={20} />
            New Project
          </button>
        </div>

        {/* Projects List */}
        {projects.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <FolderKanban className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No projects yet</p>
            <button
              onClick={() => openProjectModal()}
              className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Create your first project
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
              >
                {/* Project Header */}
                <div
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleProject(project.id)}
                >
                  <div className="flex items-center gap-3">
                    {expandedProjects.has(project.id) ? (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    )}
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <FolderKanban className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {project.name}
                      </h3>
                      {project.description && (
                        <p className="text-sm text-gray-500 truncate max-w-md">
                          {project.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${getProjectStatusColor(
                        project.status
                      )}`}
                    >
                      {project.status.replace("_", " ")}
                    </span>
                    <span className="text-sm text-gray-500">
                      {project.sections.length} sections
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openProjectModal(project);
                      }}
                      className="p-1 text-gray-400 hover:text-indigo-600"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteProject(project.id);
                      }}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Project Content */}
                {expandedProjects.has(project.id) && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-medium text-gray-600">
                        Sections
                      </h4>
                      <button
                        onClick={() => openSectionModal(project.id)}
                        className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
                      >
                        <ListPlus size={16} />
                        Add Section
                      </button>
                    </div>

                    {project.sections.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4">
                        No sections yet
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {project.sections.map((section) => (
                          <div
                            key={section.id}
                            className="bg-white rounded-lg border border-gray-200 overflow-hidden"
                          >
                            {/* Section Header */}
                            <div
                              className="p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                              onClick={() => toggleSection(section.id)}
                            >
                              <div className="flex items-center gap-2">
                                {expandedSections.has(section.id) ? (
                                  <ChevronDown className="h-4 w-4 text-gray-400" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-gray-400" />
                                )}
                                <span className="font-medium text-gray-800">
                                  {section.name}
                                </span>
                                <span className="text-xs text-gray-400">
                                  ({section.tasks.length} tasks)
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openTaskModal(section.id);
                                  }}
                                  className="text-indigo-600 hover:text-indigo-700"
                                >
                                  <Plus size={16} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteSection(section.id);
                                  }}
                                  className="text-gray-400 hover:text-red-600"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>

                            {/* Tasks */}
                            {expandedSections.has(section.id) &&
                              section.tasks.length > 0 && (
                                <div className="border-t border-gray-100 divide-y divide-gray-50">
                                  {section.tasks.map((task) => (
                                    <div
                                      key={task.id}
                                      className="px-4 py-3 flex items-center justify-between hover:bg-gray-50"
                                    >
                                      <div className="flex items-center gap-3">
                                        <button
                                          onClick={() =>
                                            updateTaskStatus(
                                              task.id,
                                              task.status === "DONE"
                                                ? "TODO"
                                                : "DONE"
                                            )
                                          }
                                        >
                                          {getStatusIcon(task.status)}
                                        </button>
                                        <div>
                                          <p
                                            className={`text-sm font-medium ${
                                              task.status === "DONE"
                                                ? "text-gray-400 line-through"
                                                : "text-gray-900"
                                            }`}
                                          >
                                            {task.title}
                                          </p>
                                          {task.dueDate && (
                                            <p className="text-xs text-gray-400">
                                              Due:{" "}
                                              {format(
                                                new Date(task.dueDate),
                                                "MMM d, yyyy"
                                              )}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {task.attachments &&
                                          task.attachments.length > 0 && (
                                            <span className="flex items-center gap-0.5 text-xs text-indigo-600">
                                              <Paperclip size={12} />
                                              {task.attachments.length}
                                            </span>
                                          )}
                                        <span
                                          className={`px-2 py-0.5 text-xs rounded ${getPriorityColor(
                                            task.priority
                                          )}`}
                                        >
                                          {task.priority}
                                        </span>
                                        <select
                                          value={task.status}
                                          onChange={(e) =>
                                            updateTaskStatus(
                                              task.id,
                                              e.target.value
                                            )
                                          }
                                          className="text-xs border border-gray-200 rounded px-2 py-1 bg-white text-gray-700"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <option value="TODO">To Do</option>
                                          <option value="IN_PROGRESS">
                                            In Progress
                                          </option>
                                          <option value="REVIEW">Review</option>
                                          <option value="DONE">Done</option>
                                        </select>
                                        <button
                                          onClick={() => openTaskDetails(task)}
                                          className="text-gray-400 hover:text-indigo-600"
                                          title="View details & attachments"
                                        >
                                          <Eye size={14} />
                                        </button>
                                        <button
                                          onClick={() =>
                                            openTaskModal(section.id, task)
                                          }
                                          className="text-gray-400 hover:text-indigo-600"
                                          title="Edit task"
                                        >
                                          <Edit2 size={14} />
                                        </button>
                                        <button
                                          onClick={() => deleteTask(task.id)}
                                          className="text-gray-400 hover:text-red-600"
                                          title="Delete task"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Project Modal */}
        {showProjectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingProject ? "Edit Project" : "New Project"}
                </h3>
                <button
                  onClick={() => setShowProjectModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleProjectSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    value={projectForm.name}
                    onChange={(e) =>
                      setProjectForm({ ...projectForm, name: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                    placeholder="Project name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={projectForm.description}
                    onChange={(e) =>
                      setProjectForm({
                        ...projectForm,
                        description: e.target.value,
                      })
                    }
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-gray-900"
                    placeholder="Project description..."
                  />
                </div>

                {editingProject && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={projectForm.status}
                      onChange={(e) =>
                        setProjectForm({
                          ...projectForm,
                          status: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="ON_HOLD">On Hold</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={projectForm.startDate}
                      onChange={(e) =>
                        setProjectForm({
                          ...projectForm,
                          startDate: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={projectForm.endDate}
                      onChange={(e) =>
                        setProjectForm({
                          ...projectForm,
                          endDate: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowProjectModal(false)}
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
                      : editingProject
                      ? "Update"
                      : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Section Modal */}
        {showSectionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">
                  Add Section
                </h3>
                <button
                  onClick={() => setShowSectionModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSectionSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Section Name *
                  </label>
                  <input
                    type="text"
                    value={sectionForm.name}
                    onChange={(e) =>
                      setSectionForm({ ...sectionForm, name: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                    placeholder="e.g., Design, Development, Testing"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={sectionForm.description}
                    onChange={(e) =>
                      setSectionForm({
                        ...sectionForm,
                        description: e.target.value,
                      })
                    }
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-gray-900"
                    placeholder="Optional description..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowSectionModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    {submitting ? "Creating..." : "Create Section"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Task Modal */}
        {showTaskModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingTask ? "Edit Task" : "New Task"}
                </h3>
                <button
                  onClick={() => setShowTaskModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleTaskSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Task Title *
                  </label>
                  <input
                    type="text"
                    value={taskForm.title}
                    onChange={(e) =>
                      setTaskForm({ ...taskForm, title: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                    placeholder="Task title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={taskForm.description}
                    onChange={(e) =>
                      setTaskForm({ ...taskForm, description: e.target.value })
                    }
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-gray-900"
                    placeholder="Task description..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      value={taskForm.priority}
                      onChange={(e) =>
                        setTaskForm({ ...taskForm, priority: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={taskForm.status}
                      onChange={(e) =>
                        setTaskForm({ ...taskForm, status: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                    >
                      <option value="TODO">To Do</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="REVIEW">Review</option>
                      <option value="DONE">Done</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={(e) =>
                      setTaskForm({ ...taskForm, dueDate: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowTaskModal(false)}
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
                      : editingTask
                      ? "Update"
                      : "Create Task"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Task Details Modal */}
        {viewingTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
                <h3 className="text-lg font-semibold text-gray-900">
                  Task Details
                </h3>
                <button
                  onClick={() => {
                    setViewingTask(null);
                    setTaskAttachments([]);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Task Info */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900">
                    {viewingTask.title}
                  </h4>
                  {viewingTask.description && (
                    <p className="mt-1 text-sm text-gray-600">
                      {viewingTask.description}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <div className="mt-1 flex items-center gap-2">
                      {getStatusIcon(viewingTask.status)}
                      <span className="text-sm text-gray-900">
                        {viewingTask.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Priority</p>
                    <span
                      className={`inline-block mt-1 px-2 py-1 text-xs rounded ${getPriorityColor(
                        viewingTask.priority
                      )}`}
                    >
                      {viewingTask.priority}
                    </span>
                  </div>
                  {viewingTask.dueDate && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-500">Due Date</p>
                      <p className="mt-1 text-gray-900">
                        {format(new Date(viewingTask.dueDate), "MMMM d, yyyy")}
                      </p>
                    </div>
                  )}
                </div>

                {/* Attachments */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-3">
                    Attachments
                  </p>
                  <FileUpload
                    attachments={taskAttachments}
                    onUpload={handleUploadTaskAttachment}
                    onDelete={handleDeleteTaskAttachment}
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    onClick={() => {
                      setViewingTask(null);
                      setTaskAttachments([]);
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
