import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaUsers, FaProjectDiagram, FaSitemap, FaMoneyBillWave } from "react-icons/fa";
import "./DashboardSummary.css";
import BudgetChart from "./BudgetChart"; // ✅ import your separate chart component

const API = process.env.REACT_APP_API_BASE_URL;

const AdminDashboard = () => {
  const token = localStorage.getItem("token");
  const [userName, setUserName] = useState("");
  const [stats, setStats] = useState({
    projects: 0,
    employees: 0,
    departments: 0,
    totalBudget: 0,
    organisationName: "",
  });

  useEffect(() => {
    const name = localStorage.getItem("userName");
    if (name) setUserName(name);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = { headers: { Authorization: `Bearer ${token}` } };
        const [projectsRes, employeesRes, deptsRes, orgNameRes] = await Promise.all([
          axios.get(`${API}/api/projects`, headers),
          axios.get(`${API}/api/employees`, headers),
          axios.get(`${API}/api/departments`, headers),
          axios.get(`${API}/api/organisation-name`, headers),
        ]);

        const totalBudget = projectsRes.data.reduce((sum, p) => sum + (parseFloat(p.budget) || 0), 0);

        setStats({
          projects: projectsRes.data.length,
          employees: employeesRes.data.length,
          departments: deptsRes.data.length,
          totalBudget,
          organisationName: orgNameRes.data.name,
        });
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      }
    };
    fetchData();
  }, [token]);

  const cards = [
    {
      title: "Total Projects",
      value: stats.projects,
      icon: <FaProjectDiagram className="icon" />,
      color: "#4e73df",
    },
    {
      title: "Total Employees",
      value: stats.employees,
      icon: <FaUsers className="icon" />,
      color: "#1cc88a",
    },
    {
      title: "Total Departments",
      value: stats.departments,
      icon: <FaSitemap className="icon" />,
      color: "#f6c23e",
    },
    {
      title: "Total Budget",
      value: `$${stats.totalBudget.toLocaleString()}`,
      icon: <FaMoneyBillWave className="icon" />,
      color: "#e74a3b",
    },
  ];

  return (
    <div className="dashboard-summary">
      <h2 className="org-heading">
        {userName ? `Welcome, ${userName}` : "Welcome"}
      </h2>
      <h2 className="org-heading">
        Organisation: {stats.organisationName}
      </h2>

      <div className="summary-cards">
        {cards.map((card, idx) => (
          <div className="card" key={idx} style={{ borderLeftColor: card.color }}>
            <div className="card-body">
              <div className="card-icon1" style={{ backgroundColor: card.color }}>
                {card.icon}
              </div>
              <div className="card-text">
                <h4>{card.title}</h4>
                <p>{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ✅ Here we simply render your existing chart component */}
      <BudgetChart />
    </div>
  );
};

export default AdminDashboard;
