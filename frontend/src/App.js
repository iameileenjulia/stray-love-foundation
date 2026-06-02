import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';

// Public Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import BrowsePetsPage from './pages/BrowsePetsPage';

// User Pages
import DashboardPage from './pages/DashboardPage';
import DashboardBrowsePage from './pages/DashboardBrowsePage';
import MyRequestsPage from './pages/MyRequestsPage';
import MonitoringPage from './pages/MonitoringPage';
import PublicPostsPage from './pages/PublicPostsPage';
import ProfilePage from './pages/ProfilePage';

// Admin Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminPetsPage from './pages/admin/AdminPetsPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminRequestsPage from './pages/admin/AdminRequestsPage';
import AdminMonitoringPage from './pages/admin/AdminMonitoringPage';
import AdminPostsPage from './pages/admin/AdminPostsPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import AdminLoginPage from './pages/admin/AdminLoginPage';

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/browse" element={<BrowsePetsPage />} />
        
        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<AdminRoute />}>
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="pets" element={<AdminPetsPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="requests" element={<AdminRequestsPage />} />
          <Route path="monitoring" element={<AdminMonitoringPage />} />
          <Route path="posts" element={<AdminPostsPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>
        
        {/* User Routes */}
        <Route path="/dashboard" element={<PrivateRoute />}>
          <Route index element={<DashboardPage />} />
          <Route path="browse" element={<DashboardBrowsePage />} />
          <Route path="my-requests" element={<MyRequestsPage />} />
          <Route path="monitoring" element={<MonitoringPage />} />
          <Route path="posts" element={<PublicPostsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
        
        {/* 404 Redirect */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;