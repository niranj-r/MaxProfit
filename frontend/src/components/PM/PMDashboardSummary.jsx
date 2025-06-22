import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaChartLine, FaCoins, FaHandHoldingUsd } from "react-icons/fa";
import "../DashboardSummary.css";

const API = process.env.REACT_APP_API_BASE_URL;

const ProjectDashboardSummary = () => {
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
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const name = localStorage.getItem("userName");
    if (name) {
      setUserName(name);
    }
  }, []);

  useEffect(() => {
    axios
      .get(`${API}/api/my-projects`, authHeader)
      .then((res) => {
        setProjects(res.data);
        if (res.data.length > 0) {
          const firstProject = res.data[0];
          setSelectedProject("all");
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


  const cards = [
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

export default ProjectDashboardSummary;
