import React, { useEffect, useState } from "react";
import axios from "axios";
import { Line, Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Title
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Title
);

const API = process.env.REACT_APP_API_BASE_URL;

const FYBudgetChart = ({ financialYear }) => {
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });
  const [chartType, setChartType] = useState("line");

  useEffect(() => {
    if (!financialYear) return;

    const [startYear, endYear] = financialYear.split("-").map(Number);
    const start = new Date(`${startYear}-04-01`);
    const end = new Date(`${endYear}-03-31`);
    console.log("Financial Year Range:", { start, end });

    const token = localStorage.getItem("token");

    axios.get(`${API}/api/projects`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      console.log("Fetched projects:", res.data);

      const filtered = res.data.filter(p => {
        const startDate = p.startDate ? new Date(p.startDate) : null;
        const isInRange = startDate && startDate >= start && startDate <= end;

        console.log(`Project: ${p.name}, Start Date: ${p.startDate}, In Range: ${isInRange}`);
        return isInRange;
      });

      console.log("Filtered Projects:", filtered);

      const labels = filtered.map(p => p.name);
      const data = filtered.map(p => p.budget || 0);

      console.log("Chart Labels:", labels);
      console.log("Chart Data (Budgets):", data);

      setChartData({
        labels,
        datasets: [{
          label: "Budget",
          data,
          borderColor: "rgba(37, 99, 235, 0.7)",
          backgroundColor: "rgba(37, 99, 235, 0.1)",
          tension: 0.4,
          pointBackgroundColor: "#2563EB",
          fill: true
        }]
      });
    })
    .catch(err => console.error("Error fetching project data", err));
  }, [financialYear]);

  const commonOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: "Project Revenue Overview"
      }
    }
  };

  const lineOptions = {
    ...commonOptions,
    scales: {
      x: { grid: { display: false } },
      y: { grid: { display: false }, beginAtZero: true }
    }
  };

  const barOptions = {
    ...commonOptions,
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: "#E5E7EB" }, beginAtZero: true }
    },
    barThickness: 15
  };

  const pieData = {
    labels: chartData.labels,
    datasets: [{
      label: "Budget",
      data: chartData.datasets[0]?.data || [],
      backgroundColor: ["#2563EB", "#1CC88A", "#F6C23E", "#E74A3B", "#36B9CC", "#FF6384"],
      borderWidth: 1
    }]
  };

  const pieOptions = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      legend: { display: true, position: "right", labels: { boxWidth: 15, padding: 15 } }
    }
  };

  const renderChart = () => {
    switch (chartType) {
      case "bar":
        return <Bar data={chartData} options={barOptions} />;
      case "pie":
        return <Pie data={pieData} options={pieOptions} />;
      default:
        return <Line data={chartData} options={lineOptions} />;
    }
  };

  return (
    <div style={{ width: "100%", maxWidth: "900px", margin: "32px auto", background: "#fff", borderRadius: "12px", padding: "24px", boxShadow: "0 0 10px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
        <h3 style={{ margin: 0, fontSize: "22px", fontWeight: "600" }}>
          Project Revenue Overview ({financialYear})
        </h3>
        <select
          value={chartType}
          onChange={(e) => setChartType(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "14px", cursor: "pointer", backgroundColor: "#fff" }}
        >
          <option value="line">Line Chart</option>
          <option value="bar">Bar Chart</option>
          <option value="pie">Pie Chart</option>
        </select>
      </div>
      <div style={{ flexGrow: 1 }}>
        {renderChart()}
      </div>
    </div>
  );
};

export default FYBudgetChart;
