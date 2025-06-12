import React from 'react';
import { useNavigate } from 'react-router-dom';
import './styles/AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>Welcome! Choose an action below to manage the system.</p>
      </div>

      <div className="dashboard-buttons">
        <button className="dashboard-btn" onClick={() => navigate('/manage-users')}>
          👥 Manage Users
        </button>
        <button className="dashboard-btn" onClick={() => navigate('/manage-org-dept')}>
          🏢 Manage Orgs & Departments
        </button>
      </div>
    </div>
  );
};

export default AdminDashboard;
