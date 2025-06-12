// src/components/AddDepartment.js
import React, { useState } from 'react';
import axios from 'axios';

const AddDepartment = ({ organisations, onAdded }) => {
  const [dept, setDept] = useState({ did: '', name: '', oid: '' });

  const handleDeptSubmit = async () => {
    try {
      await axios.post('http://127.0.0.1:5000/api/departments', dept);
      alert('Department added!');
      setDept({ did: '', name: '', oid: '' });
      onAdded();
    } catch (err) {
      alert(err.response?.data?.error || 'Error adding department');
    }
  };

  return (
    <div className="form-card">
      <h3>Add Department to Existing Organisation</h3>
      <select
        value={dept.oid}
        onChange={(e) => setDept({ ...dept, oid: e.target.value })}
      >
        <option value="">-- Select Organisation --</option>
        {organisations.map((org) => (
          <option key={org.oid} value={org.oid}>
            {org.name}
          </option>
        ))}
      </select>
      <input
        placeholder="Department ID"
        value={dept.did}
        onChange={(e) => setDept({ ...dept, did: e.target.value })}
      />
      <input
        placeholder="Department Name"
        value={dept.name}
        onChange={(e) => setDept({ ...dept, name: e.target.value })}
      />
      <button onClick={handleDeptSubmit}>Add Department</button>
    </div>
  );
};

export default AddDepartment;
