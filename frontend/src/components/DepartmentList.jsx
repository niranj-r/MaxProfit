// src/components/DepartmentList.js
import React from 'react';
import axios from 'axios';

const DepartmentList = ({ departments, onDeleted }) => {
  const deleteDept = async (did) => {
    if (window.confirm('Delete this department?')) {
      try {
        await axios.delete(`http://127.0.0.1:5000/api/departments/${did}`);
        alert('Department deleted!');
        onDeleted();
      } catch (err) {
        alert(err.response?.data?.error || 'Error deleting department');
      }
    }
  };

  return (
    <div className="list-section">
      <h3>Existing Departments</h3>
      {departments.map((dept) => (
        <div key={dept.did} className="list-item">
          {dept.name} (DID: {dept.did}) — Org ID: {dept.oid}
          <button onClick={() => deleteDept(dept.did)}>Delete</button>
        </div>
      ))}
    </div>
  );
};

export default DepartmentList;
