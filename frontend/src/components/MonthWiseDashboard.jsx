import React from 'react';
import Navbar from './Navbar';
import MonthWiseReportWrapper from './MonthWiseReportWrapper'; // ✅ Import this
import './styles/Dashboard.css';

const MonthWiseDashboard = () => {
  return (
    <div className="admin-dashboard">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <Navbar />
        </div>
        <div className="dashboard-directory">
          <MonthWiseReportWrapper />
        </div>
      </div>
    </div>
  );
};

export default MonthWiseDashboard;
