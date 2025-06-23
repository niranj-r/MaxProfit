import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaChartLine, FaCoins, FaHandHoldingUsd } from "react-icons/fa";
import "./DashboardSummary.css";

const API = process.env.REACT_APP_API_BASE_URL;

const OverviewDashboardSummary = () => {
  const token = localStorage.getItem("token");
  const authHeader = {
    headers: { Authorization: `Bearer ${token}` },
  };

  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [summary, setSummary] = useState({
    cost: 0,
    actual_cost: 0,
    profit: 0,
  });

  useEffect(() => {
    const name = localStorage.getItem("userName");
    if (name) {
      // Optional: set user name
    }
  }, []);

  useEffect(() => {
    axios
      .get(`${API}/api/sum-projects`, authHeader)
      .then((res) => {
        setProjects(res.data);
        if (res.data.length > 0) {
          setSelectedProject("all");
          const firstProject = res.data[0];
          setSummary({
            cost: firstProject.cost || 0,
            profit: 0,
          });
        }
      })
      .catch((err) => console.error("Error fetching projects:", err));
  }, []);

  useEffect(() => {
    if (!selectedProject || projects.length === 0) return;

    if (selectedProject === "all") {
      const totalCost = projects.reduce((acc, proj) => acc + (proj.cost || 0), 0);
      const totalActualCost = projects.reduce((acc, proj) => acc + (proj.actual_cost || 0), 0);
      const totalProfit = totalCost - totalActualCost;

      setSummary({
        cost: totalCost,
        actual_cost: totalActualCost,
        profit: totalProfit,
      });
    } else {
      const project = projects.find((p) => p.id === parseInt(selectedProject));
      if (project) {
        const cost = project.cost || 0;
        const actualCost = project.actual_cost || 0;
        const profit = cost - actualCost;
        setSummary({ cost, actual_cost: actualCost, profit });
      }
    }
  }, [selectedProject, projects]);

  const getProfitColor = () => {
    if (summary.profit > 0) return "#1cc88a";
    if (summary.profit < 0) return "#e74a3b";
    return "#000000";
  };

  const cards = [
    {
      title: "Revenue ($)",
      value: `${(summary.cost ?? 0).toLocaleString()}`,
      icon: <FaChartLine className="icon" />,
      color: "#4e73df",
      textColor: "#000000"
    },
    {
      title: "Cost ($)",
      value: `${(summary.actual_cost ?? 0).toLocaleString()}`,
      icon: <FaCoins className="icon" />,
      color: "#e74a3b",
      textColor: "#000000"
    },
    {
      title: "Margin ($)",
      value: `${(summary.profit ?? 0).toLocaleString()}`,
      icon: <FaHandHoldingUsd className="icon" />,
      color: "#36b9cc",  // You can set any standard card color
      textColor: getProfitColor()
    },
  ];

  return (
    <div className="dashboard-summary">
      <div className="filters">
        <label className='labels'>
          Project:
          <select 
            value={selectedProject || ""}
            onChange={(e) => setSelectedProject(e.target.value)}
          >
            <option value="all">All Projects</option>
            {projects.map((proj) => (
              <option key={proj.id} value={proj.id}>
                {proj.name}
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
              <div className="card-icon1" style={{ backgroundColor: card.color }}>
                {card.icon}
              </div>
              <div className="card-text">
                <h4>{card.title}</h4>
                <p style={{ color: card.textColor }}>{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OverviewDashboardSummary;
