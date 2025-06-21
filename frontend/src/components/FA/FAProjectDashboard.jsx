import React from 'react';
import { useNavigate } from 'react-router-dom';
import FAProjectDirectory from './FAProjectDirectory';
import FANavbar from './FANavbar';
import '../styles/Dashboard.css';

const API = process.env.REACT_APP_API_BASE_URL;

const FAProjDashboard = () => {
  const navigate = useNavigate();

  return (
<div className="admin-dashboard">
  <div className="dashboard-container">
    <div className="dashboard-header">
      <FANavbar />
    </div>

    <div className="dashboard-directory">
      <FAProjectDirectory />
    </div>
  </div>
</div>

  );
};

export default FAProjDashboard;
