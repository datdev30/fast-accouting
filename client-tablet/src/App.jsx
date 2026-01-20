import React, { useEffect } from 'react';
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
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import BackupModal from './components/BackupModal';

function useZoom() {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey) {
        if (e.key === '=' || e.key === '+' || e.key === 'Add') { // + or Numpad +
          e.preventDefault();
          updateZoom(0.1);
        } else if (e.key === '-' || e.key === 'Subtract') { // - or Numpad -
          e.preventDefault();
          updateZoom(-0.1);
        } else if (e.key === '0') {
          e.preventDefault();
          setZoom(1);
        }
      }
    };

    const handleWheel = (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.1 : -0.1;
        updateZoom(delta);
      }
    };

    const updateZoom = (delta) => {
      const currentZoom = parseFloat(document.body.style.zoom) || 1;
      let newZoom = currentZoom + delta;
      // Clamp between 1.0 (100%) and 1.5 (150%)
      newZoom = Math.min(Math.max(newZoom, 1.0), 1.5);
      document.body.style.zoom = newZoom;
    };

    const setZoom = (val) => {
      document.body.style.zoom = val;
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('wheel', handleWheel);
    };
  }, []);
}

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
          <Route path="info" element={<Info />} />
          <Route path="guide" element={<Guide />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

function App() {
  useZoom();
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
