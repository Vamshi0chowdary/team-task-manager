import { Link, useNavigate } from 'react-router-dom';
import useAppStore from '../store/useAppStore';

const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/projects', label: 'My Projects' },
];

const AppNav = ({ title, subtitle, rightSlot }) => {
  const navigate = useNavigate();
  const setUser = useAppStore((state) => state.setUser);
  const setProjects = useAppStore((state) => state.setProjects);
  const setTasks = useAppStore((state) => state.setTasks);
  const setDashboardData = useAppStore((state) => state.setDashboardData);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setProjects([]);
    setTasks([]);
    setDashboardData(null);
    navigate('/login');
  };

  return (
    <div className="mb-8 rounded-[2rem] border border-slate-200/70 bg-white/85 px-6 py-5 shadow-soft backdrop-blur">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-600">Team Task Manager</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">{title}</h1>
          {subtitle ? <p className="mt-2 text-sm text-slate-600">{subtitle}</p> : null}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              {link.label}
            </Link>
          ))}
          {rightSlot}
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppNav;
