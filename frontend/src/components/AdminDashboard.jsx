import React from 'react';
import './styles/AdminDashboard.css';

const AdminDashboard = ({ navigate }) => {
return (
    <div className="admin-dashboard">
        <h1>Admin Dashboard</h1>
        <button onClick={() => navigate('/manage-users')}>Manage Users</button>
        <button onClick={() => navigate('/manage-org-dept')}>Manage Orgs & Departments</button>
        <h2>Top 10 Employees (By Working Hours)</h2>
      <ul>
        {/* Sample static list */}
        {[
          { name: "Alice Johnson", hours: 160 },
          { name: "Bob Smith", hours: 152 }
        ].map((emp, idx) => (
          <li key={idx}>
            {emp.name} — {emp.hours} hrs
          </li>
        ))}
      </ul>
    </div>
    

);
};

export default AdminDashboard;
