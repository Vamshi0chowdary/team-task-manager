import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Signup from './pages/Signup';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import TaskBoardPage from './pages/TaskBoardPage';
import useAppStore from './store/useAppStore';
import { decodeToken } from './utils/auth';

const App = () => {
  const setUser = useAppStore((state) => state.setUser);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const decodedUser = decodeToken(token);

    if (decodedUser?.id) {
      setUser({
        id: decodedUser.id,
        name: decodedUser.name,
        email: decodedUser.email,
      });
    } else {
      setUser(null);
    }
  }, [setUser]);

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
