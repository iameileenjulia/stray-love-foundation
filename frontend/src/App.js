import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import BrowsePetsPage from './pages/BrowsePetsPage';
import DashboardPage from './pages/DashboardPage';
import DashboardBrowsePage from './pages/DashboardBrowsePage';
import MyRequestsPage from './pages/MyRequestsPage';
import MonitoringPage from './pages/MonitoringPage';
import PublicPostsPage from './pages/PublicPostsPage';
import ProfilePage from './pages/ProfilePage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminPetsPage from './pages/admin/AdminPetsPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminRequestsPage from './pages/admin/AdminRequestsPage';
import AdminMonitoringPage from './pages/admin/AdminMonitoringPage';
import AdminPostsPage from './pages/admin/AdminPostsPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import './pages/HomePage.css';
import './components/Navbar.css';
import './styles/globals.css';

const AppWrapper = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isDashboardRoute = location.pathname.startsWith('/dashboard');
  
  return (
    <>
      {!isAdminRoute && !isDashboardRoute && <Navbar />}
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/browse" element={<BrowsePetsPage />} />
        
        {/* User Dashboard Routes */}
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/dashboard/browse" element={<DashboardBrowsePage />} />
        <Route path="/dashboard/my-requests" element={<MyRequestsPage />} />
        <Route path="/dashboard/monitoring" element={<MonitoringPage />} />
        <Route path="/dashboard/posts" element={<PublicPostsPage />} />
        <Route path="/dashboard/profile" element={<ProfilePage />} />
        
        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/pets" element={<AdminPetsPage />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="/admin/requests" element={<AdminRequestsPage />} />
        <Route path="/admin/monitoring" element={<AdminMonitoringPage />} />
        <Route path="/admin/posts" element={<AdminPostsPage />} />
        <Route path="/admin/settings" element={<AdminSettingsPage />} />
      </Routes>
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppWrapper />
    </AuthProvider>
  );
}

export default App;
