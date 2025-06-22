import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaUsers, FaProjectDiagram, FaSitemap, FaMoneyBillWave } from "react-icons/fa";
import "../DashboardSummary.css";
import BudgetChart from "./FYBudgetChart";
import OverviewDashboardSummary from "./FYOverviewDashboardSummary";

const API = process.env.REACT_APP_API_BASE_URL;

const AdminDashboard = () => {
  const token = localStorage.getItem("token");
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const name = localStorage.getItem("userName");
    if (name) setUserName(name);
  }, []);
  return (
    <div className="dashboard-summary">
      <OverviewDashboardSummary />
      <BudgetChart />
    </div>
  );
};

export default AdminDashboard;
