import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AdminSidebar.css';

const AdminSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const menuItems = [
    { path: '/admin/dashboard', icon: 'fas fa-tachometer-alt', label: 'Dashboard' },
    { path: '/admin/pets', icon: 'fas fa-paw', label: 'Manage Pets' },
    { path: '/admin/users', icon: 'fas fa-users', label: 'Manage Users' },
    { path: '/admin/requests', icon: 'fas fa-file-alt', label: 'Adoption Requests' },
    { path: '/admin/monitoring', icon: 'fas fa-chart-line', label: 'Monitoring' },
    { path: '/admin/posts', icon: 'fas fa-newspaper', label: 'Public Posts' },
    { path: '/admin/settings', icon: 'fas fa-cog', label: 'Settings' },
  ];

  return (
    <aside className="admin-sidebar">
      <h3><i className="fas fa-shield-alt"></i> <span>Admin Menu</span></h3>
      <nav>
        <ul>
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link 
                to={item.path} 
                className={location.pathname === item.path ? 'active' : ''}
              >
                <i className={item.icon}></i>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
          <li>
            <button onClick={handleLogout} className="logout-sidebar-btn">
              <i className="fas fa-sign-out-alt"></i>
              <span>Logout</span>
            </button>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default AdminSidebar;
