import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaChartLine, FaCoins, FaHandHoldingUsd } from "react-icons/fa";
import { useParams } from "react-router-dom";
import "../DashboardSummary.css";

const API = process.env.REACT_APP_API_BASE_URL;

const OverviewDashboardSummary = () => {
  const token = localStorage.getItem("token");
  const authHeader = {
    headers: { Authorization: `Bearer ${token}` },
  };

  const { label: fyLabel } = useParams();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("all");
  const [summary, setSummary] = useState({
    cost: 0,
    actual_cost: 0,
    profit: 0,
  });
  const [stats, setStats] = useState({
    projects: 0,
    employees: 0,
    departments: 0,
    totalBudget: 0,
    organisationName: "",
  });

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

  useEffect(() => {
    if (!fyLabel) return;

    const [sy, ey] = fyLabel.split("-").map(Number);
    const fyStart = `${sy}-04-01`;
    const fyEnd = `${ey}-03-31`;

    axios
      .get(`${API}/api/sum-projects-by-fy`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { startDate: fyStart, endDate: fyEnd },
      })
      .then((res) => {
        setProjects(res.data);
        setSelectedProject("all");
      })
      .catch((err) => console.error("Error fetching projects:", err));
  }, [fyLabel, token]);

  useEffect(() => {
    if (!selectedProject || projects.length === 0) {
      setSummary({ cost: 0, actual_cost: 0, profit: 0 });
      return;
    }

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
      } else {
        setSummary({ cost: 0, actual_cost: 0, profit: 0 });
      }
    }
  }, [selectedProject, projects]);

  const marginValueColor =
    summary.profit > 0
      ? "#008000"
      : summary.profit < 0
      ? "red"
      : "black";

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
      title: "Margin ($)",
      value: `$${(summary.profit ?? 0).toLocaleString()}`,
      icon: <FaHandHoldingUsd className="icon" />,
      color: "#1cc88a",
      valueColor: marginValueColor,
    },
  ];

  return (
    <div className="dashboard-summary">
      <h2 className="org-heading">Organisation: {stats.organisationName}</h2>
      <div className="filters">
        <label className="labels">
          Project:
          <select
            value={selectedProject}
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
          <div className="card" key={idx} style={{ borderLeftColor: card.color }}>
            <div className="card-body">
              <div className="card-icon1" style={{ backgroundColor: card.color }}>
                {card.icon}
              </div>
              <div className="card-text">
                <h4>{card.title}</h4>
                <p style={{ color: card.valueColor || "#000" }}>{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OverviewDashboardSummary;
