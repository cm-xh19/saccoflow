import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './components/MainLayout';
import PrivateRoute from './components/PrivateRoute';
import { Spin, Result, Button } from 'antd';

// Pages
import Login from './pages/Login';
import RegisterSacco from './pages/RegisterSacco';
import AdminDashboard from './pages/AdminDashboard';
import AdminMembers from './pages/AdminMembers';
import AdminTransactions from './pages/AdminTransactions';
import AdminLoans from './pages/AdminLoans';
import AdminReports from './pages/AdminReports';

import MemberDashboard from './pages/MemberDashboard';
import MemberAccounts from './pages/MemberAccounts';
import MemberTransactions from './pages/MemberTransactions';
import MemberLoans from './pages/MemberLoans';

const Unauthorized = () => (
  <Result
    status="403"
    title="403"
    subTitle="Sorry, you are not authorized to access this page."
    extra={<Button type="primary" href="#/">Back Home</Button>}
  />
);

// HomeRedirect must be rendered inside AuthProvider — it is, because it's used inside <Routes> which is inside <AuthProvider>
const HomeRedirect = () => {
  const { user, role, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <Spin size="large" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (role === 'member') return <Navigate to="/member/dashboard" replace />;
  // Guest or unknown role — show unauthorized
  return <Navigate to="/unauthorized" replace />;
};

const App = () => {
  return (
    // HashRouter is required for GitHub Pages (static hosting) — avoids 404 on page refresh
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register-sacco" element={<RegisterSacco />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Root: redirect based on role */}
          <Route path="/" element={<HomeRedirect />} />

          {/* Admin Routes */}
          <Route element={<PrivateRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<MainLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="members" element={<AdminMembers />} />
              <Route path="transactions" element={<AdminTransactions />} />
              <Route path="loans" element={<AdminLoans />} />
              <Route path="reports" element={<AdminReports />} />
            </Route>
          </Route>

          {/* Member Routes */}
          <Route element={<PrivateRoute allowedRoles={['member']} />}>
            <Route path="/member" element={<MainLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<MemberDashboard />} />
              <Route path="accounts" element={<MemberAccounts />} />
              <Route path="transactions" element={<MemberTransactions />} />
              <Route path="loans" element={<MemberLoans />} />
            </Route>
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;
