import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProtectedRoute } from '../hooks/useProtectedRoute';

import AdminLayout from '../layouts/AdminLayout';

import Login from '../pages/Login';

import AdminLogin from '../pages/admin/AdminLogin';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminResults from '../pages/admin/AdminResults';
import AdminSettings from '../pages/admin/AdminSettings';
import UserManagement from '../pages/admin/UserManagement';
import Variants from '../pages/admin/Variants';

import ExamAccess from '../pages/student/ExamAccess';
import ExamPage from '../pages/student/ExamPage';
import ReadingSection from '../pages/student/ReadingSection';
import ListeningSection from '../pages/student/ListeningSection';
import WritingSection from '../pages/student/WritingSection';
import SpeakingSection from '../pages/student/SpeakingSection';
import ReadingAnswerSheet from '../pages/student/ReadingAnswerSheet';
import ListeningAnswerSheet from '../pages/student/ListeningAnswerSheet';
import AnswerSheet from '../pages/student/AnswerSheet';
import Finish from '../pages/student/Finish';
import Results from '../pages/student/Results';
import StudentLayout from '../layouts/StudentLayout';
import StudentDashboard from '../pages/student/StudentDashboard';
import StudentProfile from '../pages/student/StudentProfile';
import StudentTests from '../pages/student/StudentTests';

import Error400 from '../pages/errors/Error400';
import Error404 from '../pages/errors/Error404';
import Error500 from '../pages/errors/Error500';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();
  useProtectedRoute(requiredRole);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'student') return <Navigate to="/student/dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
};

const PublicRoute = ({ children, redirectIfAuth }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (user && redirectIfAuth) {
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'student') return <Navigate to="/student/dashboard" replace />;
  }

  return children;
};

const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />

      <Route
        path="/admin/login"
        element={
          <PublicRoute redirectIfAuth>
            <AdminLogin />
          </PublicRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="variants" element={<Variants />} />
        <Route path="results" element={<AdminResults />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      <Route
        path="/exam-access"
        element={
          <PublicRoute>
            <ExamAccess />
          </PublicRoute>
        }
      />
      <Route
        path="/student"
        element={
          <ProtectedRoute requiredRole="student">
            <StudentLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="profile" element={<StudentProfile />} />
        <Route path="tests" element={<StudentTests />} />
        <Route path="listening" element={<ListeningSection />} />
        <Route path="reading" element={<ReadingSection />} />
        <Route path="writing" element={<WritingSection />} />
        <Route path="speaking" element={<SpeakingSection />} />
        <Route path="results" element={<Results />} />
      </Route>
      <Route
        path="/exam/:key"
        element={
          <ProtectedRoute requiredRole="student">
            <ExamPage />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="listening" replace />} />
        <Route path="reading" element={<ReadingSection />} />
        <Route path="reading-answer-sheet" element={<ReadingAnswerSheet />} />
        <Route path="listening" element={<ListeningSection />} />
        <Route path="listening-answer-sheet" element={<ListeningAnswerSheet />} />
        <Route path="writing" element={<WritingSection />} />
        <Route path="speaking" element={<SpeakingSection />} />
        <Route path="answer-sheet" element={<AnswerSheet />} />
        <Route path="finish" element={<Finish />} />
      </Route>

      <Route path="/error/400" element={<Error400 />} />
      <Route path="/error/404" element={<Error404 />} />
      <Route path="/error/500" element={<Error500 />} />
      <Route path="*" element={<Error404 />} />
    </Routes>
  );
};

export default AppRouter;
