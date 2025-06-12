// src/components/AddOrganisation.js
import React, { useState } from 'react';
import axios from 'axios';

const AddOrganisation = ({ onAdded }) => {
  const [org, setOrg] = useState({ oid: '', name: '' });

  const handleOrgSubmit = async () => {
    try {
      await axios.post('http://127.0.0.1:5000/api/organisations', org);
      alert('Organisation added!');
      setOrg({ oid: '', name: '' });
      onAdded();
    } catch (err) {
      alert(err.response?.data?.error || 'Error adding organisation');
    }
  };

  return (
    <div className="form-card">
      <h3>Add Organisation</h3>
      <input
        placeholder="Organisation ID"
        value={org.oid}
        onChange={(e) => setOrg({ ...org, oid: e.target.value })}
      />
      <input
        placeholder="Organisation Name"
        value={org.name}
        onChange={(e) => setOrg({ ...org, name: e.target.value })}
      />
      <button onClick={handleOrgSubmit}>Add Organisation</button>
    </div>
  );
};

export default AddOrganisation;
