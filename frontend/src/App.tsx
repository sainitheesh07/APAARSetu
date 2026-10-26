import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './layouts/AppLayout';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { InstitutionDashboard } from './pages/InstitutionDashboard';
import { InstitutionManagement } from './pages/InstitutionManagement';
import { ProgrammeManagement } from './pages/ProgrammeManagement';
import { StudentManagement } from './pages/StudentManagement';
import { BulkUploadPage } from './pages/BulkUploadPage';
import { ValidationCenterPage } from './pages/ValidationCenterPage';
import { StudentProfilePage } from './pages/StudentProfilePage';
import { VerificationPortalPage } from './pages/VerificationPortalPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AuditTrailPage } from './pages/AuditTrailPage';
import { UserManagementPage } from './pages/UserManagementPage';
import { SettingsPage } from './pages/SettingsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white text-sm">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
        <span>Verifying Security Token...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            
            {/* Verification can be accessed both publicly and inside layout */}
            <Route path="/verify" element={
              <div className="min-h-screen bg-slate-50 flex flex-col">
                <AppLayout />
              </div>
            }>
              <Route index element={<VerificationPortalPage />} />
            </Route>

            {/* Authenticated Dashboard Routes wrapped in AppLayout */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/institution/dashboard" element={<InstitutionDashboard />} />
              <Route path="/admin/institutions" element={<InstitutionManagement />} />
              <Route path="/programmes" element={<ProgrammeManagement />} />
              <Route path="/students" element={<StudentManagement />} />
              <Route path="/upload" element={<BulkUploadPage />} />
              <Route path="/validation" element={<ValidationCenterPage />} />
              <Route path="/student/profile" element={<StudentProfilePage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/audit" element={<AuditTrailPage />} />
              <Route path="/users" element={<UserManagementPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
