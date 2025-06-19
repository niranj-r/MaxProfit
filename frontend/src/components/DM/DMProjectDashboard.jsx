import React from 'react';
import { useNavigate } from 'react-router-dom';
import DMProjectDirectory from './DMProjectDirectory';
import DMNavbar from './DMNavbar';
import '../styles/Dashboard.css';

const API = process.env.REACT_APP_API_BASE_URL;

const DMProjectDashboard = () => {
  const navigate = useNavigate();

  return (
<div className="admin-dashboard">
  <div className="dashboard-container">
    <div className="dashboard-header">
      <DMNavbar />
    </div>

    <div className="dashboard-directory">
      <DMProjectDirectory />
    </div>
  </div>
</div>

  );
};

export default DMProjectDashboard;
