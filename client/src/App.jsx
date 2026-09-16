import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ClientDetail from './pages/ClientDetail';
import Projects from './pages/Projects';
import ProjectForm from './pages/ProjectForm';
import ProjectDetail from './pages/ProjectDetail';
import VideoReview from './pages/VideoReview';
import VersionCompare from './pages/VersionCompare';
import PublicReview from './pages/PublicReview';
import Health from './pages/Health';

function RootRedirect() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Client Management (Admin only) */}
          <Route
            path="/clients"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <Clients />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clients/:id"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'EDITOR']}>
                <ClientDetail />
              </ProtectedRoute>
            }
          />

          {/* Project Management */}
          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <Projects />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/new"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <ProjectForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:id"
            element={
              <ProtectedRoute>
                <ProjectDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:id/edit"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <ProjectForm />
              </ProtectedRoute>
            }
          />

          {/* Video Review Workspace */}
          <Route
            path="/review/:projectId/:videoId"
            element={
              <ProtectedRoute>
                <VideoReview />
              </ProtectedRoute>
            }
          />

          {/* Version Comparison Workspace */}
          <Route
            path="/compare/:projectId/:v1Id/:v2Id"
            element={
              <ProtectedRoute>
                <VersionCompare />
              </ProtectedRoute>
            }
          />

          {/* Public Client Review Portal (No Auth Required) */}
          <Route path="/review/share/:token" element={<PublicReview />} />

          <Route path="/health" element={<Health />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </SocketProvider>
    </AuthProvider>
  </BrowserRouter>
  );
}
