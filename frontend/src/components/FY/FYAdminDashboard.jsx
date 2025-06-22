import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './FYNavbar';
import '../styles/AdminDashboard.css';
import DashboardSummary from './FYDashboardSummary';
import BudgetChart from './FYBudgetChart'; 
const API = process.env.REACT_APP_API_BASE_URL;


const AdminDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="admin-dashboard">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <Navbar />
        </div>
        <div className="dashboard-group">
          <div className="dashboard-vertical">
            <div className="dashboard-welcome">
              <DashboardSummary />
            </div>
          </div>
        </div>
      </div>
    </div>

  );
};

export default AdminDashboard;