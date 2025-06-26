import React, { useEffect, useState } from "react";
import axios from "axios";
import "./EmployeeDirectory.css";

const API = process.env.REACT_APP_API_BASE_URL;
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const MonthWiseReportDept = () => {
  const [view, setView] = useState("dept");
  const [data, setData] = useState({});
  const [expanded, setExpanded] = useState({});

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await axios.get(`${API}/api/monthwise-report?view=${view}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data);
    } catch (err) {
      console.error("❌ Axios request failed:", err.response?.data || err.message);
    }
  };

  useEffect(() => {
    fetchData();
    setExpanded({});
  }, [view]);

  const toggleExpand = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getSummaryTotals = () => {
    const summary = { revenue: 0, cost: 0, margin: 0 };
    Object.values(data).forEach(entry => {
      summary.revenue += entry.total.revenue;
      summary.cost += entry.total.cost;
      summary.margin += entry.total.margin;
    });
    return summary;
  };

  const summary = getSummaryTotals();

  return (
    <div className="employee-table-container">

      {/* ⬛ Consolidated Summary */}
      <div className="group-section">
        <h3>Consolidated Summary</h3>
        <table className="employee-table">
          <thead>
            <tr>
              <th>Metric</th>
              {months.map(m => <th key={m}>{m}</th>)}
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {["revenue", "cost", "margin"].map(metric => (
              <tr key={metric}>
                <td className="font-medium capitalize">{metric}</td>
                {months.map((_, i) => {
                  let total = 0;
                  Object.values(data).forEach(entry => {
                    total += entry.monthly[i + 1]?.[metric] || 0;
                  });
                  return <td key={i} className="align-numbers">₹{total.toFixed(2)}</td>;
                })}
                <td className={`align-numbers ${metric === "margin" && summary[metric] < 0 ? "negative" : "positive"}`}>
                  ₹{summary[metric].toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ⬛ Department Summary Cards */}
      {Object.entries(data).map(([key, entry]) => (
        <div key={key} className={`summary-card ${expanded[key] ? 'expanded' : ''}`}>
          <div className="card-header cursor-pointer" onClick={() => toggleExpand(key)}>
            <h4>{entry.department_name}</h4>
            <span className="status-active">Total Revenue: ₹{entry.total.revenue.toFixed(2)}</span>
            <span className="status-active">Total Cost: ₹{entry.total.cost.toFixed(2)}</span>
            <span className="status-active">Total Margin: ₹{entry.total.margin.toFixed(2)}</span>
          </div>

          {expanded[key] && (
            <div className="card-body">
              <table className="employee-table mt-2">
                <thead>
                  <tr>
                    <th>Metric</th>
                    {months.map(m => <th key={m}>{m}</th>)}
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {["revenue", "cost", "margin"].map(metric => (
                    <tr key={metric}>
                      <td className="font-medium capitalize">{metric}</td>
                      {months.map((_, i) => (
                        <td key={i} className="align-numbers">
                          ₹{entry.monthly[i + 1]?.[metric]?.toFixed(2) || "0.00"}
                        </td>
                      ))}
                      <td className={`align-numbers ${metric === "margin" && entry.total[metric] < 0 ? "negative" : "positive"}`}>
                        ₹{entry.total[metric].toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* 📂 Project-wise breakdown */}
              {entry.projects && (
                <div className="mt-4">
                  <h5 className="font-semibold mb-2">Projects</h5>
                  {Object.entries(entry.projects).map(([pid, proj]) => (
                    <div key={pid} className="project-summary">
                      <div className="table-header">
                        <h5>{proj.project_name}</h5>
                        <span className="status-active">Total Revenue: ₹{proj.total.revenue.toFixed(2)}</span>
                        <span className="status-active">Total Cost: ₹{proj.total.cost.toFixed(2)}</span>
                        <span className="status-active">Total Margin: ₹{proj.total.margin.toFixed(2)}</span>
                      </div>
                      <table className="employee-table mt-2">
                        <thead>
                          <tr>
                            <th>Metric</th>
                            {months.map(m => <th key={m}>{m}</th>)}
                            <th>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {["revenue", "cost", "margin"].map(metric => (
                            <tr key={metric}>
                              <td className="font-medium capitalize">{metric}</td>
                              {months.map((_, i) => (
                                <td className="align-numbers" key={i}>
                                  ₹{proj.monthly[i + 1]?.[metric]?.toFixed(2) || "0.00"}
                                </td>
                              ))}
                              <td className={`align-numbers ${metric === "margin" && proj.total[metric] < 0 ? "negative" : "positive"}`}>
                                ₹{proj.total[metric].toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default MonthWiseReportDept;
