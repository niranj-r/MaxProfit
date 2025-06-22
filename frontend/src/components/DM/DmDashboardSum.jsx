import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaChartLine, FaCoins, FaHandHoldingUsd, FaFolderOpen } from "react-icons/fa"; // FaFolderOpen for project icon
import "../DashboardSummary.css";

const API = process.env.REACT_APP_API_BASE_URL;

const DepartmentDashboardSummary = () => {
  const token = localStorage.getItem("token");
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState("all");
  const [summary, setSummary] = useState({
    cost: 0,          // Revenue
    actual_cost: 0,   // Cost
    profit: 0,
    projectCount: 0   // 🔹 New
  });
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const name = localStorage.getItem("userName");
    if (name) setUserName(name);
  }, []);

  useEffect(() => {
    axios.get(`${API}/api/department-projects`, authHeader)
      .then(res => {
        const departments = res.data || [];
        setDepartments(departments);
      })
      .catch(err => console.error("Error fetching departments:", err));
  }, []);

  useEffect(() => {
    if (departments.length === 0) return;

    console.log("🔍 Selected Department ID:", selectedDept);
    console.log("📦 Departments Data:", departments);

    if (selectedDept === "all") {
      const totalRevenue = departments.reduce((acc, dept) => acc + (dept.cost || 0), 0);
      const totalCost = departments.reduce((acc, dept) => acc + (dept.actual_cost || 0), 0);
      const totalProfit = totalRevenue - totalCost;
      const totalProjects = departments.reduce((acc, dept) => acc + (dept.projects?.length || 0), 0); // 🔹

      setSummary({
        cost: totalRevenue,
        actual_cost: totalCost,
        profit: totalProfit,
        projectCount: totalProjects, // 🔹
      });
    } else {
      const dept = departments.find((d) => d.departmentId == selectedDept); // loose equality handles type mismatch
      console.log("✅ Matched Department:", dept);

      if (dept) {
        const revenue = dept.cost || 0;
        const cost = dept.actual_cost || 0;
        const profit = revenue - cost;
        const projectCount = dept.projects?.length || 0; // 🔹

        setSummary({
          cost: revenue,
          actual_cost: cost,
          profit,
          projectCount, // 🔹
        });
      }
    }
  }, [selectedDept, departments]);

  const cards = [
    {
      title: "Projects",
      value: `${summary.projectCount ?? 0}`,
      icon: <FaFolderOpen className="icon" />,
      color: "#36b9cc",
    },
    {
      title: "Revenue ($)",
      value: `$${(summary.cost ?? 0).toLocaleString()}`,
      icon: <FaChartLine className="icon" />,
      color: "#4e73df",
    },
    {
      title: "Cost ($)",
      value: `$${(summary.actual_cost ?? 0).toLocaleString()}`,
      icon: <FaCoins className="icon" />,
      color: "#e74a3b",
    },
    {
      title: "Profit ($)",
      value: `$${(summary.profit ?? 0).toLocaleString()}`,
      icon: <FaHandHoldingUsd className="icon" />,
      color: "#1cc88a",
    },
  ];

  return (
    <div className="dashboard-summary">
      <h2 className="org-heading">
        {userName ? `Welcome, ${userName}` : "Welcome"}
      </h2>
      <div className="filters">
        <label>
          Department:
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
          >
            <option value="all">All Departments</option>
            {departments.map((dept) => (
              <option key={dept.departmentId} value={dept.departmentId}>
                {dept.departmentName}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="summary-cards">
        {cards.map((card, idx) => (
          <div
            className="card"
            key={idx}
            style={{ borderLeftColor: card.color }}
          >
            <div className="card-body">
              <div
                className="card-icon1"
                style={{ backgroundColor: card.color }}
              >
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
    </div>
  );
};

export default DepartmentDashboardSummary;
