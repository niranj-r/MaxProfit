import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaEdit, FaCheck, FaTimes } from "react-icons/fa";

const API = process.env.REACT_APP_API_BASE_URL;

const FinancialYearPage = ({ financialYear, goBack }) => {
  const [employees, setEmployees] = useState([]);
  const [editRowId, setEditRowId] = useState(null);
  const [editValues, setEditValues] = useState({ salary: "", infrastructure: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = localStorage.getItem("token");
  const authHeader = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  useEffect(() => {
    if (!financialYear || financialYear === "null" || financialYear === "undefined") {
      console.warn("Invalid financial year received:", financialYear);
      setError("Financial year not provided or invalid.");
      setLoading(false);
      return;
    }

    console.log("Fetching data for financial year:", financialYear);
    setLoading(true);
    setError(null);

    axios.get(`${API}/api/employee-financials?year=${financialYear}`, authHeader)
      .then((res) => {
        console.log("Employee financial data:", res.data);
        setEmployees(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching employee data:", err);
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

      console.log("Saving data for employee:", eid, payload);

      await axios.post(`${API}/api/employee-financials/${eid}`, payload, authHeader);

      setEmployees((prev) =>
        prev.map((emp) =>
          emp.eid === eid
            ? { 
                ...emp, 
                salary: payload.salary, 
                infrastructure: payload.infrastructure,
                cost: (payload.salary || 0) + (payload.infrastructure || 0)
              }
            : emp
        )
      );

      setEditRowId(null);
      setEditValues({ salary: "", infrastructure: "" });

      console.log("Data saved successfully");
    } catch (err) {
      console.error("Error saving data:", err);
      alert(`Failed to update employee data: ${err.response?.data?.error || err.message}`);
    }
  };

  if (loading) return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <p>Loading employee data...</p>
    </div>
  );
  
  if (error) return (
    <div style={{ padding: "20px" }}>
      <button onClick={goBack} style={{ marginBottom: "10px", padding: "8px 16px" }}>← Back</button>
      <p style={{ color: "red", textAlign: "center" }}>{error}</p>
    </div>
  );

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <button 
        onClick={goBack} 
        style={{ 
          marginBottom: "20px", 
          padding: "8px 16px", 
          backgroundColor: "#007bff", 
          color: "white", 
          border: "none", 
          borderRadius: "4px",
          cursor: "pointer"
        }}
      >
        ← Back to Financial Years
      </button>
      
      <h2 style={{ marginBottom: "20px", color: "#333" }}>
        Financial Year: {financialYear}
      </h2>

      <div style={{ overflowX: "auto" }}>
        <table style={{ 
          width: "100%", 
          borderCollapse: "collapse", 
          marginTop: "20px", 
          border: "1px solid #ddd",
          backgroundColor: "white",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
        }}>
          <thead>
            <tr style={{ backgroundColor: "#f8f9fa" }}>
              <th style={{ border: "1px solid #ddd", padding: "12px", textAlign: "left" }}>Emp ID</th>
              <th style={{ border: "1px solid #ddd", padding: "12px", textAlign: "left" }}>Employee Name</th>
              <th style={{ border: "1px solid #ddd", padding: "12px", textAlign: "right" }}>Salary</th>
              <th style={{ border: "1px solid #ddd", padding: "12px", textAlign: "right" }}>Infrastructure</th>
              <th style={{ border: "1px solid #ddd", padding: "12px", textAlign: "right" }}>Total Cost</th>
              <th style={{ border: "1px solid #ddd", padding: "12px", textAlign: "center" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ 
                  textAlign: "center", 
                  padding: "20px", 
                  color: "#666",
                  fontStyle: "italic"
                }}>
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
                  <tr key={emp.eid} style={{ 
                    borderBottom: "1px solid #ddd",
                    backgroundColor: isEditing ? "#f0f8ff" : "white"
                  }}>
                    <td style={{ padding: "12px", border: "1px solid #ddd", fontWeight: "500" }}>{emp.eid}</td>
                    <td style={{ padding: "12px", border: "1px solid #ddd" }}>{`${emp.fname} ${emp.lname}`}</td>

                    <td style={{ padding: "12px", border: "1px solid #ddd", textAlign: "right" }}>
                      {isEditing ? (
                        <input
                          type="text"
                          name="salary"
                          value={editValues.salary}
                          onChange={handleChange}
                          placeholder="0.00"
                          style={{ width: "100px", textAlign: "right", padding: "4px", border: "1px solid #ccc", borderRadius: "3px" }}
                        />
                      ) : (
                        <span style={{ color: salaryNum === 0 ? "#999" : "#333" }}>
                          {salaryNum === 0 ? "-" : `₹${salaryNum.toFixed(2)}`}
                        </span>
                      )}
                    </td>

                    <td style={{ padding: "12px", border: "1px solid #ddd", textAlign: "right" }}>
                      {isEditing ? (
                        <input
                          type="text"
                          name="infrastructure"
                          value={editValues.infrastructure}
                          onChange={handleChange}
                          placeholder="0.00"
                          style={{ width: "100px", textAlign: "right", padding: "4px", border: "1px solid #ccc", borderRadius: "3px" }}
                        />
                      ) : (
                        <span style={{ color: infraNum === 0 ? "#999" : "#333" }}>
                          {infraNum === 0 ? "-" : `₹${infraNum.toFixed(2)}`}
                        </span>
                      )}
                    </td>

                    <td style={{ padding: "12px", border: "1px solid #ddd", textAlign: "right", fontWeight: "600", color: totalCost === 0 ? "#999" : "#28a745" }}>
                      {totalCost === 0 ? "-" : `₹${totalCost.toFixed(2)}`}
                    </td>

                    <td style={{ padding: "12px", border: "1px solid #ddd", textAlign: "center" }}>
                      {isEditing ? (
                        <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                          <button onClick={() => saveEdit(emp.eid)} title="Save" style={{ padding: "6px 10px", backgroundColor: "#28a745", color: "white", border: "none", borderRadius: "3px", cursor: "pointer" }}>
                            <FaCheck />
                          </button>
                          <button onClick={cancelEdit} title="Cancel" style={{ padding: "6px 10px", backgroundColor: "#dc3545", color: "white", border: "none", borderRadius: "3px", cursor: "pointer" }}>
                            <FaTimes />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => startEdit(emp)} title="Edit" style={{ padding: "6px 10px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "3px", cursor: "pointer" }}>
                          <FaEdit />
                        </button>
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
        <div style={{ marginTop: "20px", padding: "10px", backgroundColor: "#f8f9fa", borderRadius: "4px", textAlign: "right" }}>
          <strong>
            Total Employees: {employees.length} | 
            Total Cost: ₹{employees.reduce((sum, emp) => sum + (emp.cost || 0), 0).toFixed(2)}
          </strong>
        </div>
      )}
    </div>
  );
};

export default FinancialYearPage;
