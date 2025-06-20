import React from 'react';
import { useNavigate } from 'react-router-dom';
import DMNavbar from './DMNavbar';
import '../styles/Dashboard.css';
import DMDashboardSummary from './DmDashboardSum'; // Assuming you have a summary component
import DMBudgetChart from './DMBudgetChart'; // Assuming you have a budget chart 
const API = process.env.REACT_APP_API_BASE_URL;


const DMDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="admin-dashboard">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <DMNavbar />
        </div>
        <div className="dashboard-group">
          <div className="dashboard-vertical">
            <div className="dashboard-welcome">
              <DMDashboardSummary />
            </div>
            <div className="dashboard-welcome1">
              <DMBudgetChart />
            </div>
          </div>
        </div>
      </div>
    </div>

  );
};

export default DMDashboard;