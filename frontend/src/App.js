import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminPetsPage from './pages/admin/AdminPetsPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import './pages/HomePage.css';
import './components/Navbar.css';
import './styles/globals.css';

// Simple placeholder components for remaining pages
const BrowsePage = () => (
  <div style={{ padding: '50px', textAlign: 'center' }}>
    <h2>Browse Pets</h2>
    <p>Coming soon...</p>
  </div>
);

const DashboardPage = () => (
  <div style={{ padding: '50px', textAlign: 'center' }}>
    <h2>User Dashboard</h2>
    <p>Coming soon...</p>
  </div>
);

const AdminRequestsPage = () => <div style={{ padding: '50px', textAlign: 'center' }}>Adoption Requests - Coming Soon</div>;
const AdminMonitoringPage = () => <div style={{ padding: '50px', textAlign: 'center' }}>Monitoring - Coming Soon</div>;
const AdminPostsPage = () => <div style={{ padding: '50px', textAlign: 'center' }}>Public Posts - Coming Soon</div>;
const AdminSettingsPage = () => <div style={{ padding: '50px', textAlign: 'center' }}>Settings - Coming Soon</div>;

const AppWrapper = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  
  return (
    <>
      {!isAdminRoute && <Navbar />}
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/browse" element={<BrowsePage />} />
        
        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/pets" element={<AdminPetsPage />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="/admin/requests" element={<AdminRequestsPage />} />
        <Route path="/admin/monitoring" element={<AdminMonitoringPage />} />
        <Route path="/admin/posts" element={<AdminPostsPage />} />
        <Route path="/admin/settings" element={<AdminSettingsPage />} />
        
        {/* User Dashboard Routes */}
        <Route path="/dashboard" element={<DashboardPage />} />
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
