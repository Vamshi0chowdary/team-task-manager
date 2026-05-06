import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import AppNav from '../components/AppNav';
import InlineConfirm from '../components/InlineConfirm';
import Select from '../components/Select';
import useAppStore from '../store/useAppStore';
import { isPastDate } from '../utils/validation';

const priorityStyles = {
  HIGH: 'bg-rose-100 text-rose-700',
  MEDIUM: 'bg-amber-100 text-amber-700',
  LOW: 'bg-emerald-100 text-emerald-700',
};

const statusLabels = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
};

const statusColumnStyles = {
  TODO: 'bg-slate-100',
  IN_PROGRESS: 'bg-blue-50',
  DONE: 'bg-emerald-50',
};

const sortMembersForAssign = (members) =>
  [...members].sort((left, right) => {
    if (left.role === right.role) {
      return left.name.localeCompare(right.name);
    }

    if (left.role === 'ADMIN') return -1;
    if (right.role === 'ADMIN') return 1;
    return 0;
  });

const emptyForm = {
  title: '',
  description: '',
  dueDate: '',
  priority: 'MEDIUM',
  assignedToId: '',
};

const formatDate = (value) =>
  new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

const toInputDate = (value) => {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const Spinner = () => (
  <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
);

const EditIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm2.92 2.83H5v-.92l9.06-9.06.92.92L5.92 20.08zM20.71 7.04a1 1 0 0 0 0-1.41L18.37 3.29a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
  </svg>
);

const DeleteIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
    <path d="M6 7h12l-1 14H7L6 7zm3-3h6l1 2H8l1-2zM4 6h16v2H4V6z" />
  </svg>
);

const TaskBoardPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const projectId = Number(id);
  const currentUser = useAppStore((state) => state.currentUser);
  const tasks = useAppStore((state) => state.tasks);
  const setTasks = useAppStore((state) => state.setTasks);
  const addTask = useAppStore((state) => state.addTask);
  const updateTask = useAppStore((state) => state.updateTask);
  const removeTask = useAppStore((state) => state.removeTask);
  const setProjects = useAppStore((state) => state.setProjects);
  const setUser = useAppStore((state) => state.setUser);
  const setDashboardData = useAppStore((state) => state.setDashboardData);

  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [saving, setSaving] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState({});

  const currentUserRole = useMemo(() => {
    return members.find((member) => member.id === currentUser?.id)?.role || null;
  }, [currentUser?.id, members]);

  const isAdmin = currentUserRole === 'ADMIN';

  const groupedTasks = useMemo(
    () => ({
      TODO: tasks.filter((task) => task.status === 'TODO'),
      IN_PROGRESS: tasks.filter((task) => task.status === 'IN_PROGRESS'),
      DONE: tasks.filter((task) => task.status === 'DONE'),
    }),
    [tasks]
  );

  useEffect(() => {
    const loadTasks = async () => {
      setLoading(true);
      setError('');

      try {
        const [projectResponse, tasksResponse] = await Promise.all([
          api.get(`/api/projects/${projectId}/members`),
          api.get(`/api/projects/${projectId}/tasks`),
        ]);

        setProject(projectResponse.data.project);
        setMembers(sortMembersForAssign(projectResponse.data.members || []));
        setTasks(tasksResponse.data);
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Failed to load tasks.');
      } finally {
        setLoading(false);
      }
    };

    if (!Number.isNaN(projectId)) {
      loadTasks();
    } else {
      setLoading(false);
      setError('Invalid project id.');
    }
  }, [projectId, setTasks]);

  const openCreateModal = () => {
    setEditingTask(null);
    setFormData(emptyForm);
    setFieldErrors({});
    setActionError('');
    setIsModalOpen(true);
  };

  const openEditModal = async (task) => {
    setActionError('');
    try {
      const response = await api.get(`/api/projects/${projectId}/tasks/${task.id}`);
      const latestTask = response.data;

      setEditingTask(latestTask);
      setFormData({
        title: latestTask.title || '',
        description: latestTask.description || '',
        dueDate: toInputDate(latestTask.dueDate),
        priority: latestTask.priority || 'MEDIUM',
        assignedToId: latestTask.assignedToId ? String(latestTask.assignedToId) : '',
      });
      setFieldErrors({});
      setIsModalOpen(true);
    } catch (requestError) {
      setActionError(requestError.response?.data?.message || 'Failed to load task details.');
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
    setFormData(emptyForm);
    setFieldErrors({});
    setActionError('');
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((state) => ({
      ...state,
      [name]: value,
    }));

    setFieldErrors((state) => ({
      ...state,
      [name]: '',
    }));

    if (name === 'title' && value.trim()) {
      setActionError('');
    }
  };

  const validateForm = () => {
    const nextErrors = {};
    const nextTitle = formData.title.trim();

    if (nextTitle.length < 3) {
      nextErrors.title = 'Title must be at least 3 characters.';
    }

    if (formData.dueDate && isPastDate(formData.dueDate)) {
      nextErrors.dueDate = 'Due date cannot be in the past.';
    }

    if (formData.assignedToId && !members.some((member) => String(member.id) === formData.assignedToId)) {
      nextErrors.assignedToId = 'Select a valid project member.';
    }

    return nextErrors;
  };

  const submitTask = async (event) => {
    event.preventDefault();

    const nextErrors = validateForm();

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setActionError('');
      return;
    }

    setSaving(true);
    setActionError('');
    setFieldErrors({});

    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description,
        dueDate: formData.dueDate || null,
        priority: formData.priority,
        assignedToId: formData.assignedToId || null,
      };

      if (editingTask) {
        const response = await api.patch(`/api/projects/${projectId}/tasks/${editingTask.id}`, payload);
        updateTask(editingTask.id, response.data);
      } else {
        const response = await api.post(`/api/projects/${projectId}/tasks`, payload);
        addTask(response.data);
        // After adding a task, show the inline delete option so the user can remove it immediately if they want.
        setDeleteConfirmId(response.data.id);
      }

      closeModal();
    } catch (requestError) {
      setActionError(requestError.response?.data?.message || 'Failed to save task.');
    } finally {
      setSaving(false);
    }
  };

  const requestDeleteTask = (taskId) => {
    setDeleteConfirmId(taskId);
    setActionError('');
  };

  const confirmDeleteTask = async (taskId) => {
    setActionError('');
    setDeleteLoadingId(taskId);

    try {
      await api.delete(`/api/projects/${projectId}/tasks/${taskId}`);
      removeTask(taskId);
      setDeleteConfirmId(null);
    } catch (requestError) {
      setActionError(requestError.response?.data?.message || 'Failed to delete task.');
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const handleStatusChange = async (task, nextStatus) => {
    const previousTask = task;
    const optimisticTask = { ...task, status: nextStatus };
    setStatusUpdatingId(task.id);
    setActionError('');
    updateTask(task.id, optimisticTask);

    try {
      const response = await api.patch(`/api/projects/${projectId}/tasks/${task.id}`, {
        status: nextStatus,
      });
      updateTask(task.id, response.data);
    } catch (requestError) {
      updateTask(task.id, previousTask);
      setActionError(requestError.response?.data?.message || 'Failed to update task.');
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setProjects([]);
    setTasks([]);
    setDashboardData(null);
    navigate('/login');
  };

  const renderAssigneeValue = (selected) => {
    const availableLabel = members.map((member) => `${member.name} (${member.role})`).join(', ');
    const isUnassigned = !selected?.label || selected.label === 'Unassigned';

    return (
      <span className="flex min-w-0 items-center gap-2 text-slate-900">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm leading-none text-blue-700">
          👤
        </span>
        <span className="min-w-0 text-left">
          <span className="block truncate font-semibold">{isUnassigned ? 'Unassigned' : selected.label}</span>
          <span className="block truncate text-xs font-normal text-slate-500">
            {availableLabel ? `Available: ${availableLabel}` : 'No project members found'}
          </span>
        </span>
      </span>
    );
  };

  const renderAssigneeOption = (option, isSelected) => {
    const isUnassigned = option.value === '';
    const parts = String(option.label).split('(');
    const name = parts[0]?.trim() || option.label;
    const role = parts[1]?.replace(')', '').trim() || '';

    return (
      <span className="flex min-w-0 items-center gap-3">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isUnassigned ? 'bg-slate-100 text-slate-500' : 'bg-blue-100 text-blue-700'}`}>
          {isUnassigned ? '↔️' : '👤'}
        </span>
        <span className="min-w-0 text-left">
          <span className="block truncate font-medium">{name}</span>
          <span className="block text-xs text-slate-500">{isUnassigned ? 'Leave task unassigned' : role}</span>
        </span>
        {isSelected && !isUnassigned ? <span className="ml-auto text-blue-600">Selected</span> : null}
      </span>
    );
  };

  const renderCard = (task) => {
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';
    const canEdit = isAdmin;
    const canChangeStatus = currentUserRole === 'MEMBER' && task.assignedToId === currentUser?.id;

    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">{task.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{task.description || 'No description provided.'}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${priorityStyles[task.priority]}`}>
            {task.priority}
          </span>
        </div>

        <div className="mt-4 space-y-2 text-sm">
          <p className={isOverdue ? 'font-medium text-rose-700' : 'text-slate-600'}>
            Due: {task.dueDate ? formatDate(task.dueDate) : 'No due date'}
          </p>
          <p className="text-slate-600">
            Assignee: {task.assignedTo ? task.assignedTo.name : 'Unassigned'}
          </p>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          {canChangeStatus ? (
            <div className="flex items-center gap-2">
              <Select
                value={task.status}
                onChange={(event) => handleStatusChange(task, event.target.value)}
                disabled={statusUpdatingId === task.id}
                className="text-slate-700"
              >
                {Object.keys(statusLabels).map((status) => (
                  <option key={status} value={status}>
                    {statusLabels[status]}
                  </option>
                ))}
              </Select>
              {statusUpdatingId === task.id ? <Spinner /> : null}
            </div>
          ) : (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {statusLabels[task.status]}
            </span>
          )}

          {canEdit ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => openEditModal(task)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <EditIcon />
                Edit
              </button>
              <button
                type="button"
                onClick={() => requestDeleteTask(task.id)}
                className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-50"
              >
                <DeleteIcon />
                Delete
              </button>
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-soft">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-3xl border border-rose-200 bg-rose-50 p-8 text-rose-700 shadow-soft">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <AppNav
          title={project?.title || 'Project Tasks'}
          subtitle={project?.description || 'Task board for this project.'}
          rightSlot={
            isAdmin ? (
              <button
                type="button"
                onClick={openCreateModal}
                className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Add Task
              </button>
            ) : null
          }
        />

        {actionError ? (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {actionError}
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-3">
          {(['TODO', 'IN_PROGRESS', 'DONE']).map((status) => (
            <div key={status} className={`rounded-3xl border border-slate-200 ${statusColumnStyles[status]} p-4`}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">{statusLabels[status]}</h2>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                  {groupedTasks[status].length}
                </span>
              </div>
              <div className="space-y-3">
                {groupedTasks[status].length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-4 text-sm text-slate-500">
                    No tasks here
                  </div>
                ) : (
                  groupedTasks[status].map((task) => (
                    <div key={task.id} className="space-y-3">
                      {renderCard(task)}
                      {deleteConfirmId === task.id ? (
                        <InlineConfirm
                          message="Are you sure?"
                          loading={deleteLoadingId === task.id}
                          onConfirm={() => confirmDeleteTask(task.id)}
                          onCancel={() => setDeleteConfirmId(null)}
                        />
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>

        {isModalOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4">
            <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{editingTask ? 'Edit Task' : 'Add Task'}</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {editingTask ? 'Update task details.' : 'Create a task and optionally assign it to a project member.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-full px-3 py-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  Close
                </button>
              </div>

              <form className="mt-6 grid gap-4" onSubmit={submitTask}>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="task-title">
                    Title
                  </label>
                  <input
                    id="task-title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                  />
                  {fieldErrors.title ? <p className="mt-1 text-sm text-rose-600">{fieldErrors.title}</p> : null}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="task-description">
                    Description
                  </label>
                  <textarea
                    id="task-description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="min-h-28 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="task-due-date">
                      Due Date
                    </label>
                    <input
                      id="task-due-date"
                      type="date"
                      name="dueDate"
                      value={formData.dueDate}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                    />
                    {fieldErrors.dueDate ? <p className="mt-1 text-sm text-rose-600">{fieldErrors.dueDate}</p> : null}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="task-priority">
                      Priority
                    </label>
                    <Select id="task-priority" name="priority" value={formData.priority} onChange={handleChange}>
                      <option value="LOW">LOW</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HIGH">HIGH</option>
                    </Select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="task-assignee">
                      Assign To
                    </label>
                    <Select
                      id="task-assignee"
                      name="assignedToId"
                      value={formData.assignedToId}
                      onChange={handleChange}
                      renderValue={renderAssigneeValue}
                      renderOption={renderAssigneeOption}
                    >
                      <option value="">Unassigned</option>
                      {members.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name} ({member.role})
                        </option>
                      ))}
                    </Select>
                    {fieldErrors.assignedToId ? <p className="mt-1 text-sm text-rose-600">{fieldErrors.assignedToId}</p> : null}
                  </div>
                </div>

                {actionError ? (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {actionError}
                  </div>
                ) : null}

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-3 font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      saving ||
                      formData.title.trim().length < 3 ||
                      (formData.dueDate ? isPastDate(formData.dueDate) : false) ||
                      (formData.assignedToId ? !members.some((member) => String(member.id) === formData.assignedToId) : false)
                    }
                    className="rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {saving ? 'Loading...' : editingTask ? 'Update Task' : 'Create Task'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default TaskBoardPage;
