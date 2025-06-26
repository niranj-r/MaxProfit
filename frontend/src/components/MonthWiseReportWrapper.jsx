import React, { useState } from "react";
import MonthWiseReportOrg from "./MonthWiseReportOrg";
import MonthWiseReportDept from "./MonthWiseReportDept";
import "./EmployeeDirectory.css";

const MonthWiseReportWrapper = () => {
  const [view, setView] = useState("org");

  const renderComponent = () => {
    if (view === "org") return <MonthWiseReportOrg />;
    if (view === "dept") return <MonthWiseReportDept />;
    return <div className="no-grouped-data">No report available.</div>;
  };

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
          </select>
        </div>
      </div>

      {/* Conditionally render based on dropdown */}
      {renderComponent()}
    </div>
  );
};

export default MonthWiseReportWrapper;
