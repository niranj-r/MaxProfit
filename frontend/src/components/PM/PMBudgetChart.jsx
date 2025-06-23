import React, { useEffect, useState } from "react";
import axios from "axios";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
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
  Tooltip,
  Legend,
  Title
);

const API = process.env.REACT_APP_API_BASE_URL;

const BudgetChart = () => {
  const [chartData, setChartData] = useState({
    labels: [],
    revenueData: [],
    costData: [],
    marginData: []
  });

  const [chartType, setChartType] = useState("line");
  const [showMargin, setShowMargin] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    axios
      .get(`${API}/api/pm-project-budgets`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then((res) => {
        const rawData = res.data;
        const labels = rawData.map((p) => p.name);
        const revenue = rawData.map((p) => Number(p.cost ?? 0));
        const cost = rawData.map((p) => Number(p.actual_cost ?? 0));
        const margin = revenue.map((r, idx) => r - cost[idx]);

        setChartData({
          labels,
          revenueData: revenue,
          costData: cost,
          marginData: margin
        });
      })
      .catch((err) => console.error("Error fetching chart data", err));
  }, []);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        labels: {
          usePointStyle: true,
          generateLabels: (chart) => {
            const datasets = chart.data.datasets;

            return datasets.map((dataset, i) => {
              const meta = chart.getDatasetMeta(i);
              const style = meta.controller.getStyle();

              if (dataset.label === "Margin") {
                const canvas = document.createElement("canvas");
                canvas.width = 20;
                canvas.height = 12;
                const ctx = canvas.getContext("2d");

                // Draw half green, half red
                ctx.fillStyle = "#22c55e"; // green
                ctx.fillRect(0, 0, 10, 12);
                ctx.fillStyle = "#E74A3B"; // red
                ctx.fillRect(10, 0, 10, 12);

                return {
                  text: dataset.label,
                  pointStyle: canvas,
                  usePointStyle: true,
                  fillStyle: "#000", // doesn't matter for canvas
                  strokeStyle: "#000",
                  hidden: !chart.isDatasetVisible(i),
                  datasetIndex: i // ✅ very important
                };
              }

              // Revenue & Cost
              return {
                text: dataset.label,
                pointStyle: "rect",
                usePointStyle: true,
                fillStyle: style.backgroundColor,
                strokeStyle: style.borderColor,
                hidden: !chart.isDatasetVisible(i),
                datasetIndex: i
              };
            });
          }

        }

      },
      title: {
        display: true,
        text: "Project Revenue Overview",
        font: { size: 20, weight: "600", family: "Inter, sans-serif" },
        color: "#1F2937",
        padding: { top: 10, bottom: 20 }
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.dataset.label || "";
            const value = context.raw;
            if (label.includes("Margin")) {
              const isLoss = chartData.marginData[context.dataIndex] < 0;
              return `${isLoss ? "Loss" : "Profit"}: ${Math.abs(value)}`;
            }
            return `${label}: ${value}`;
          }
        },
        backgroundColor: "#1F2937",
        titleColor: "#ffffff",
        bodyColor: "#E5E7EB",
        cornerRadius: 6,
        padding: 10
      }
    },
    scales: {
      x: {
        grid: { display: false },
        title: {
          display: true,
          text: "Project Name",
          font: { size: 14, weight: "bold" }
        }
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Financials (in $)",
          font: { size: 14, weight: "bold" }
        }
      }
    },
    elements: {
      point: {
        radius: 4,
        hoverRadius: 6
      },
      line: {
        tension: 0.4,
        borderWidth: 2
      }
    }
  };

  const renderChart = () => {
    const { labels, revenueData, costData, marginData } = chartData;

    const datasets =
      chartType === "line"
        ? [
          {
            label: "Revenue",
            data: revenueData,
            borderColor: "#2563EB",
            backgroundColor: "#2563EB",
            tension: 0.4,
            fill: true
          },
          {
            label: "Cost",
            data: costData,
            borderColor: "#F59E0B",
            backgroundColor: "#F59E0B",
            tension: 0.4,
            fill: true
          },
          ...(showMargin
            ? [
              {
                label: "Margin",
                data: marginData,
                pointBackgroundColor: marginData.map((m) =>
                  m >= 0 ? "#22c55e" : "#E74A3B"
                ),
                pointBorderColor: marginData.map((m) =>
                  m >= 0 ? "#22c55e" : "#E74A3B"
                ),
                borderColor: "#22c55e", // default green
                segment: {
                  borderColor: (ctx) => {
                    const currentValue = ctx.p0.parsed.y;
                    const nextValue = ctx.p1.parsed.y;

                    // If both points are negative (loss), make the line red
                    if (currentValue < 0 && nextValue < 0) {
                      return "#E74A3B"; // red for loss
                    }
                    // If both points are positive (profit), make the line green
                    else if (currentValue >= 0 && nextValue >= 0) {
                      return "#22c55e"; // green for profit
                    }
                    // If crossing zero, use a neutral color
                    else {
                      return "rgba(148,163,184,0.8)"; // gray when crossing zero
                    }
                  }
                },
                fill: false,
                tension: 0.4
              }
            ]
            : [])
        ]
        : [
          {
            label: "Revenue",
            data: revenueData,
            backgroundColor: "#2563EB",
            barThickness: 15
          },
          {
            label: "Cost",
            data: costData,
            backgroundColor: "#F59E0B",
            barThickness: 15
          },
          ...(showMargin
            ? [
              {
                label: "Margin",
                data: marginData.map((m) => Math.abs(m)),
                backgroundColor: marginData.map((m) =>
                  m >= 0 ? "#22c55e" : "#E74A3B"
                ),
                barThickness: 15
              }
            ]
            : [])
        ];

    const data = { labels, datasets };

    return chartType === "line" ? (
      <Line data={data} options={chartOptions} />
    ) : (
      <Bar data={data} options={chartOptions} />
    );
  };

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "900px",
        height: "auto",
        margin: "32px auto",
        background: "#fff",
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
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "10px"
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
          Project Revenue Overview
        </h3>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "14px", color: "#374151" }}>
              Show Margin
            </span>
            <div
              onClick={() => setShowMargin(!showMargin)}
              style={{
                width: "44px",
                height: "24px",
                backgroundColor: showMargin ? "#22c55e" : "#d1d5db",
                borderRadius: "9999px",
                position: "relative",
                cursor: "pointer",
                transition: "background-color 0.3s ease-in-out"
              }}
            >
              <div
                style={{
                  width: "18px",
                  height: "18px",
                  backgroundColor: "#fff",
                  borderRadius: "50%",
                  position: "absolute",
                  top: "3px",
                  left: showMargin ? "22px" : "4px",
                  transition: "left 0.25s ease-in-out"
                }}
              />
            </div>
          </div>

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
          >
            <option value="line">Line Chart</option>
            <option value="bar">Bar Chart</option>
          </select>
        </div>
      </div>

      <div style={{ flexGrow: 1 }}>{renderChart()}</div>
    </div>
  );
};

export default BudgetChart;