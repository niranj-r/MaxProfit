import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './PMNavbar';
import '../styles/Dashboard.css';
import DashboardSummary from './PMDashboardSummary'; // Assuming you have a summary component
import BudgetChart from './PMBudgetChart'; // Assuming you have a budget chart 
const API = process.env.REACT_APP_API_BASE_URL;


const PMDashboard = () => {
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
            <div className="dashboard-welcome1">
              <BudgetChart />
            </div>
          </div>
        </div>
      </div>
    </div>

  );
};

export default PMDashboard;