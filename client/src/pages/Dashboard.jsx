import { useEffect, useState } from 'react';
import api from '../api/axios';
import AppNav from '../components/AppNav';
import useAppStore from '../store/useAppStore';

const statusOrder = [
  { key: 'TODO', label: 'To Do', border: 'border-slate-300' },
  { key: 'IN_PROGRESS', label: 'In Progress', border: 'border-blue-500' },
  { key: 'DONE', label: 'Done', border: 'border-emerald-500' },
];

const formatDate = (value) =>
  new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

const Dashboard = () => {
  const dashboardData = useAppStore((state) => state.dashboardData);
  const setDashboardData = useAppStore((state) => state.setDashboardData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await api.get('/api/dashboard');
        setDashboardData(response.data);
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Failed to load dashboard.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [setDashboardData]);

  const byStatusCount = (status) => dashboardData?.byStatus?.find((item) => item.status === status)?.count || 0;

  return (
    <div className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <AppNav title="Dashboard" subtitle="A fast overview of tasks across all of your projects." />

        {error ? (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-56 animate-pulse rounded-3xl border border-slate-200 bg-white/70" />
            ))}
          </div>
        ) : dashboardData?.totalTasks === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white/85 p-10 text-center shadow-soft">
            <p className="text-lg font-semibold text-slate-900">No tasks found. Add tasks to your projects to see stats here.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-soft">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">Tasks across all your projects</p>
              <div className="mt-10 flex items-center justify-center text-7xl font-bold text-slate-900">
                {dashboardData?.totalTasks || 0}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-soft">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">By Status</p>
              <div className="mt-6 space-y-3">
                {statusOrder.map((status) => (
                  <div
                    key={status.key}
                    className={`flex items-center justify-between rounded-r-2xl border-l-4 ${status.border} bg-slate-50 px-4 py-3`}
                  >
                    <span className="font-medium text-slate-800">{status.label}</span>
                    <span className="text-lg font-bold text-slate-900">{byStatusCount(status.key)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-soft">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">By Assignee</p>
              <div className="mt-6 space-y-3">
                {(dashboardData?.byAssignee || []).length === 0 ? (
                  <p className="text-sm text-slate-600">No tasks assigned yet</p>
                ) : (
                  dashboardData.byAssignee.map((entry) => (
                    <div key={entry.user.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                      <span className="font-medium text-slate-800">
                        {entry.user.name} — {entry.count} tasks
                      </span>
                      <span className="text-xs text-slate-500">{entry.user.email}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-soft">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-rose-600">Overdue</p>
              <div className="mt-6 space-y-3">
                {(dashboardData?.overdueTasks || []).length === 0 ? (
                  <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-3 text-emerald-700">
                    <span className="text-xl font-bold">✓</span>
                    <span className="font-semibold">All tasks on track!</span>
                  </div>
                ) : (
                  dashboardData.overdueTasks.map((task) => (
                    <div key={task.id} className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
                      <p className="font-semibold text-slate-900">{task.title}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        {task.assignedTo ? `${task.assignedTo.name} • ` : 'Unassigned • '}
                        <span className="text-rose-700">{task.dueDate ? formatDate(task.dueDate) : 'No due date'}</span>
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
