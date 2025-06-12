// src/components/ManageOrgDept.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './styles/ManageOrgDept.css';

const ManageOrgDept = () => {
  const navigate = useNavigate();

  const [org, setOrg] = useState({ oid: '', name: '' });
  const [dept, setDept] = useState({ did: '', name: '', oid: '' });
  const [organisations, setOrganisations] = useState([]);
  const [departments, setDepartments] = useState([]);

  // Fetch organisations and departments on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const orgRes = await axios.get('http://127.0.0.1:5000/api/organisations');
    const deptRes = await axios.get('http://127.0.0.1:5000/api/departments'); // You need this GET route
    setOrganisations(orgRes.data);
    setDepartments(deptRes.data);
  };

  const handleOrgSubmit = async () => {
    try {
      await axios.post('http://127.0.0.1:5000/api/organisations', org);
      alert('Organisation added!');
      setOrg({ oid: '', name: '' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error adding organisation');
    }
  };

  const handleDeptSubmit = async () => {
    try {
      await axios.post('http://127.0.0.1:5000/api/departments', dept);
      alert('Department added!');
      setDept({ did: '', name: '', oid: '' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error adding department');
    }
  };

  const deleteOrg = async (oid) => {
    if (window.confirm('Delete this organisation and all its departments?')) {
      try {
        await axios.delete(`http://127.0.0.1:5000/api/organisations/${oid}`);
        alert('Organisation deleted!');
        fetchData();
      } catch (err) {
        alert(err.response?.data?.error || 'Error deleting organisation');
      }
    }
  };

  const deleteDept = async (did) => {
    if (window.confirm('Delete this department?')) {
      try {
        await axios.delete(`http://127.0.0.1:5000/api/departments/${did}`);
        alert('Department deleted!');
        fetchData();
      } catch (err) {
        alert(err.response?.data?.error || 'Error deleting department');
      }
    }
  };

  return (
    <div className="org-dept-container">
      <h2>Manage Organisations & Departments</h2>

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

      <div className="form-card">
        <h3>Add Department to Existing Organisation</h3>
        <select
          value={dept.oid}
          onChange={e => setDept({ ...dept, oid: e.target.value })}
        >
          <option value="">-- Select Organisation --</option>
          {organisations.map(org => (
            <option key={org.oid} value={org.oid}>{org.name}</option>
          ))}
        </select>
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

      <div className="list-section">
        <h3>Existing Organisations</h3>
        {organisations.map(org => (
          <div key={org.oid} className="list-item">
            <strong>{org.name} (OID: {org.oid})</strong>
            <button onClick={() => deleteOrg(org.oid)}>Delete</button>
          </div>
        ))}
      </div>

      <div className="list-section">
        <h3>Existing Departments</h3>
        {departments.map(dept => (
          <div key={dept.did} className="list-item">
            {dept.name} (DID: {dept.did}) — Org ID: {dept.oid}
            <button onClick={() => deleteDept(dept.did)}>Delete</button>
          </div>
        ))}
      </div>

      <button className="back-btn" onClick={() => navigate('/admin-dashboard')}>
        Back to Dashboard
      </button>
    </div>
  );
};

export default ManageOrgDept;
