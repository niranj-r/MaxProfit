import React from 'react';
import { useNavigate } from 'react-router-dom';
import RecentActivities from './RecentActivities';
import Navbar from './Navbar';
import './styles/AdminDashboard.css';
import DashboardSummary from './DashboardSummary'; // Assuming you have a summary component
import FXRateChart from './FXRateChart';
import BudgetChart from './BudgetChart'; // Assuming you have a budget chart 
import UpcomingDeadlines from './UpcomingDeadlines';
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
            <div className="dashboard-welcome1">
              <BudgetChart />
            </div>
          </div>
          <div className="dashboard-directory">
            <RecentActivities />
            <UpcomingDeadlines />
            <FXRateChart />
          </div>
        </div>
      </div>
    </div>

  );
};

export default AdminDashboard;