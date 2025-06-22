// ✅ Cleaned and fully working version of FinancialYearPage.jsx

import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaEdit, FaCheck, FaTimes } from "react-icons/fa";
import Navbar from "./Navbar";
import Papa from "papaparse";
import "./FinancialyearPage.css";
import { useNavigate } from "react-router-dom";

const API = process.env.REACT_APP_API_BASE_URL;

const FinancialYearPage = ({ financialYear, goBack }) => {
  const [employees, setEmployees] = useState([]);
  const [editRowId, setEditRowId] = useState(null);
  const [editValues, setEditValues] = useState({ salary: "", infrastructure: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  const getCurrentFinancialYear = () => {
    const today = new Date();
    const year = today.getMonth() < 3 ? today.getFullYear() - 1 : today.getFullYear();
    return `${year}-${year + 1}`;
  };
  const currentFinancialYear = getCurrentFinancialYear();

  useEffect(() => {
    if (!financialYear || financialYear === "null" || financialYear === "undefined") {
      setError("Financial year not provided or invalid.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    axios.get(`${API}/api/employee-financials?year=${financialYear}`, authHeader)
      .then((res) => {
        setEmployees(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(`Failed to fetch employee data: ${err.response?.data?.error || err.message}`);
        setLoading(false);
      });
  }, [financialYear]);

  const startEdit = (emp) => {
    setEditRowId(emp.eid);
    setEditValues({
      salary: emp.salary != null ? emp.salary.toString() : "",
      infrastructure: emp.infrastructure != null ? emp.infrastructure.toString() : "",
    });
  };

  const cancelEdit = () => {
    setEditRowId(null);
    setEditValues({ salary: "", infrastructure: "" });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setEditValues((prev) => ({ ...prev, [name]: value }));
    }
  };

  const saveEdit = async (eid) => {
    try {
      const payload = {
        salary: editValues.salary === "" ? null : parseFloat(editValues.salary),
        infrastructure: editValues.infrastructure === "" ? null : parseFloat(editValues.infrastructure),
        financial_year: financialYear,
      };

      await axios.post(`${API}/api/employee-financials/${eid}`, payload, authHeader);

      setEmployees((prev) =>
        prev.map((emp) =>
          emp.eid === eid
            ? {
                ...emp,
                salary: payload.salary,
                infrastructure: payload.infrastructure,
                cost: (payload.salary || 0) + (payload.infrastructure || 0),
              }
            : emp
        )
      );

      setEditRowId(null);
      setEditValues({ salary: "", infrastructure: "" });
    } catch (err) {
      alert(`Failed to update employee data: ${err.response?.data?.error || err.message}`);
    }
  };

  const downloadCSV = () => {
    if (employees.length === 0) {
      alert("No data to export.");
      return;
    }

    const dataForCSV = employees.map((emp) => ({
      "Emp ID": emp.eid,
      "Employee Name": `${emp.fname} ${emp.lname}`,
      Salary: emp.salary ?? 0,
      Infrastructure: emp.infrastructure ?? 0,
      "Total Cost": (emp.salary ?? 0) + (emp.infrastructure ?? 0),
    }));

    const csv = Papa.unparse(dataForCSV);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `financial_data_${financialYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="loading">Loading employee data...</div>;
  if (error)
    return (
      <div className="error-container">
        <Navbar />
        <button onClick={goBack} className="back-button">← Back</button>
        <p className="error-text">{error}</p>
      </div>
    );

  return (
    <div className="financial-year-page">
      <header className="dashboard-header">
        <Navbar />
      </header>
      <div className="financial-page-wrapper">
        <main className="financial-content">
          <button onClick={goBack} className="back-button">← Back to Financial Years</button>

          <h2 className="fy-heading">Financial Year: {financialYear}</h2>
          <button
            className="download-btn"
            onClick={() => navigate(`/financial-year/${financialYear}`)}
            style={{ marginLeft: "10px" }}
          >
            📊 View Dashboard
          </button>

          <button onClick={downloadCSV} className="download-btn">⬇ Download CSV</button>

          <div className="table-container">
            <table className="employee-table">
              <thead>
                <tr>
                  <th>Emp ID</th>
                  <th>Employee Name</th>
                  <th>Salary ($)</th>
                  <th>Infrastructure ($)</th>
                  <th>Total Cost ($)</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="no-data">
                      No employees found for this financial year.
                    </td>
                  </tr>
                ) : (
                  employees.map((emp) => {
                    const isEditing = editRowId === emp.eid;
                    const salaryNum = emp.salary ?? 0;
                    const infraNum = emp.infrastructure ?? 0;
                    const totalCost = salaryNum + infraNum;

                    return (
                      <tr key={emp.eid} className={isEditing ? "editing-row" : ""}>
                        <td>{emp.eid}</td>
                        <td>{`${emp.fname} ${emp.lname}`}</td>

                        <td className="text-right">
                          {isEditing ? (
                            <input
                              type="text"
                              name="salary"
                              value={editValues.salary}
                              onChange={handleChange}
                              placeholder="0.00"
                              className="edit-input"
                            />
                          ) : (
                            <span className={salaryNum === 0 ? "muted" : ""}>
                              {salaryNum === 0 ? "-" : `${salaryNum.toFixed(2)}`}
                            </span>
                          )}
                        </td>

                        <td className="text-right">
                          {isEditing ? (
                            <input
                              type="text"
                              name="infrastructure"
                              value={editValues.infrastructure}
                              onChange={handleChange}
                              placeholder="0.00"
                              className="edit-input"
                            />
                          ) : (
                            <span className={infraNum === 0 ? "muted" : ""}>
                              {infraNum === 0 ? "-" : `${infraNum.toFixed(2)}`}
                            </span>
                          )}
                        </td>

                        <td className={`text-right ${totalCost === 0 ? "muted" : "highlight"}`}>
                          {totalCost === 0 ? "-" : `${totalCost.toFixed(2)}`}
                        </td>

                        <td className="text-center">
                          {isEditing ? (
                            <div className="action-buttons">
                              <button onClick={() => saveEdit(emp.eid)} className="save-btn">
                                <FaCheck />
                              </button>
                              <button onClick={cancelEdit} className="cancel-btn">
                                <FaTimes />
                              </button>
                            </div>
                          ) : (
                            financialYear === currentFinancialYear ? (
                              <button onClick={() => startEdit(emp)} className="edit-btn">
                                <FaEdit />
                              </button>
                            ) : (
                              <button className="edit-btn" disabled style={{ opacity: 0.5, cursor: "not-allowed" }}>
                                <FaEdit />
                              </button>
                            )
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {employees.length > 0 && (
            <div className="summary">
              <strong>
                Total Employees: {employees.length} | Total Cost: $
                {employees.reduce((sum, emp) => sum + (emp.cost || 0), 0).toFixed(2)}
              </strong>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default FinancialYearPage;
