import React, { useEffect, useState } from "react";
import axios from "axios";
import "./EmployeeDirectory.css";
import ModalWrapper from "./ModalWrapper";
import ViewAssigneesModal from "./ViewAssigneesModal";


const API = process.env.REACT_APP_API_BASE_URL;

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const MonthWiseReport = () => {
  const [view, setView] = useState("org");
  const [projects, setProjects] = useState({});
  const [expanded, setExpanded] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalProjectId, setModalProjectId] = useState(null);
  const [modalProjectName, setModalProjectName] = useState("");

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
  const openAssigneesModal = (pid, name) => {
    setModalProjectId(pid);
    setModalProjectName(name);
    setShowModal(true);
  };

  const summary = getSummaryTotals();

  return (
    <div className="employee-table-container">
      <div className="group-section">
        <h3>Consolidated Organisation Summary</h3>
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
            <div className="card-body-org">
              <span className="status-chip">Total Revenue: ₹{proj.total.revenue.toFixed(2)}</span>
              <span className="status-chip">Total Cost: ₹{proj.total.cost.toFixed(2)}</span>
              <span className="status-chip">Total Margin: ₹{proj.total.margin.toFixed(2)}</span>
              <button className="assignees-btn" onClick={() => openAssigneesModal(pid, proj.project_name)}>
                View Assignees
              </button>
            </div>

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
      {showModal && modalProjectId && (
        <ModalWrapper
          title={`Assignees for "${modalProjectName}"`}
          onClose={() => {
            setShowModal(false);
            setModalProjectId(null);
            setModalProjectName("");
          }}
        >
          <ViewAssigneesModal projectId={modalProjectId} />
        </ModalWrapper>
      )}

    </div>
  );
};

export default MonthWiseReport;
