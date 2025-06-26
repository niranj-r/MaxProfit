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
import OverviewDashboardSummary from './components/OverviewDashboardSummary';
import ModalWrapper from './components/ModalWrapper';
import ProjectAssignees from './components/ProjectAssignees'; 
import UpcomingDeadlines from './components/UpcomingDeadlines'; 
import FinancialYearManager from './components/FinancialYearManager';
import FinancialYearPage from './components/FinancialYearPage'; // ✅ Use directly
import { useParams } from 'react-router-dom';
import PMDashboard from './components/PM/PMDashboard';  
import PMNavbar from './components/PM/PMNavbar';
import PMBudgetChart from './components/PM/PMBudgetChart';
import PMModalWrapper from './components/PM/PMModalWrapper';
import PMProjectAssignees from './components/PM/PMProjectAssignees';
import PMProjectDirectory from './components/PM/PMProjectDirectory';
import PMProjectDashboard from './components/PM/PMProjectDashboard';
import DMNavbar from './components/DM/DMNavbar';
import DMDashboard from './components/DM/DMDash';
import DMBudgetChart from './components/DM/DMBudgetChart';
import DMDashboardSummary from './components/DM/DmDashboardSum';
import DMProjectAssignees from './components/DM/DMProjectAssignees';
import DMProjectDirectory from './components/DM/DMProjectDirectory';
import DMProjectDashboard from './components/DM/DMProjectDashboard';
import DMDepartmentDirectory from './components/DM/DMDeptDirectory';
import DMDeptDashboard from './components/DM/DMDeptDashboard';
import FAAdminDashboard from './components/FA/FAAdminDashboard';
import FABudgetChart from './components/FA/FABudgetChart';
import FAAdminDashboardSummary from './components/FA/FADashboardSummary';
import FADeptDashboard from './components/FA/FADeptDashboard'; 
import FADeptDirectory from './components/FA/FADeptDirectory'; 
import FAEmployeeDashboard from './components/FA/FAEmployeeDashBoard';
import FAEmployeeDirectory from './components/FA/FAEmployeeDirectory';
import FANavbar from './components/FA/FANavbar';
import FAOrganisationDashboard from './components/FA/FAOrganisationDashboard'; 
import FAOrganisationDirectory from './components/FA/FAOrganisationDirectory'; 
import FAProjectDashboard from './components/FA/FAProjectDashboard'; 
import FAProjectDirectory from './components/FA/FAProjectDirectory';
import FAFinancialYearManager from './components/FA/FAFinancialYearManager';
import FAFinancialYearPage from './components/FA/FAFinancialYearPage';
import FYNavbar from './components/FY/FYNavbar'
import FYProjectDashboard from './components/FY/FYProjectDashboard';
import FYDashboardSummary from './components/FY/FYDashboardSummary';
import FYAdminDashboard from './components/FY/FYAdminDashboard';
import FYProjectDirectory from './components/FY/FYProjectDirectory';
import MonthWiseReport from './components/MonthWiseReportOrg';
import MonthWiseDashboard from './components/MonthWiseDashboard';

// Wrapper to pass year param as prop
const FinancialYearPageWrapper = () => {
  const { year } = useParams();
  return <FinancialYearPage financialYear={year} goBack={() => window.history.back()} />;
};

const FAFinancialYearPageWrapper = () => {
  const { year } = useParams();
  return <FAFinancialYearPage financialYear={year} goBack={() => window.history.back()} />;
};

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
      <Route path="/overview-dashboard-summary" element={<OverviewDashboardSummary />} />
      <Route path="/modal-wrapper" element={<ModalWrapper />} />
      <Route path="/project-assignees" element={<ProjectAssignees />} />
      <Route path="/projects/:id/assignees" element={<ProjectAssignees />} />
      <Route path="/upcoming-deadlines" element={<UpcomingDeadlines />} />
      <Route path="/financial-year-manager" element={<FinancialYearManager />} />
      <Route path="/employee-financials/:year" element={<FinancialYearPageWrapper />} /> 
      <Route path="/pm-dashboard" element={<PMDashboard />} />
      <Route path="/pm-navbar" element={<PMNavbar />} />  
      <Route path="/pm-budget-chart" element={<PMBudgetChart />} />
      <Route path="/pm-modal-wrapper" element={<PMModalWrapper />} />
      <Route path="/pm-project-assignees" element={<PMProjectAssignees />} />
      <Route path="/pm-project-directory" element={<PMProjectDirectory />} /> 
      <Route path="/pm-project-dashboard" element={<PMProjectDashboard />} />
      <Route path="/dm-navbar" element={<DMNavbar />} />
      <Route path="/dm-dashboard" element={<DMDashboard />} />
      <Route path="/dm-budget-chart" element={<DMBudgetChart />} />
      <Route path="/dm-dashboard-summary" element={<DMDashboardSummary />} />
      <Route path="/dm-project-assignees" element={<DMProjectAssignees />} />
      <Route path="/dm-project-directory" element={<DMProjectDirectory />} /> 
      <Route path="/dm-project-dashboard" element={<DMProjectDashboard />} />
      <Route path="/dm-dept-directory" element={<DMDepartmentDirectory />} />
      <Route path="/dm-dept-dashboard" element={<DMDeptDashboard />} />
      <Route path="/fa-admin-dashboard" element={<FAAdminDashboard />} />
      <Route path="/fa-budget-chart" element={<FABudgetChart />} />
      <Route path="/fa-admin-dashboard-summary" element={<FAAdminDashboardSummary />} />
      <Route path="/fa-dept-dashboard" element={<FADeptDashboard />} />
      <Route path="/fa-dept-directory" element={<FADeptDirectory />} />
      <Route path="/fa-employee-dashboard" element={<FAEmployeeDashboard />} />
      <Route path="/fa-employee-directory" element={<FAEmployeeDirectory />} />
      <Route path="/fa-navbar" element={<FANavbar />} />
      <Route path="/fa-organisation-dashboard" element={<FAOrganisationDashboard />} />
      <Route path="/fa-organisation-directory" element={<FAOrganisationDirectory />} />
      <Route path="/fa-project-dashboard" element={<FAProjectDashboard />} />
      <Route path="/fa-project-directory" element={<FAProjectDirectory />} />
      <Route path="/fa-financial-year-manager" element={<FAFinancialYearManager />} />
      <Route path="/fa-employee-financials/:year" element={<FAFinancialYearPageWrapper />} />
      <Route path="/financial-year/:label" element={<FYAdminDashboard />} />
      <Route path="/financial-year/:label/projects" element={<FYProjectDashboard />} />
      <Route path="/fy-projects/:fyLabel" element={<FYProjectDirectory />} />
      <Route path="/overview-dashboard-summary" element={<OverviewDashboardSummary />} />
      <Route path="/month-wise-report" element={<MonthWiseReport />} />
      <Route path="/month-dashboard" element={<MonthWiseDashboard />} />
    </Routes>
  );
}

export default App;