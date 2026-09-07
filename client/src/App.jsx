import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Reports'; // Using Reports as Dashboard for now
import Customers from './pages/Customers';
import CustomerDebtDetail from './pages/CustomerDebtDetail';
import InterestConfigs from './pages/InterestConfigs';
import Transactions from './pages/Transactions';
import Reports from './pages/Reports';
import Analytics from './pages/Analytics';
import Login from './pages/Login';
import UserManagement from './pages/UserManagement';
import Info from './pages/Info';
import Guide from './pages/Guide';
import BackupData from './pages/BackupData';
import Settings from './pages/Settings';
import BankAccountConfig from './pages/BankAccountConfig';
import SystemNotificationConfig from './pages/SystemNotificationConfig';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WorkingYearProvider } from './context/WorkingYearContext';
import { ToastProvider } from './context/ToastContext';
import BackupModal from './components/BackupModal';
import SystemNotificationBanner from './components/SystemNotificationBanner';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

function AppContent() {
  const { isBackingUp } = useAuth();
  return (
    <>
      <SystemNotificationBanner />
      {isBackingUp && <BackupModal />}
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/overview" replace />} />
          <Route path="customers" element={<Customers />} />
          <Route path="customers/:id/debt" element={<CustomerDebtDetail />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="interest-configs" element={<InterestConfigs />} />
          <Route path="reports" element={<Analytics />} />
          <Route path="overview" element={<Reports />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="backup-data" element={<BackupData />} />
          <Route path="settings" element={<Settings />} />
          <Route path="bank-account-config" element={<BankAccountConfig />} />
          <Route path="system-notification-config" element={<SystemNotificationConfig />} />
          <Route path="info" element={<Info />} />
          <Route path="guide" element={<Guide />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

function App() {

  return (
    <ToastProvider>
      <AuthProvider>
        <WorkingYearProvider>
          <AppContent />
        </WorkingYearProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
