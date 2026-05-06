import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Toast from '../components/Toast';
import Select from '../components/Select';
import useAppStore from '../store/useAppStore';

const PRIORITY_BADGES = {
  HIGH: 'bg-red-100 text-red-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  LOW: 'bg-green-100 text-green-700',
};

const STATUS_BADGES = {
  TODO: 'bg-gray-100 text-gray-600',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  DONE: 'bg-green-100 text-green-700',
};

const MY_TASK_FILTERS = ['ALL', 'TODO', 'IN_PROGRESS', 'DONE'];

const statusText = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
};

  const renderAssigneeValue = (selected) => {
    const isUnassigned = !selected?.label || selected.label === 'Unassigned';

    return (
      <span className="flex min-w-0 items-center gap-2 text-slate-900">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm leading-none text-blue-700">
          👤
        </span>
        <span className="min-w-0 text-left">
          <span className="block truncate font-semibold">{isUnassigned ? 'Unassigned' : selected.label}</span>
          <span className="block text-xs font-normal text-slate-500">Choose a project member</span>
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

const activityIcon = {
  TASK_COMPLETED: '✅',
  TASK_CREATED: '📝',
  TASK_UPDATED: '🛠️',
  MEMBER_ADDED: '👤',
  PROJECT_CREATED: '📁',
};

const emptyQuickForm = {
  projectId: '',
  title: '',
  description: '',
  priority: 'MEDIUM',
  status: 'TODO',
  dueDate: '',
  assignedToId: '',
};

const getGreeting = () => {
  const hours = new Date().getHours();
  if (hours < 12) {
    return 'Good morning';
  }
  if (hours < 18) {
    return 'Good afternoon';
  }
  return 'Good evening';
};

const formatDate = (value) =>
  new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

const formatFullDate = (value) =>
  new Date(value).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

const getRelativeTime = (value) => {
  const now = new Date();
  const date = new Date(value);
  const diffMs = now.getTime() - date.getTime();
  const minutes = Math.floor(diffMs / (1000 * 60));

  if (minutes < 1) {
    return 'just now';
  }
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
};

const isOverdue = (task) => task?.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';

const getInitials = (name) => {
  if (!name) {
    return 'U';
  }

  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 1).toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const colorFromName = (name) => {
  if (!name) {
    return 'hsl(210, 55%, 82%)';
  }

  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = name.charCodeAt(index) + ((hash << 5) - hash);
  }

  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 65%, 82%)`;
};

const getUrgency = (dueDate) => {
  const today = new Date();
  const target = new Date(dueDate);

  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfTarget = new Date(target.getFullYear(), target.getMonth(), target.getDate());

  const diffDays = Math.round((startOfTarget.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return { label: 'Today', className: 'bg-red-100 text-red-700' };
  }

  if (diffDays === 1) {
    return { label: 'Tomorrow', className: 'bg-orange-100 text-orange-700' };
  }

  return { label: `In ${diffDays} days`, className: 'bg-yellow-100 text-yellow-700' };
};

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

const Dashboard = () => {
  const navigate = useNavigate();

  const currentUser = useAppStore((state) => state.currentUser);
  const projects = useAppStore((state) => state.projects);
  const dashboardData = useAppStore((state) => state.dashboardData);

  const setProjects = useAppStore((state) => state.setProjects);
  const setDashboardData = useAppStore((state) => state.setDashboardData);
  const setUser = useAppStore((state) => state.setUser);
  const setTasks = useAppStore((state) => state.setTasks);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [myTaskFilter, setMyTaskFilter] = useState('ALL');

  const [quickOpen, setQuickOpen] = useState(false);
  const [quickSaving, setQuickSaving] = useState(false);
  const [quickError, setQuickError] = useState('');
  const [quickForm, setQuickForm] = useState(emptyQuickForm);
  const [quickMembers, setQuickMembers] = useState([]);

  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [editMembers, setEditMembers] = useState([]);
  const [editTask, setEditTask] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    status: 'TODO',
    dueDate: '',
    assignedToId: '',
  });

  const adminProjects = useMemo(() => projects.filter((project) => project.role === 'ADMIN'), [projects]);

  const allTasks = useMemo(() => {
    return (dashboardData?.tasksByProject || []).flatMap((project) =>
      (project.tasks || []).map((task) => ({
        ...task,
        projectId: project.projectId,
        projectName: project.title,
      }))
    );
  }, [dashboardData]);

  const groupedPreviewTasks = useMemo(() => {
    return {
      TODO: allTasks.filter((task) => task.status === 'TODO'),
      IN_PROGRESS: allTasks.filter((task) => task.status === 'IN_PROGRESS'),
      DONE: allTasks.filter((task) => task.status === 'DONE'),
    };
  }, [allTasks]);

  const myTasksFiltered = useMemo(() => {
    const myTasks = dashboardData?.myTasks || [];
    const filtered = myTaskFilter === 'ALL' ? myTasks : myTasks.filter((task) => task.status === myTaskFilter);
    const now = new Date();
    const priorityRank = { HIGH: 1, MEDIUM: 2, LOW: 3 };

    return [...filtered].sort((left, right) => {
      const leftOverdue = left.dueDate && new Date(left.dueDate) < now && left.status !== 'DONE' ? 0 : 1;
      const rightOverdue = right.dueDate && new Date(right.dueDate) < now && right.status !== 'DONE' ? 0 : 1;

      if (leftOverdue !== rightOverdue) {
        return leftOverdue - rightOverdue;
      }

      const leftDue = left.dueDate ? new Date(left.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      const rightDue = right.dueDate ? new Date(right.dueDate).getTime() : Number.MAX_SAFE_INTEGER;

      if (leftDue !== rightDue) {
        return leftDue - rightDue;
      }

      return (priorityRank[left.priority] || 99) - (priorityRank[right.priority] || 99);
    });
  }, [dashboardData?.myTasks, myTaskFilter]);

  const loadDashboard = async () => {
    setLoading(true);
    setError('');

    try {
      const [dashboardResponse, projectsResponse] = await Promise.all([api.get('/api/dashboard'), api.get('/api/projects')]);
      setDashboardData((current) => {
        const currentActivity = current?.recentActivity || [];
        const serverActivity = dashboardResponse.data?.recentActivity || [];
        const activityByKey = new Map();

        [...serverActivity, ...currentActivity].forEach((activity) => {
          const key = [activity.type, activity.message, activity.projectName || '', activity.createdAt || ''].join('|');
          if (!activityByKey.has(key)) {
            activityByKey.set(key, activity);
          }
        });

        return {
          ...dashboardResponse.data,
          recentActivity: Array.from(activityByKey.values())
            .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
            .slice(0, 8),
        };
      });
      setProjects(projectsResponse.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to load dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const pushRecentActivity = (activity) => {
    setDashboardData((current) => {
      if (!current) return current;
      const recent = current.recentActivity || [];
      return { ...current, recentActivity: [activity, ...recent].slice(0, 8) };
    });
  };

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = setTimeout(() => setToast(''), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  const fetchMembersByProject = async (projectId, setter) => {
    if (!projectId) {
      setter([]);
      return;
    }

    try {
      const response = await api.get(`/api/projects/${projectId}/members`);
      setter(response.data.members || []);
    } catch {
      setter([]);
    }
  };

  const openQuickAdd = async () => {
    if (adminProjects.length === 0) {
      return;
    }

    const initialProjectId = String(adminProjects[0].id);
    setQuickForm({ ...emptyQuickForm, projectId: initialProjectId });
    setQuickMembers([]);
    setQuickError('');
    setQuickOpen(true);
    await fetchMembersByProject(initialProjectId, setQuickMembers);
  };

  const closeQuickAdd = () => {
    setQuickOpen(false);
    setQuickSaving(false);
    setQuickError('');
    setQuickForm(emptyQuickForm);
    setQuickMembers([]);
  };

  const handleQuickChange = async (event) => {
    const { name, value } = event.target;

    setQuickForm((state) => ({
      ...state,
      [name]: value,
      ...(name === 'projectId' ? { assignedToId: '' } : {}),
    }));

    if (name === 'projectId') {
      await fetchMembersByProject(value, setQuickMembers);
    }
  };

  const handleQuickSubmit = async (event) => {
    event.preventDefault();

    if (!quickForm.projectId || !quickForm.title.trim()) {
      setQuickError('Project and title are required.');
      return;
    }

    setQuickSaving(true);
    setQuickError('');

    try {
      const response = await api.post(`/api/projects/${quickForm.projectId}/tasks`, {
        title: quickForm.title.trim(),
        description: quickForm.description.trim() || null,
        priority: quickForm.priority,
        status: quickForm.status,
        dueDate: quickForm.dueDate || null,
        assignedToId: quickForm.assignedToId || null,
      });

      const createdTask = response.data;

      setDashboardData((current) => {
        if (!current) {
          return current;
        }

        const tasksByProject = current.tasksByProject.map((project) => {
          if (String(project.projectId) !== String(quickForm.projectId)) {
            return project;
          }

          return {
            ...project,
            tasks: [createdTask, ...project.tasks],
          };
        });

        const byStatus = current.byStatus.map((entry) =>
          entry.status === createdTask.status ? { ...entry, count: entry.count + 1 } : entry
        );

        return {
          ...current,
          stats: {
            ...current.stats,
            totalTasks: current.stats.totalTasks + 1,
            addedThisWeek: current.stats.addedThisWeek + 1,
          },
          byStatus,
          tasksByProject,
        };
      });

      setToast('Task created successfully');
      closeQuickAdd();
      // push a client-side recent activity entry immediately
      const projectTitle = projects.find((p) => String(p.id) === String(quickForm.projectId))?.title || '';
      pushRecentActivity({
        type: 'TASK_CREATED',
        message: `${currentUser?.name ? 'You' : 'Someone'} created ${createdTask.title} in ${projectTitle}`,
        projectName: projectTitle,
        createdAt: new Date().toISOString(),
      });
      // Force a fresh fetch after a small delay to ensure DB is updated
      await new Promise((resolve) => setTimeout(resolve, 500));
      await loadDashboard();
    } catch (requestError) {
      setQuickError(requestError.response?.data?.message || 'Failed to create task.');
    } finally {
      setQuickSaving(false);
    }
  };

  const openEditTask = async (task) => {
    setEditError('');
    setEditOpen(true);

    try {
      const [taskResponse, membersResponse] = await Promise.all([
        api.get(`/api/projects/${task.projectId}/tasks/${task.id}`),
        api.get(`/api/projects/${task.projectId}/members`),
      ]);

      const latestTask = taskResponse.data;
      setEditTask({ ...latestTask, projectId: task.projectId, projectName: task.projectName });
      setEditMembers(membersResponse.data.members || []);
      setEditForm({
        title: latestTask.title || '',
        description: latestTask.description || '',
        priority: latestTask.priority || 'MEDIUM',
        status: latestTask.status || 'TODO',
        dueDate: toInputDate(latestTask.dueDate),
        assignedToId: latestTask.assignedToId ? String(latestTask.assignedToId) : '',
      });
    } catch (requestError) {
      setEditError(requestError.response?.data?.message || 'Failed to load task details.');
    }
  };

  const closeEditTask = () => {
    setEditOpen(false);
    setEditSaving(false);
    setEditTask(null);
    setEditMembers([]);
    setEditError('');
  };

  const submitEditTask = async (event) => {
    event.preventDefault();

    if (!editTask) {
      return;
    }

    if (!editForm.title.trim()) {
      setEditError('Title is required.');
      return;
    }

    setEditSaving(true);
    setEditError('');

    try {
      await api.patch(`/api/projects/${editTask.projectId}/tasks/${editTask.id}`, {
        title: editForm.title.trim(),
        description: editForm.description.trim() || null,
        priority: editForm.priority,
        status: editForm.status,
        dueDate: editForm.dueDate || null,
        assignedToId: editForm.assignedToId || null,
      });

      closeEditTask();
      // push detailed client-side recent activity entries for changed fields
      if (editTask) {
        const changes = [];
        if ((editTask.title || '') !== (editForm.title || '')) {
          changes.push(`changed title to "${editForm.title}"`);
        }
        if ((editTask.description || '') !== (editForm.description || '')) {
          changes.push('updated description');
        }
        if ((editTask.priority || '') !== (editForm.priority || '')) {
          changes.push(`changed priority to ${editForm.priority}`);
        }
        if ((editTask.status || '') !== (editForm.status || '')) {
          changes.push(`set status to ${statusText[editForm.status] || editForm.status}`);
        }
        if ((editTask.dueDate || '') !== (editForm.dueDate || '')) {
          changes.push(`changed due date to ${editForm.dueDate ? formatDate(editForm.dueDate) : 'No due date'}`);
        }
        if (String(editTask.assignedToId || '') !== String(editForm.assignedToId || '')) {
          const assigneeName = editMembers.find((m) => String(m.id) === String(editForm.assignedToId))?.name || 'Unassigned';
          changes.push(`changed assignee to ${assigneeName}`);
        }

        if (changes.length > 0) {
          changes.forEach((change) => {
            pushRecentActivity({
              type: 'TASK_UPDATED',
              message: `${currentUser?.name ? 'You' : 'Someone'} ${change} in ${editTask.projectName || ''}`,
              projectName: editTask.projectName || '',
              createdAt: new Date().toISOString(),
            });
          });
        }

        // if status changed to DONE also add completed activity
        if (editTask.status !== 'DONE' && editForm.status === 'DONE') {
          pushRecentActivity({
            type: 'TASK_COMPLETED',
            message: `${currentUser?.name ? 'You' : 'Someone'} marked ${editForm.title} as Done`,
            projectName: editTask.projectName || '',
            createdAt: new Date().toISOString(),
          });
        }
      }
      // Force a fresh fetch after a small delay to ensure DB is updated
      await new Promise((resolve) => setTimeout(resolve, 500));
      await loadDashboard();
    } catch (requestError) {
      setEditError(requestError.response?.data?.message || 'Failed to update task.');
    } finally {
      setEditSaving(false);
    }
  };

  const markMyTaskDone = async (task) => {
    // Toggle: if DONE, set to TODO; if not DONE, set to DONE
    const newStatus = task.status === 'DONE' ? 'TODO' : 'DONE';
    await updateTaskStatus(task, newStatus);
  };

  const updateTaskStatus = async (task, newStatus) => {
    try {
      await api.patch(`/api/projects/${task.projectId}/tasks/${task.id}`, { status: newStatus });
      // push client-side activity immediately
      const verb = newStatus === 'DONE' ? 'marked' : newStatus === 'IN_PROGRESS' ? 'moved' : 'set';
      const type = newStatus === 'DONE' ? 'TASK_COMPLETED' : 'TASK_UPDATED';
      pushRecentActivity({
        type,
        message: `${currentUser?.name ? 'You' : 'Someone'} ${verb} ${task.title} ${
          newStatus === 'IN_PROGRESS' ? 'to In Progress' : newStatus === 'DONE' ? 'as Done' : ''
        }`,
        projectName: task.projectName || task.project?.title || '',
        createdAt: new Date().toISOString(),
      });

      await new Promise((resolve) => setTimeout(resolve, 500));
      await loadDashboard();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to update task status.');
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

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-6 rounded-xl bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {getGreeting()}
                {currentUser?.name ? `, ${currentUser.name}` : ''}
              </h1>
              <p className="mt-1 text-sm text-slate-600">{formatFullDate(new Date())}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                to="/projects"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Projects
              </Link>
              {adminProjects.length > 0 ? (
                <button
                  type="button"
                  onClick={openQuickAdd}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Quick Add Task
                </button>
              ) : null}
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Log out
              </button>
            </div>
          </div>
        </div>

        {error ? (
          <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
        ) : null}

        {loading ? (
          <div className="grid gap-4 lg:grid-cols-12">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="col-span-6 h-32 animate-pulse rounded-xl bg-gray-200 lg:col-span-3" />
            ))}
            <div className="col-span-12 h-72 animate-pulse rounded-xl bg-gray-200 lg:col-span-8" />
            <div className="col-span-12 h-72 animate-pulse rounded-xl bg-gray-200 lg:col-span-4" />
            <div className="col-span-12 h-72 animate-pulse rounded-xl bg-gray-200 lg:col-span-6" />
            <div className="col-span-12 h-72 animate-pulse rounded-xl bg-gray-200 lg:col-span-6" />
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-12">
            <div className="col-span-6 rounded-xl bg-white p-4 shadow-sm lg:col-span-3">
              <p className="text-sm font-medium text-slate-500">Total Tasks</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{dashboardData?.stats?.totalTasks || 0}</p>
              <p className="mt-2 text-sm text-slate-600">across {(dashboardData?.tasksByProject || []).length} projects</p>
              <p className="mt-1 text-xs text-emerald-600">+{dashboardData?.stats?.addedThisWeek || 0} added this week</p>
            </div>

            <div className="col-span-6 rounded-xl bg-white p-4 shadow-sm lg:col-span-3">
              <p className="text-sm font-medium text-slate-500">Completed</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{dashboardData?.stats?.completedTasks || 0}</p>
              <p className="mt-2 text-sm text-slate-600">{dashboardData?.stats?.completionRate || 0}% complete</p>
              <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-blue-500"
                  style={{ width: `${dashboardData?.stats?.completionRate || 0}%` }}
                />
              </div>
            </div>

            <div className="col-span-6 rounded-xl bg-white p-4 shadow-sm lg:col-span-3">
              <p className="text-sm font-medium text-slate-500">In Progress</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{dashboardData?.stats?.inProgressTasks || 0}</p>
              <p className="mt-2 text-sm text-slate-600">
                {(dashboardData?.myTasks || []).filter((task) => task.status === 'IN_PROGRESS').length} assigned to you
              </p>
            </div>

            <div
              className={`col-span-6 rounded-xl p-4 shadow-sm lg:col-span-3 ${
                (dashboardData?.stats?.overdueTasks || 0) > 0 ? 'border border-red-200 bg-red-50' : 'bg-white'
              }`}
            >
              <p className="text-sm font-medium text-slate-500">Overdue</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{dashboardData?.stats?.overdueTasks || 0}</p>
              <p
                className={`mt-2 text-sm ${(dashboardData?.stats?.overdueTasks || 0) > 0 ? 'text-red-700' : 'text-green-700'}`}
              >
                {(dashboardData?.stats?.overdueTasks || 0) > 0 ? 'Needs immediate attention' : 'All on track!'}
              </p>
            </div>

            <div className="col-span-12 rounded-xl bg-white p-4 shadow-sm lg:col-span-8">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Task Board Preview</h2>
                <Link to="/projects" className="text-sm font-semibold text-sky-700 hover:text-sky-800">
                  Open projects
                </Link>
              </div>

              <div className="-mx-1 flex gap-3 overflow-x-auto pb-1">
                {['TODO', 'IN_PROGRESS', 'DONE'].map((statusKey) => {
                  const items = groupedPreviewTasks[statusKey] || [];
                  const visible = items.slice(0, 4);
                  const hasMore = items.length > 4;

                  return (
                    <div key={statusKey} className="min-w-[270px] flex-1 rounded-xl bg-gray-50 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${STATUS_BADGES[statusKey]}`}>
                          {statusText[statusKey]}
                        </span>
                        {statusKey === 'TODO' && adminProjects.length > 0 ? (
                          <button
                            type="button"
                            onClick={openQuickAdd}
                            className="rounded-md bg-slate-900 px-2 py-1 text-xs font-semibold text-white"
                          >
                            Add Task
                          </button>
                        ) : null}
                      </div>

                      <div className="space-y-2">
                        {visible.length === 0 ? (
                          <div className="rounded-lg border border-dashed border-gray-300 bg-white p-3 text-xs text-slate-500">No tasks</div>
                        ) : (
                          visible.map((task) => (
                            <button
                              key={task.id}
                              type="button"
                              onClick={() => openEditTask(task)}
                              className="w-full rounded-lg bg-white p-3 text-left shadow-sm"
                            >
                              <p className="truncate text-sm font-semibold text-slate-900">{task.title}</p>
                              <div className="mt-2 flex items-center justify-between gap-2">
                                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${PRIORITY_BADGES[task.priority]}`}>
                                  {task.priority}
                                </span>
                                <span className={`text-xs ${isOverdue(task) ? 'text-red-600' : 'text-slate-500'}`}>
                                  {task.dueDate ? formatDate(task.dueDate) : 'No due date'}
                                </span>
                              </div>
                              <div className="mt-2 flex items-center justify-between">
                                <span className="text-xs text-slate-500">{task.projectName}</span>
                                <span
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-slate-700"
                                  style={{ backgroundColor: colorFromName(task.assignedTo?.name || 'Unassigned') }}
                                >
                                  {getInitials(task.assignedTo?.name || 'Unassigned')}
                                </span>
                              </div>
                            </button>
                          ))
                        )}
                      </div>

                      {hasMore ? (
                        <div className="mt-2">
                          <Link to="/projects" className="text-xs font-semibold text-sky-700 hover:text-sky-800">
                            + {items.length - 4} more
                          </Link>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="col-span-12 rounded-xl bg-white p-4 shadow-sm lg:col-span-4">
              <h2 className="text-lg font-semibold text-slate-900">Due Soon</h2>
              <div className="mt-3 space-y-2">
                {(dashboardData?.dueSoon || []).length === 0 ? (
                  <p className="rounded-lg bg-emerald-50 px-3 py-3 text-sm text-emerald-700">Nothing due in the next 7 days 🎉</p>
                ) : (
                  dashboardData.dueSoon.map((task) => {
                    const urgency = getUrgency(task.dueDate);

                    return (
                      <div key={task.id} className="rounded-lg border border-slate-200 px-3 py-2">
                        <p className="truncate text-sm font-semibold text-slate-900">{task.title}</p>
                        <p className="text-xs text-slate-500">{task.projectName}</p>
                        <div className="mt-1 flex items-center justify-between">
                          <span className="text-xs text-slate-600">{formatDate(task.dueDate)}</span>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${urgency.className}`}>
                            {urgency.label}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="mt-3">
                <Link to="/projects" className="text-sm font-semibold text-sky-700 hover:text-sky-800">
                  View all tasks
                </Link>
              </div>
            </div>

            <div className="col-span-12 rounded-xl bg-white p-4 shadow-sm lg:col-span-6">
              <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
              <div className="mt-3 space-y-2">
                {(dashboardData?.recentActivity || []).length === 0 ? (
                  <p className="text-sm text-slate-500">No recent activity yet.</p>
                ) : (
                  dashboardData.recentActivity.map((activity, index) => (
                    <div key={`${activity.createdAt}-${index}`} className="flex items-start gap-3 rounded-lg border border-slate-200 px-3 py-2">
                      <span className="text-base">{activityIcon[activity.type] || '📝'}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-slate-800">{activity.message}</p>
                        <p className="text-xs text-slate-500">{getRelativeTime(activity.createdAt)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="col-span-12 rounded-xl bg-white p-4 shadow-sm lg:col-span-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-900">My Tasks</h2>
                <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1">
                  {MY_TASK_FILTERS.map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setMyTaskFilter(filter)}
                      className={`rounded-md px-2 py-1 text-xs font-semibold ${
                        myTaskFilter === filter ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                      }`}
                    >
                      {filter === 'ALL' ? 'All' : statusText[filter]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-3 space-y-2">
                {myTasksFiltered.length === 0 ? (
                  <p className="text-sm text-slate-500">No tasks assigned to you yet</p>
                ) : (
                  myTasksFiltered.map((task) => (
                    <div key={task.id} className="flex items-start gap-3 rounded-lg border border-slate-200 px-3 py-2">
                      <input
                        type="checkbox"
                        checked={task.status === 'DONE'}
                        onChange={() => markMyTaskDone(task)}
                        className="mt-1 h-4 w-4"
                      />
                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-sm font-semibold ${task.status === 'DONE' ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                          {task.title}
                        </p>
                        <p className="text-xs text-slate-500">{task.projectName}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={task.status}
                          onChange={(e) => updateTaskStatus(task, e.target.value)}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                        >
                          <option value="TODO">To Do</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="DONE">Done</option>
                        </select>

                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${PRIORITY_BADGES[task.priority]}`}>
                          {task.priority}
                        </span>
                        <span className={`text-xs ${isOverdue(task) ? 'text-red-600' : 'text-slate-500'}`}>
                          {task.dueDate ? formatDate(task.dueDate) : 'No due date'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {quickOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">📝</span>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Create Task</h2>
                    <p className="text-xs text-slate-500">Add a new task to keep your team organized</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeQuickAdd}
                  className="rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 p-2 transition"
                >
                  ✕
                </button>
              </div>

              <form className="space-y-5" onSubmit={handleQuickSubmit}>
                {/* Project */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Project *</label>
                  <Select name="projectId" value={quickForm.projectId} onChange={handleQuickChange}>
                    <option value="">Select project</option>
                    {adminProjects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.title}
                      </option>
                    ))}
                  </Select>
                </div>

                {/* Title */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Task Title *</label>
                  <input
                    name="title"
                    value={quickForm.title}
                    onChange={handleQuickChange}
                    placeholder="Enter task title..."
                    className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Description</label>
                  <textarea
                    name="description"
                    value={quickForm.description}
                    onChange={handleQuickChange}
                    placeholder="Add task details (optional)..."
                    className="min-h-16 w-full rounded-lg border border-slate-200 px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition resize-none"
                  />
                </div>

                {/* Priority, Due Date, Assign */}
                <div className="grid gap-4 grid-cols-3">
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                      🎯 Priority
                    </label>
                    <Select name="priority" value={quickForm.priority} onChange={handleQuickChange}>
                      <option value="LOW">🟢 Low</option>
                      <option value="MEDIUM">🟡 Medium</option>
                      <option value="HIGH">🔴 High</option>
                    </Select>
                  </div>

                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                      📅 Due Date
                    </label>
                    <input
                      type="date"
                      name="dueDate"
                      value={quickForm.dueDate}
                      onChange={handleQuickChange}
                      className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-900 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition hover:border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                      👤 Assign To
                    </label>
                    <Select
                      name="assignedToId"
                      value={quickForm.assignedToId}
                      onChange={handleQuickChange}
                      renderValue={renderAssigneeValue}
                      renderOption={renderAssigneeOption}
                    >
                      <option value="">Unassigned</option>
                      {quickMembers.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name} ({member.role})
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    ✓ Status
                  </label>
                  <Select name="status" value={quickForm.status} onChange={handleQuickChange}>
                    <option value="TODO">📋 To Do</option>
                    <option value="IN_PROGRESS">🔄 In Progress</option>
                    <option value="DONE">✅ Done</option>
                  </Select>
                </div>

                {/* Error Message */}
                {quickError ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {quickError}
                  </div>
                ) : null}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeQuickAdd}
                    className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={quickSaving}
                    className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
                  >
                    {quickSaving ? '✓ Creating...' : '+ Create Task'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}

        {editOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4">
            <div className="w-full max-w-xl rounded-xl bg-white p-5 shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900">Edit Task</h3>
                <button type="button" onClick={closeEditTask} className="text-sm font-semibold text-slate-500 hover:text-slate-700">
                  Close
                </button>
              </div>

              {editTask ? <p className="mt-1 text-xs text-slate-500">{editTask.projectName}</p> : null}

              <form className="mt-4 space-y-3" onSubmit={submitEditTask}>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Title</label>
                  <input
                    value={editForm.title}
                    onChange={(event) => setEditForm((state) => ({ ...state, title: event.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
                  <textarea
                    value={editForm.description}
                    onChange={(event) => setEditForm((state) => ({ ...state, description: event.target.value }))}
                    className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Priority</label>
                    <Select
                      value={editForm.priority}
                      onChange={(event) => setEditForm((state) => ({ ...state, priority: event.target.value }))}
                    >
                      <option value="LOW">LOW</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HIGH">HIGH</option>
                    </Select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
                    <Select
                      value={editForm.status}
                      onChange={(event) => setEditForm((state) => ({ ...state, status: event.target.value }))}
                    >
                      <option value="TODO">To Do</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="DONE">Done</option>
                    </Select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Due Date</label>
                    <input
                      type="date"
                      value={editForm.dueDate}
                      onChange={(event) => setEditForm((state) => ({ ...state, dueDate: event.target.value }))}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition appearance-none cursor-pointer hover:border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Assign To</label>
                    <Select
                      value={editForm.assignedToId}
                      onChange={(event) => setEditForm((state) => ({ ...state, assignedToId: event.target.value }))}
                      renderValue={renderAssigneeValue}
                      renderOption={renderAssigneeOption}
                    >
                      <option value="">Unassigned</option>
                      {editMembers.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name} ({member.role})
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                {editError ? <p className="text-sm text-rose-600">{editError}</p> : null}

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeEditTask}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editSaving}
                    className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-70"
                  >
                    {editSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}

        {toast ? <Toast message={toast} type="success" /> : null}
      </div>
    </div>
  );
};

export default Dashboard;
