import React, { useEffect, useState } from "react";
import axios from "axios";
import "./EmployeeDirectory.css";

const API = process.env.REACT_APP_API_BASE_URL;

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const MonthWiseReport = () => {
  const [view, setView] = useState("org");
  const [projects, setProjects] = useState({});
  const [expanded, setExpanded] = useState(null);

  const fetchData = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      console.warn("⚠️ No JWT token found in localStorage");
      return;
    }

    try {
      const res = await axios.get(`${API}/api/monthwise-report?view=${view}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setProjects(res.data);
    } catch (err) {
      console.error("❌ Axios request failed:", err.response?.data || err.message);
    }
  };

  useEffect(() => {
    fetchData();
  }, [view]);

  const toggleExpand = (pid) => {
    setExpanded(expanded === pid ? null : pid);
  };

  const getSummaryTotals = () => {
    const summary = { revenue: 0, cost: 0, margin: 0 };
    Object.values(projects).forEach(p => {
      summary.revenue += p.total.revenue;
      summary.cost += p.total.cost;
      summary.margin += p.total.margin;
    });
    return summary;
  };

  const summary = getSummaryTotals();

  return (
    <div className="employee-table-container">
      <div className="table-header mb-4">
        <h2>Month Wise Report</h2>
        <div className="controls">
          <label htmlFor="view">View by:</label>
          <select
            id="view"
            className="search-bar"
            value={view}
            onChange={(e) => setView(e.target.value)}
          >
            <option value="org">Organization</option>
            <option value="dept">Department</option>
            <option value="proj">Project</option>
          </select>
        </div>
      </div>

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
                  Object.values(projects).forEach(p => {
                    total += p.monthly[i + 1]?.[metric] || 0;
                  });
                  return <td className="align-numbers" key={i}>₹{total.toFixed(2)}</td>;
                })}
                <td className={`align-numbers ${metric === "margin" ? (summary[metric] < 0 ? "negative" : "positive") : ""}`}>
                  ₹{summary[metric].toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {Object.entries(projects).map(([pid, proj]) => (
        <div className="group-section" key={pid}>
          <div className="table-header cursor-pointer" onClick={() => toggleExpand(pid)}>
            <h3>{proj.project_name}</h3>
            <span className="status-active">Total Revenue: ₹{proj.total.revenue.toFixed(2)}</span>
          </div>
          {expanded === pid && (
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
          )}
        </div>
      ))}
    </div>
  );
};

export default MonthWiseReport;
