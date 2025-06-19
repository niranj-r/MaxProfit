import React from 'react';
import { useNavigate } from 'react-router-dom';
import PMProjectDirectory from './PMProjectDirectory';
import PMNavbar from './PMNavbar';
import '../styles/Dashboard.css';

const API = process.env.REACT_APP_API_BASE_URL;

const PMProjectDashboard = () => {
  const navigate = useNavigate();

  return (
<div className="pm-dashboard">
  <div className="dashboard-container">
    <div className="dashboard-header">
      <PMNavbar />
    </div>

    <div className="dashboard-directory">
      <PMProjectDirectory />
    </div>
  </div>
</div>

  );
};

export default PMProjectDashboard;
