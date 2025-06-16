import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import AdminSignup from './components/AdminSignup';
import EmployeeDashboard from './components/EmployeeDashBoard';
import EmployeeDirectory from './components/EmployeeDirectory';
import ProjectDashboard from './components/ProjectDashboard';
import ProjectDirectory from './components/ProjectDirectory';
import DepartmentDirectory from './components/DeptDirectory';
import DeptDashboard from './components/DeptDashboard';
import OrganisationDashboard from './components/OrganisationDashboard';
import OrganisationDirectory from './components/OrganisationDirectory';
import Navbar from './components/Navbar';
import DashboardSummary from './components/DashboardSummary';
import RecentActivities from './components/RecentActivities';
import FXRateChart from './components/FXRateChart';
import BudgetChart from './components/BudgetChart';
import ModalWrapper from './components/ModalWrapper';
import ProjectAssignees from './components/ProjectAssignees'; 
import UpcomingDeadlines from './components/UpcomingDeadlines'; 


function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/admin-dashboard" element={<AdminDashboard />} />
      <Route path="/admin-signup" element={<AdminSignup />} />
      <Route path="/employee-dashboard" element={<EmployeeDashboard />} />
      <Route path="/employee-directory" element={<EmployeeDirectory />} />
      <Route path="/project-dashboard" element={<ProjectDashboard />} />
      <Route path="/project-directory" element={<ProjectDirectory />} />
      <Route path="/dept-dashboard" element={<DeptDashboard />} />
      <Route path="/dept-directory" element={<DepartmentDirectory />} />
      <Route path="/org-dashboard" element={<OrganisationDashboard />} />
      <Route path="/org-directory" element={<OrganisationDirectory />} />
      <Route path="/navbar" element={<Navbar />} />
      <Route path="/dashboard-summary" element={<DashboardSummary />} />
      <Route path="/recent-activities" element={<RecentActivities />} />
      <Route path="/fx-rate-chart" element={<FXRateChart />} />
      <Route path="/budget-chart" element={<BudgetChart />} />
      <Route path="/modal-wrapper" element={<ModalWrapper />} />
      <Route path="/project-assignees" element={<ProjectAssignees />} />
      <Route path="/projects/:id/assignees" element={<ProjectAssignees />} />
      <Route path="/upcoming-deadlines" element={<UpcomingDeadlines />} />

      {/* Add more routes as needed */}
    </Routes>
  );
}

export default App;
