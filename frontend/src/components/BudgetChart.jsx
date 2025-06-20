import React, { useEffect, useState } from "react";
import axios from "axios";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Title
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Title
);

const API = process.env.REACT_APP_API_BASE_URL;

const BudgetChart = () => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: []
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    axios.get(`${API}/api/project-budgets`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => {
        const projectNames = res.data.map(p => p.name);
        const cost = res.data.map(p => p.cost);

        setChartData({
          labels: projectNames,
          datasets: [
            {
              label: "Revenue",
              data: cost,
              borderColor: "rgba(37, 99, 235, 0.7)",
              backgroundColor: "rgba(37, 99, 235, 0.1)",
              tension: 0.4,
              pointBackgroundColor: "#2563EB",
              fill: true
            }
          ]
        });
      })
      .catch(err => console.error("Error fetching chart data", err));
  }, []);

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: "Project Revenue Overview",
        font: {
          size: 20,
          weight: "600",
          family: "Inter, sans-serif"
        },
        color: "#1F2937",
        padding: { top: 10, bottom: 20 }
      },
      tooltip: {
        backgroundColor: "#1F2937",
        titleColor: "#ffffff",
        bodyColor: "#E5E7EB",
        titleFont: {
          family: "Inter",
          weight: "600",
          size: 14
        },
        bodyFont: {
          family: "Inter",
          size: 13
        },
        cornerRadius: 6,
        padding: 10
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Project Name",
          color: "#6B7280",
          font: { size: 14, weight: "500" }
        },
        ticks: {
          color: "#6B7280",
          font: { size: 12 }
        },
        grid: {
          display: false
        }
      },
      y: {
        title: {
          display: true,
          text: "Revenue (in $)",
          color: "#6B7280",
          font: { size: 14, weight: "500" }
        },
        ticks: {
          color: "#6B7280",
          font: { size: 12 }
        },
        grid: {
          color: "#E5E7EB"
        },
        beginAtZero: true
      }
    }
  };

  return (
    <div
      style={{
        width: "100%",
        height: "450px",
        margin: "32px auto",
        background: "#ffffff",
        borderRadius: "12px",
        padding: "24px"
      }}
    >
      <Line data={chartData} options={options} />
    </div>
  );
};

export default BudgetChart;
