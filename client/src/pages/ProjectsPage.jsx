import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import AppNav from '../components/AppNav';
import useAppStore from '../store/useAppStore';

const roleStyles = {
  ADMIN: 'bg-blue-100 text-blue-700',
  MEMBER: 'bg-slate-200 text-slate-700',
};

const formatDate = (value) =>
  new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

const ProjectsPage = () => {
  const currentUser = useAppStore((state) => state.currentUser);
  const projects = useAppStore((state) => state.projects);
  const setProjects = useAppStore((state) => state.setProjects);
  const addProject = useAppStore((state) => state.addProject);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    const loadProjects = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await api.get('/api/projects');
        setProjects(response.data);
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Failed to load projects.');
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, [setProjects]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((state) => ({
      ...state,
      [name]: value,
    }));

    if (name === 'title' && value.trim()) {
      setFormError('');
      setFieldErrors((state) => ({
        ...state,
        title: '',
      }));
    }
  };

  const openModal = () => {
    setFormData({ title: '', description: '' });
    setFormError('');
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextTitle = formData.title.trim();

    if (nextTitle.length < 3) {
      setFieldErrors({ title: 'Title must be at least 3 characters.' });
      setFormError('');
      return;
    }

    setSaving(true);
    setFormError('');
    setFieldErrors({});

    try {
      const response = await api.post('/api/projects', {
        title: nextTitle,
        description: formData.description,
      });

      addProject(response.data);
      setIsModalOpen(false);
      setFormData({ title: '', description: '' });
    } catch (requestError) {
      setFormError(requestError.response?.data?.message || 'Failed to create project.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <AppNav
          title={currentUser ? `${currentUser.name}'s workspace` : 'Your workspace'}
          subtitle="Track projects, roles, and team membership in one place."
          rightSlot={
            <button
              type="button"
              onClick={openModal}
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Create Project
            </button>
          }
        />

        {error ? (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white/80 p-8 text-slate-600 shadow-soft">
            Loading projects...
          </div>
        ) : projects.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="group rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-soft transition hover:-translate-y-1 hover:border-sky-200"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 group-hover:text-sky-700">{project.title}</h2>
                    <p className="mt-2 text-sm text-slate-600">
                      {project.description || 'No description provided.'}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${roleStyles[project.role]}`}>
                    {project.role}
                  </span>
                </div>

                <div className="mt-6 flex items-center justify-between text-sm text-slate-500">
                  <span>Created {formatDate(project.createdAt)}</span>
                  <span>#{project.id}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : null}

        {isModalOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4">
            <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Create Project</h2>
                  <p className="mt-1 text-sm text-slate-600">Add a new workspace for your team.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-full px-3 py-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  Close
                </button>
              </div>

              <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="project-title">
                    Title
                  </label>
                  <input
                    id="project-title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                    placeholder="Website Redesign"
                  />
                  {fieldErrors.title ? <p className="mt-1 text-sm text-rose-600">{fieldErrors.title}</p> : null}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="project-description">
                    Description
                  </label>
                  <textarea
                    id="project-description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="min-h-32 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                    placeholder="Optional project description"
                  />
                </div>

                {formError ? (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {formError}
                  </div>
                ) : null}

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-3 font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving || formData.title.trim().length < 3}
                    className="rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {saving ? 'Creating...' : 'Create Project'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}

        {!loading && projects.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-white/80 p-12 text-center shadow-soft">
            <p className="text-xl font-semibold text-slate-900">No projects yet. Create your first project to get started.</p>
            <button
              type="button"
              onClick={openModal}
              className="mx-auto mt-6 flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 text-3xl font-light text-white transition hover:bg-slate-800"
              aria-label="Create project"
            >
              +
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ProjectsPage;