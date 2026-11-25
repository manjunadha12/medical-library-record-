import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

import { DashboardLayout } from './components/layout/DashboardLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { PatientRegistrationPage } from './pages/PatientRegistrationPage';
import { DoctorRegistrationPage } from './pages/DoctorRegistrationPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { PatientDashboard } from './pages/PatientDashboard';
import { DoctorDashboard } from './pages/DoctorDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { MedicalRecordsPage } from './pages/MedicalRecordsPage';
import { UploadRecordPage } from './pages/UploadRecordPage';
import { RecordDetailsPage } from './pages/RecordDetailsPage';
import { SecurityStatusPage } from './pages/SecurityStatusPage';
import { DoctorDirectoryPage } from './pages/DoctorDirectoryPage';
import { AccessRequestsPage } from './pages/AccessRequestsPage';
import { ConsentManagementPage } from './pages/ConsentManagementPage';
import { IntegrityVerificationPage } from './pages/IntegrityVerificationPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ProfileSettingsPage } from './pages/ProfileSettingsPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Smart Dashboard Redirection based on active user role
const RoleBasedDashboardRedirect = () => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
  if (user.role === 'patient') return <Navigate to="/dashboard/patient" replace />;
  if (user.role === 'doctor') return <Navigate to="/dashboard/doctor" replace />;
  if (user.role === 'admin') return <Navigate to="/dashboard/admin" replace />;
  return <Navigate to="/" replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Routes>
          {/* Public Pages */}
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/register/patient" element={<PatientRegistrationPage />} />
          <Route path="/register/doctor" element={<DoctorRegistrationPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Authenticated Application Routes */}
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            {/* Dynamic Dashboard Route */}
            <Route path="/dashboard" element={<RoleBasedDashboardRedirect />} />
            <Route
              path="/dashboard/patient"
              element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <PatientDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/doctor"
              element={
                <ProtectedRoute allowedRoles={['doctor']}>
                  <DoctorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Common & Role-Scoped Medical Features */}
            <Route path="/records" element={<MedicalRecordsPage />} />
            <Route path="/records/:id" element={<RecordDetailsPage />} />
            <Route path="/upload" element={<ProtectedRoute allowedRoles={['patient', 'doctor']}><UploadRecordPage /></ProtectedRoute>} />
            <Route path="/security-status" element={<SecurityStatusPage />} />
            <Route path="/doctors" element={<ProtectedRoute allowedRoles={['patient', 'doctor']}><DoctorDirectoryPage /></ProtectedRoute>} />
            <Route path="/access-requests" element={<ProtectedRoute allowedRoles={['patient', 'doctor']}><AccessRequestsPage /></ProtectedRoute>} />
            <Route path="/consent-management" element={<ProtectedRoute allowedRoles={['patient', 'doctor']}><ConsentManagementPage /></ProtectedRoute>} />
            <Route path="/integrity-verification" element={<IntegrityVerificationPage />} />
            <Route path="/audit-logs" element={<AuditLogsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/profile" element={<ProfileSettingsPage />} />
          </Route>

          {/* 404 Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </NotificationProvider>
    </AuthProvider>
  );
}
