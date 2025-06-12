// src/components/ManageOrgDept.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './styles/ManageOrgDept.css';

const ManageOrgDept = () => {
  const navigate = useNavigate(); // for back navigation

  const [org, setOrg] = useState({ oid: '', name: '' });
  const [orgAdded, setOrgAdded] = useState(false);
  const [dept, setDept] = useState({ did: '', name: '', oid: '' });

  const handleOrgSubmit = async () => {
    try {
      await axios.post('http://localhost:5000/api/organisations', org);
      alert('Organisation added!');
      setOrgAdded(true);
      setDept({ ...dept, oid: org.oid });
    } catch (err) {
      alert(err.response?.data?.error || 'Error adding organisation');
    }
  };

  const handleDeptSubmit = async () => {
    try {
      await axios.post('http://localhost:5000/api/departments', dept);
      alert('Department added!');
      setDept({ ...dept, did: '', name: '' });
    } catch (err) {
      alert(err.response?.data?.error || 'Error adding department');
    }
  };

  return (
    <div className="org-dept-container">
      <h2>Manage Organisation & Departments</h2>

      <div className="form-card">
        <h3>Add Organisation</h3>
        <input
          placeholder="Organisation ID"
          value={org.oid}
          onChange={e => setOrg({ ...org, oid: e.target.value })}
        />
        <input
          placeholder="Organisation Name"
          value={org.name}
          onChange={e => setOrg({ ...org, name: e.target.value })}
        />
        <button onClick={handleOrgSubmit}>Add Organisation</button>
      </div>

      {orgAdded && (
        <div className="form-card">
          <h3>Add Department under "{org.name}"</h3>
          <input
            placeholder="Department ID"
            value={dept.did}
            onChange={e => setDept({ ...dept, did: e.target.value })}
          />
          <input
            placeholder="Department Name"
            value={dept.name}
            onChange={e => setDept({ ...dept, name: e.target.value })}
          />
          <button onClick={handleDeptSubmit}>Add Department</button>
        </div>
      )}

      <button className="back-btn" onClick={() => navigate('/admin-dashboard')}>
        Back to Dashboard
      </button>
    </div>
  );
};

export default ManageOrgDept;
