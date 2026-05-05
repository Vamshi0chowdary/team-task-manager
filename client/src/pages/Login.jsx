import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Toast from '../components/Toast';
import useAppStore from '../store/useAppStore';
import { decodeToken } from '../utils/auth';
import { isValidEmail } from '../utils/validation';

const Login = () => {
  const navigate = useNavigate();
  const setUser = useAppStore((state) => state.setUser);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [toast, setToast] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
    setFieldErrors((current) => ({
      ...current,
      [name]: '',
    }));
    setMessage('');
  };

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      setToast('');
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [toast]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    setFieldErrors({});

    const nextErrors = {};

    if (!formData.email.trim()) {
      nextErrors.email = 'Email is required.';
    } else if (!isValidEmail(formData.email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (!formData.password) {
      nextErrors.password = 'Password is required.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/api/auth/login', {
        email: formData.email,
        password: formData.password,
      });
      localStorage.setItem('token', response.data.token);
      const decodedUser = decodeToken(response.data.token);
      if (decodedUser?.id) {
        setUser({
          id: decodedUser.id,
          name: decodedUser.name,
          email: decodedUser.email,
        });
      }
      setToast('Login successful. Redirecting...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    } catch (error) {
      // Distinguish server-side messages from network/errors
      if (error.response?.data?.message) {
        setMessage(error.response.data.message);
      } else if (error.request && !error.response) {
        setMessage('Network error. Please check your connection and try again.');
      } else {
        setMessage(error.message || 'Unable to sign in.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-slate-200/70 bg-white/85 p-8 shadow-soft backdrop-blur">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-600">Welcome back</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Sign in to continue</h1>
          <p className="mt-2 text-sm text-slate-600">Use your email and password to access the dashboard.</p>
        </div>

        {toast ? <Toast message={toast} type="success" /> : null}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
              placeholder="jane@example.com"
            />
            {fieldErrors.email ? <p className="mt-1 text-sm text-rose-600">{fieldErrors.email}</p> : null}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
              placeholder="Your password"
            />
            {fieldErrors.password ? <p className="mt-1 text-sm text-rose-600">{fieldErrors.password}</p> : null}
          </div>

          {message ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {message}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading || !formData.email.trim() || !formData.password}
            className="w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Signing in...' : 'Log in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          New here?{' '}
          <Link className="font-semibold text-sky-700 hover:text-sky-800" to="/signup">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
