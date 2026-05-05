import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/axios';
import AppNav from '../components/AppNav';
import InlineConfirm from '../components/InlineConfirm';
import useAppStore from '../store/useAppStore';
import { isValidEmail } from '../utils/validation';

const roleStyles = {
  ADMIN: 'bg-blue-100 text-blue-700',
  MEMBER: 'bg-slate-200 text-slate-700',
};

const ProjectDetailPage = () => {
  const { id } = useParams();
  const projectId = Number(id);
  const currentUser = useAppStore((state) => state.currentUser);

  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [memberActionLoading, setMemberActionLoading] = useState(false);
  const [pendingRemoveId, setPendingRemoveId] = useState(null);

  const currentUserRole = useMemo(() => {
    return members.find((member) => member.id === currentUser?.id)?.role || null;
  }, [currentUser?.id, members]);

  const isAdmin = currentUserRole === 'ADMIN';

  useEffect(() => {
    const loadProject = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await api.get(`/api/projects/${projectId}/members`);
        setProject(response.data.project);
        setMembers(response.data.members);
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Failed to load project details.');
      } finally {
        setLoading(false);
      }
    };

    if (!Number.isNaN(projectId)) {
      loadProject();
    } else {
      setError('Invalid project id.');
      setLoading(false);
    }
  }, [projectId]);

  const handleAddMember = async (event) => {
    event.preventDefault();

    const nextEmail = email.trim().toLowerCase();

    if (!nextEmail) {
      setEmailError('Email is required.');
      return;
    }

    if (!isValidEmail(nextEmail)) {
      setEmailError('Enter a valid email address.');
      return;
    }

    setMemberActionLoading(true);
    setEmailError('');

    try {
      const response = await api.post(`/api/projects/${projectId}/members`, { email: nextEmail });
      setMembers((current) => [{ ...response.data.user, role: response.data.role }, ...current]);
      setEmail('');
    } catch (requestError) {
      setEmailError(requestError.response?.data?.message || 'Failed to add member.');
    } finally {
      setMemberActionLoading(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    setMemberActionLoading(true);
    setEmailError('');

    try {
      await api.delete(`/api/projects/${projectId}/members/${memberId}`);
      setMembers((current) => current.filter((member) => member.id !== memberId));
    } catch (requestError) {
      setEmailError(requestError.response?.data?.message || 'Failed to remove member.');
    } finally {
      setMemberActionLoading(false);
      setPendingRemoveId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-soft">
          Loading project...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-3xl border border-rose-200 bg-rose-50 p-8 text-rose-700 shadow-soft">
          <p>{error}</p>
          <Link className="mt-4 inline-block font-semibold text-rose-800 underline" to="/projects">
            Back to projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <AppNav
          title={project?.title || 'Project'}
          subtitle={project?.description || 'Project members and access management.'}
          rightSlot={
            <Link
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              to={`/projects/${projectId}/tasks`}
            >
              View Tasks
            </Link>
          }
        />

        <div className="mb-6">
          <Link className="text-sm font-semibold text-sky-700 hover:text-sky-800" to="/projects">
            ← Back to projects
          </Link>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-soft">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Members</h2>
              <p className="mt-1 text-sm text-slate-600">
                {isAdmin ? 'You can manage members on this project.' : 'You have read-only access to this member list.'}
              </p>
            </div>
            {currentUserRole ? (
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${roleStyles[currentUserRole]}`}>
                {currentUserRole}
              </span>
            ) : null}
          </div>

          {isAdmin ? (
            <form className="mt-6 flex flex-col gap-3 sm:flex-row" onSubmit={handleAddMember}>
              <div className="flex-1">
                <input
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (event.target.value.trim()) {
                      setEmailError('');
                    }
                  }}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                  placeholder="Add member by email"
                />
                {emailError ? <p className="mt-1 text-sm text-rose-600">{emailError}</p> : null}
              </div>
              <button
                type="submit"
                disabled={memberActionLoading || !email.trim() || !isValidEmail(email.trim())}
                className="rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {memberActionLoading ? 'Adding...' : 'Add Member'}
              </button>
            </form>
          ) : null}

          <div className="mt-6 space-y-3">
            {members.map((member) => {
              const canRemove = isAdmin && member.id !== currentUser?.id;

              return (
                <div
                  key={member.id}
                  className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{member.name}</p>
                    <p className="text-sm text-slate-600">{member.email}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${roleStyles[member.role]}`}>
                      {member.role}
                    </span>
                    {canRemove ? (
                      pendingRemoveId === member.id ? (
                        <InlineConfirm
                          message="Are you sure?"
                          loading={memberActionLoading}
                          onConfirm={() => handleRemoveMember(member.id)}
                          onCancel={() => setPendingRemoveId(null)}
                        />
                      ) : (
                        <button
                          type="button"
                          disabled={memberActionLoading}
                          onClick={() => setPendingRemoveId(member.id)}
                          className="rounded-xl border border-rose-200 bg-white px-4 py-2 font-medium text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          Remove
                        </button>
                      )
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailPage;