import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaChartLine, FaCoins, FaHandHoldingUsd } from "react-icons/fa";
import "../DashboardSummary.css"; // Reuse styles


const API = process.env.REACT_APP_API_BASE_URL;

const ProjectDashboardSummary = () => {
  const token = localStorage.getItem("token");
  const authHeader = {
    headers: { Authorization: `Bearer ${token}` },
  };

  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState("2025-05");
  const [summary, setSummary] = useState({
    revenue: 0,
    cost: 0,
    profit: 0,
  });

  useEffect(() => {
    // Load projects owned by PM
    axios
      .get(`${API}/api/my-projects`, authHeader)
      .then((res) => {
        setProjects(res.data);
        if (res.data.length > 0) setSelectedProject(res.data[0].id);
      })
      .catch((err) => console.error("Error fetching projects:", err));
  }, []);

  useEffect(() => {
    if (selectedProject && selectedMonth) {
      axios
        .get(`${API}/api/projects/${selectedProject}/summary?month=${selectedMonth}`, authHeader)
        .then((res) => setSummary(res.data))
        .catch((err) => console.error("Error fetching project summary:", err));
    }
  }, [selectedProject, selectedMonth]);

  const cards = [
    {
      title: "Revenue ($)",
      value: `$${summary.revenue.toLocaleString()}`,
      icon: <FaChartLine className="icon" />,
      color: "#4e73df",
    },
    {
      title: "Cost ($)",
      value: `$${summary.cost.toLocaleString()}`,
      icon: <FaCoins className="icon" />,
      color: "#e74a3b",
    },
    {
      title: "Profit ($)",
      value: `$${summary.profit.toLocaleString()}`,
      icon: <FaHandHoldingUsd className="icon" />,
      color: "#1cc88a",
    },
  ];

  return (
    <div className="dashboard-summary">
      <div className="filters">
        <label>
          Project:
          <select value={selectedProject || ""} onChange={(e) => setSelectedProject(e.target.value)}>
            {projects.map((proj) => (
              <option key={proj.id} value={proj.id}>
                {proj.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Month:
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          />
        </label>
      </div>

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

      {/* Add chart or What-If toggle here if needed */}
    </div>
  );
};

export default ProjectDashboardSummary;
