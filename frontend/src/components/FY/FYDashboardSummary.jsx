import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FaUsers,
  FaProjectDiagram,
  FaSitemap,
  FaMoneyBillWave,
} from "react-icons/fa";
import "../DashboardSummary.css";
import BudgetChart from "./FYBudgetChart";

const API = process.env.REACT_APP_API_BASE_URL;

const FYDashboardSummary = ({ financialYear }) => {
  const token = localStorage.getItem("token");
  const userName = localStorage.getItem("userName");

  const [stats, setStats] = useState({
    projects: 0,
    employees: 0,
    departments: 0,
    totalBudget: 0,
    organisationName: "",
  });

  useEffect(() => {
    if (!financialYear) return;

    const [startYear, endYear] = financialYear.split("-").map(Number);
    const start = new Date(`${startYear}-04-01`);
    const end = new Date(`${endYear}-03-31`);

    const fetchData = async () => {
      try {
        const headers = { headers: { Authorization: `Bearer ${token}` } };

        const [projectsRes, employeesRes, deptsRes, orgNameRes] =
          await Promise.all([
            axios.get(`${API}/api/projects`, headers),
            axios.get(`${API}/api/employees`, headers),
            axios.get(`${API}/api/departments`, headers),
            axios.get(`${API}/api/organisation-name`, headers),
          ]);

        const filteredProjects = projectsRes.data.filter(p => {
          const date = new Date(p.startDate);  // Projects: use startDate
          return date >= start && date <= end;
        });

        const filteredEmployees = employeesRes.data.filter(emp => {
          const created = new Date(emp.createdAt);
          return created >= start && created <= end;
        });

        const totalBudget = filteredProjects.reduce(
          (sum, p) => sum + (parseFloat(p.budget) || 0),
          0
        );

        setStats({
          projects: filteredProjects.length,
          employees: filteredEmployees.length,
          departments: deptsRes.data.length,
          totalBudget,
          organisationName: orgNameRes.data.name,
        });
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      }
    };

    fetchData();
  }, [token, financialYear]);

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
      title: "Total Budget ($)",
      value: stats.totalBudget.toFixed(2),
      icon: <FaMoneyBillWave className="icon" />,
      color: "#e74a3b",
    },
  ];

  return (
    <div className="dashboard-summary">
      <h2 className="org-heading">
        {userName ? `Welcome, ${userName}` : "Welcome"}
      </h2>
      <h2 className="org-heading">Organisation: {stats.organisationName}</h2>
      <h3 className="org-subheading">Financial Year: {financialYear}</h3>

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

      <BudgetChart financialYear={financialYear} />
    </div>
  );
};

export default FYDashboardSummary;
