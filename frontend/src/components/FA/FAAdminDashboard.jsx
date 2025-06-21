import React from 'react';
import { useNavigate } from 'react-router-dom';
import FANavbar from './FANavbar';
import '../styles/AdminDashboard.css';
import FADashboardSummary from './FADashboardSummary'; // Assuming you have a summary component
const API = process.env.REACT_APP_API_BASE_URL;


const FAAdminDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="admin-dashboard">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <FANavbar />
        </div>
        <div className="dashboard-group">
          <div className="dashboard-vertical">
            <div className="dashboard-welcome">
              <FADashboardSummary />
            </div>
          </div>
        </div>
      </div>
    </div>

  );
};

export default FAAdminDashboard;