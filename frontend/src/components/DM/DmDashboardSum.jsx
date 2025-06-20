import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaProjectDiagram, FaCoins, FaHandHoldingUsd } from "react-icons/fa";
import "../DashboardSummary.css";

const API = process.env.REACT_APP_API_BASE_URL;

const DMDashboardSummary = () => {
  const token = localStorage.getItem("token");
  const authHeader = {
    headers: { Authorization: `Bearer ${token}` },
  };

  const [projects, setProjects] = useState([]);
  const [summary, setSummary] = useState({
    projectCount: 0,
    totalBudget: 0,
    estimatedProfit: 0,
  });
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const name = localStorage.getItem("userName");
    if (name) {
      setUserName(name);
    }
  }, []);

  useEffect(() => {
    axios
      .get(`${API}/api/department-projects`, authHeader)
      .then((res) => {
        const { projectCount, totalBudget, estimatedProfit, projects } = res.data;
        setProjects(projects);
        setSummary({
          projectCount,
          totalBudget,
          estimatedProfit,
        });
      })
      .catch((err) =>
        console.error("Error fetching department projects:", err)
      );
  }, []);

  const cards = [
    {
      title: "Total Projects",
      value: summary.projectCount,
      icon: <FaProjectDiagram className="icon" />,
      color: "#4e73df",
    },
    {
      title: "Total Budget ($)",
      value: `$${summary.totalBudget.toLocaleString()}`,
      icon: <FaCoins className="icon" />,
      color: "#e74a3b",
    },
    {
      title: "Estimated Profit ($)",
      value: `$${summary.estimatedProfit.toLocaleString()}`,
      icon: <FaHandHoldingUsd className="icon" />,
      color: "#1cc88a",
    },
  ];

  return (
    <div className="dashboard-summary">
      <h2 className="org-heading">
        {userName ? `Welcome, ${userName}` : "Welcome"}
      </h2>

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

export default DMDashboardSummary;
