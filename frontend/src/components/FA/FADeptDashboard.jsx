import React from 'react';
import { useNavigate } from 'react-router-dom';
import FADepartmentDirectory from './FADeptDirectory';
import '../styles/Dashboard.css';
import FANavbar from './FANavbar';
const API = process.env.REACT_APP_API_BASE_URL;

const FADeptDashboard = () => {
  const navigate = useNavigate();

  return (
<div className="admin-dashboard">
  <div className="dashboard-container">
    <div className="dashboard-header">
      <FANavbar />
    </div>

    <div className="dashboard-directory">
      <FADepartmentDirectory />
    </div>
  </div>
</div>

  );
};

export default FADeptDashboard;
