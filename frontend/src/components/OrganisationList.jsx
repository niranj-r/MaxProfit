// src/components/OrganisationList.js
import React from 'react';
import axios from 'axios';

const OrganisationList = ({ organisations, onDeleted }) => {
  const deleteOrg = async (oid) => {
    if (window.confirm('Delete this organisation and all its departments?')) {
      try {
        await axios.delete(`http://127.0.0.1:5000/api/organisations/${oid}`);
        alert('Organisation deleted!');
        onDeleted();
      } catch (err) {
        alert(err.response?.data?.error || 'Error deleting organisation');
      }
    }
  };

  return (
    <div className="list-section">
      <h3>Existing Organisations</h3>
      {organisations.map((org) => (
        <div key={org.oid} className="list-item">
          <strong>{org.name} (OID: {org.oid})</strong>
          <button onClick={() => deleteOrg(org.oid)}>Delete</button>
        </div>
      ))}
    </div>
  );
};

export default OrganisationList;
