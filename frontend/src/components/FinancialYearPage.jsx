import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaEdit, FaCheck, FaTimes } from "react-icons/fa";

const FinancialYearPage = ({ financialYear }) => {
  const [employees, setEmployees] = useState([]);
  const [editRowId, setEditRowId] = useState(null);
  const [editValues, setEditValues] = useState({ salary: "", infrastructure: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ Get token from localStorage
  const token = localStorage.getItem("token");
  const authHeader = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  useEffect(() => {
    if (!financialYear) {
      setError("Financial year not provided.");
      return;
    }
    setLoading(true);
    axios.get(`http://localhost:5000/api/employee-financials?year=${financialYear}`, authHeader)

      .then((res) => {
        setEmployees(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to fetch employee data.");
        setLoading(false);
      });
  }, [financialYear]);

  const startEdit = (emp) => {
    setEditRowId(emp.empid);
    setEditValues({
      salary: emp.salary !== null && emp.salary !== undefined ? emp.salary : "",
      infrastructure:
        emp.infrastructure !== null && emp.infrastructure !== undefined ? emp.infrastructure : "",
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

  const saveEdit = async (empid) => {
    try {
      const payload = {
        salary: editValues.salary === "" ? null : parseFloat(editValues.salary),
        infrastructure: editValues.infrastructure === "" ? null : parseFloat(editValues.infrastructure),
        financial_year: financialYear,
      };

      await axios.patch(`/api/financialyear/employees/${empid}`, payload, authHeader);

      setEmployees((prev) =>
        prev.map((emp) =>
          emp.empid === empid
            ? { ...emp, salary: payload.salary, infrastructure: payload.infrastructure }
            : emp
        )
      );

      setEditRowId(null);
      setEditValues({ salary: "", infrastructure: "" });
    } catch (err) {
      console.error(err);
      alert("Failed to update employee data.");
    }
  };

  if (loading) return <p>Loading employee data...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>Financial Year: {financialYear}</h2>

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px", border: "1px solid #ddd" }}>
        <thead>
          <tr style={{ backgroundColor: "#f2f2f2" }}>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Emp ID</th>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Emp Name</th>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Salary</th>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Infrastructure</th>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Cost</th>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {employees.length === 0 && (
            <tr>
              <td colSpan="6" style={{ textAlign: "center", padding: "10px" }}>
                No employees found for this financial year.
              </td>
            </tr>
          )}
          {employees.map((emp) => {
            const isEditing = editRowId === emp.empid;
            const salaryNum = emp.salary !== null ? emp.salary : 0;
            const infraNum = emp.infrastructure !== null ? emp.infrastructure : 0;
            const cost = salaryNum + infraNum;

            return (
              <tr key={emp.empid} style={{ borderBottom: "1px solid #ddd" }}>
                <td style={{ padding: "8px", border: "1px solid #ddd" }}>{emp.empid}</td>
                <td style={{ padding: "8px", border: "1px solid #ddd" }}>{emp.empname}</td>

                <td style={{ padding: "8px", border: "1px solid #ddd", textAlign: "right" }}>
                  {isEditing ? (
                    <input
                      type="text"
                      name="salary"
                      value={editValues.salary}
                      onChange={handleChange}
                      placeholder="-"
                      style={{ width: "80px", textAlign: "right" }}
                    />
                  ) : salaryNum === 0 ? "-" : salaryNum.toFixed(2)}
                </td>

                <td style={{ padding: "8px", border: "1px solid #ddd", textAlign: "right" }}>
                  {isEditing ? (
                    <input
                      type="text"
                      name="infrastructure"
                      value={editValues.infrastructure}
                      onChange={handleChange}
                      placeholder="-"
                      style={{ width: "80px", textAlign: "right" }}
                    />
                  ) : infraNum === 0 ? "-" : infraNum.toFixed(2)}
                </td>

                <td style={{ padding: "8px", border: "1px solid #ddd", textAlign: "right" }}>
                  {cost === 0 ? "-" : cost.toFixed(2)}
                </td>

                <td style={{ padding: "8px", border: "1px solid #ddd", textAlign: "center" }}>
                  {isEditing ? (
                    <>
                      <button onClick={() => saveEdit(emp.empid)} title="Save" style={{ marginRight: "8px" }}>
                        <FaCheck color="green" />
                      </button>
                      <button onClick={cancelEdit} title="Cancel">
                        <FaTimes color="red" />
                      </button>
                    </>
                  ) : (
                    <button onClick={() => startEdit(emp)} title="Edit">
                      <FaEdit />
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default FinancialYearPage;
