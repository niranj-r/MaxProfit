import React, { useEffect, useState } from "react";
import axios from "axios";
import FANavbar from "./FANavbar";
import Papa from "papaparse";
import "../FinancialyearPage.css";

const API = process.env.REACT_APP_API_BASE_URL;

const FAFinancialYearPage = ({ financialYear, goBack }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = localStorage.getItem("token");
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

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

  const downloadCSV = () => {
    if (employees.length === 0) {
      alert("No data to export.");
      return;
    }

    const dataForCSV = employees.map(emp => ({
      "Emp ID": emp.eid,
      "Employee Name": `${emp.fname} ${emp.lname}`,
      "Salary": emp.salary ?? 0,
      "Infrastructure": emp.infrastructure ?? 0,
      "Total Cost": (emp.salary ?? 0) + (emp.infrastructure ?? 0)
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
  if (error) return (
    <div className="error-container">
      <FANavbar />
      <button onClick={goBack} className="back-button">← Back</button>
      <p className="error-text">{error}</p>
    </div>
  );

  return (
    <div className="financial-year-page">
      <header className="dashboard-header">
        <FANavbar />
      </header>
      <div className="financial-page-wrapper">
        <main className="financial-content">
          <button onClick={goBack} className="back-button">← Back to Financial Years</button>
          <h2 className="fy-heading">Financial Year: {financialYear}</h2>

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
                    const salaryNum = emp.salary ?? 0;
                    const infraNum = emp.infrastructure ?? 0;
                    const totalCost = salaryNum + infraNum;

                    return (
                      <tr key={emp.eid}>
                        <td>{emp.eid}</td>
                        <td>{`${emp.fname} ${emp.lname}`}</td>
                        <td className="text-right">
                          {salaryNum === 0 ? "-" : salaryNum.toFixed(2)}
                        </td>
                        <td className="text-right">
                          {infraNum === 0 ? "-" : infraNum.toFixed(2)}
                        </td>
                        <td className={`text-right ${totalCost === 0 ? "muted" : "highlight"}`}>
                          {totalCost === 0 ? "-" : totalCost.toFixed(2)}
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
                Total Employees: {employees.length} | Total Cost: ₹
                {employees.reduce((sum, emp) => sum + (emp.cost || 0), 0).toFixed(2)}
              </strong>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};  

export default FAFinancialYearPage;
