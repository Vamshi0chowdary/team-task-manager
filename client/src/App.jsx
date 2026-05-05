import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Signup from './pages/Signup';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import TaskBoardPage from './pages/TaskBoardPage';
import useAppStore from './store/useAppStore';
import api from './api/axios';

const App = () => {
  const setUser = useAppStore((state) => state.setUser);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const hydrateUser = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        setUser(null);
        setInitializing(false);
        return;
      }

      try {
        const response = await api.get('/api/auth/me');
        setUser(response.data);
      } catch (error) {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
        }
        setUser(null);
      } finally {
        setInitializing(false);
      }
    };

    hydrateUser();
  }, [setUser]);

  if (initializing) {
    return <div className="min-h-screen bg-gray-50" />;
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects"
        element={
          <ProtectedRoute>
            <ProjectsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:id"
        element={
          <ProtectedRoute>
            <ProjectDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:id/tasks"
        element={
          <ProtectedRoute>
            <TaskBoardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/legacy-dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/projects" replace />} />
    </Routes>
  );
};

export default App;
