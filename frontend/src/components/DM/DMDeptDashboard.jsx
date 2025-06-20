import React from 'react';
import { useNavigate } from 'react-router-dom';
import DMDepartmentDirectory from './DMDeptDirectory';
import '../styles/Dashboard.css';
import DMNavbar from './DMNavbar';
const API = process.env.REACT_APP_API_BASE_URL;


const DMDeptDashboard = () => {
  const navigate = useNavigate();

  return (
<div className="admin-dashboard">
  <div className="dashboard-container">
    <div className="dashboard-header">
      <DMNavbar />
    </div>

    <div className="dashboard-directory">
      <DMDepartmentDirectory />
    </div>
  </div>
</div>

  );
};

export default DMDeptDashboard;
