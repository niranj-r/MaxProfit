import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import './EmployeeDirectory.css';
import './FinancialYearView.css'; // new css for styled modal and layout

const FinancialYearView = () => {
  const { yearLabel } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const API = process.env.REACT_APP_API_BASE_URL;

  const [stats, setStats] = useState({ revenue: 0, cost: 0, profit: 0, projects: 0 });
  const [projectList, setProjectList] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedProjectName, setSelectedProjectName] = useState("");
  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    fetchYearStats();
    fetchProjectList();
  }, [yearLabel]);

  const loadAssignments = async (projectId, projectName) => {
    try {
      const res = await axios.get(`${API}/api/project-assignments/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAssignments(res.data);
      setSelectedProjectName(projectName);
      setShowModal(true);
    } catch (err) {
      console.error("Failed to load project assignments:", err);
    }
  };

  const fetchYearStats = async () => {
    try {
      const res = await axios.get(`${API}/api/financial-year-summary?year=${yearLabel}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(res.data.stats);
      setChartData(res.data.chartData);
    } catch (err) {
      console.error("Failed to load summary:", err);
    }
  };

  const fetchProjectList = async () => {
    try {
      const res = await axios.get(`${API}/api/financial-year-projects?year=${yearLabel}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProjectList(res.data);
    } catch (err) {
      console.error("Failed to load projects:", err);
    }
  };

  return (
    <div className="fy-container">
      <div className="fy-header">
        <h2>Financial Year: {yearLabel}</h2>
        <button className="fy-back-btn" onClick={() => navigate(-1)}>← Back</button>
      </div>

      <div className="fy-stats">
        <div><strong>Total Revenue:</strong> ₹{stats.revenue.toLocaleString()}</div>
        <div><strong>Total Cost:</strong> ₹{stats.cost.toLocaleString()}</div>
        <div><strong>Total Profit:</strong> ₹{stats.profit.toLocaleString()}</div>
        <div><strong>Projects:</strong> {stats.projects}</div>
      </div>

      <div className="fy-chart">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="profit" stroke="#4b6cb7" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <table className="fy-table">
        <thead>
          <tr>
            <th>Project Name</th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Revenue</th>
          </tr>
        </thead>
        <tbody>
          {projectList.length === 0 ? (
            <tr><td colSpan="4" className="no-data">No projects in this financial year.</td></tr>
          ) : (
            projectList.map((p, idx) => (
              <tr key={idx} onClick={() => loadAssignments(p.id, p.name)} style={{ cursor: 'pointer' }}>
                <td>{p.name}</td>
                <td>{p.startDate}</td>
                <td>{p.endDate}</td>
                <td>₹{(p.revenue ?? 0).toLocaleString()}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <AssignmentModal
        show={showModal}
        onClose={() => setShowModal(false)}
        projectName={selectedProjectName}
        assignments={assignments}
      />
    </div>
  );
};

const AssignmentModal = ({ show, onClose, projectName, assignments }) => {
  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{projectName} – Assigned Employees</h3>
          <button className="modal-close" onClick={onClose}>✖</button>
        </div>
        {assignments.length === 0 ? (
          <p className="no-data">No assignments found.</p>
        ) : (
          <table className="employee-sub-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Billing Rate</th>
                <th>Allocated %</th>
                <th>Hours</th>
                <th>Start</th>
                <th>End</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((a, i) => (
                <tr key={i}>
                  <td>{a.name}</td>
                  <td>₹{a.billing_rate}</td>
                  <td>{a.allocated_percentage}%</td>
                  <td>{a.allocated_hours}</td>
                  <td>{a.start_date}</td>
                  <td>{a.end_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default FinancialYearView;
