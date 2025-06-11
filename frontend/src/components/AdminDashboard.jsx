import React from 'react';
import { useNavigate } from 'react-router-dom';
import './styles/AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      <button onClick={() => navigate('/manage-users')}>Manage Users</button>
      <button onClick={() => navigate('/manage-org-dept')}>Manage Orgs & Departments</button>
    </div>
  );
};

export default AdminDashboard;
