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
} from 'chart.js';

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

const DMBudgetChart = () => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: []
  });

  const [chartType, setChartType] = useState("line");

  useEffect(() => {
    const token = localStorage.getItem("token");
    axios.get(`${API}/api/dm-project-budgets`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      const projectNames = res.data.map(p => p.name);
      const costs = res.data.map(p => p.cost);

      setChartData({
        labels: projectNames,
        datasets: [
          {
            label: "Revenue",
            data: costs,
            borderColor: "rgba(37, 99, 235, 0.7)",
            backgroundColor: "rgba(37, 99, 235, 0.1)",
            tension: 0.4,
            pointBackgroundColor: "#2563EB",
            fill: true
          }
        ]
      });
    })
    .catch(err => console.error("Error fetching DM chart data", err));
  }, []);

  const commonOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        font: { size: 20, weight: "600", family: "Inter, sans-serif" },
        color: "#1F2937",
        padding: { top: 10, bottom: 20 }
      },
      tooltip: {
        backgroundColor: "#1F2937",
        titleColor: "#ffffff",
        bodyColor: "#E5E7EB",
        titleFont: { family: "Inter", weight: "600", size: 14 },
        bodyFont: { family: "Inter", size: 13 },
        cornerRadius: 6,
        padding: 10
      }
    }
  };

  const lineOptions = {
    ...commonOptions,
    scales: {
      x: {
        title: { display: true, text: "Project Name", color: "#6B7280", font: { size: 14, weight: "500" } },
        ticks: { color: "#6B7280", font: { size: 12 } },
        grid: { display: false }
      },
      y: {
        title: { display: true, text: "Revenue (in $)", color: "#6B7280", font: { size: 14, weight: "500" } },
        ticks: { color: "#6B7280", font: { size: 12 } },
        grid: { display: false },
        beginAtZero: true
      }
    }
  };

  const barOptions = {
    ...commonOptions,
    scales: {
      x: {
        title: { display: true, text: "Project Name", color: "#6B7280", font: { size: 14, weight: "500" } },
        ticks: { color: "#6B7280", font: { size: 12 } },
        grid: { display: false }
      },
      y: {
        title: { display: true, text: "Revenue (in $)", color: "#6B7280", font: { size: 14, weight: "500" } },
        ticks: { color: "#6B7280", font: { size: 12 } },
        grid: { color: "#E5E7EB" },
        beginAtZero: true
      }
    },
    barThickness: 15
  };

  const pieData = {
    labels: chartData.labels,
    datasets: [{
      label: "Revenue",
      data: chartData.datasets[0]?.data || [],
      backgroundColor: [
        "#2563EB", "#1CC88A", "#F6C23E", "#E74A3B", "#36B9CC", "#FF6384"
      ],
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
        return (
          <Bar
            data={{
              labels: chartData.labels,
              datasets: [{
                label: "Revenue",
                data: chartData.datasets[0]?.data || [],
                backgroundColor: "#2563EB",
                barThickness: 15
              }]
            }}
            options={barOptions}
          />
        );
      case "pie":
        return (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
              maxWidth: "100%",
              width: "100%",
              margin: "0 auto",
              marginTop: "-30px"
            }}
          >
            <Pie data={pieData} options={pieOptions} />
          </div>
        );
      default:
        return <Line data={chartData} options={lineOptions} />;
    }
  };

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "900px",
        height: "480px",
        margin: "32px auto",
        background: "#ffffff",
        borderRadius: "12px",
        padding: "24px",
        boxShadow: "0 0 10px rgba(0,0,0,0.1)",
        display: "flex",
        flexDirection: "column"
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px"
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: "22px",
            fontWeight: "600",
            color: "#1F2937"
          }}
        >
          DM Project Revenue Overview
        </h3>
        <select
          value={chartType}
          onChange={(e) => setChartType(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: "6px",
            border: "1px solid #d1d5db",
            fontSize: "14px",
            cursor: "pointer",
            backgroundColor: "#fff",
            minWidth: "140px"
          }}
          aria-label="Select chart type"
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

export default DMBudgetChart;
