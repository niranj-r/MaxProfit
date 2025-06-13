import React, { useState } from "react";
import axios from "axios";


const AddOrganisation = ({ onClose, onSuccess }) => {
  const [org, setOrg] = useState({ name: "", oid: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://127.0.0.1:5000/api/organisations", org);
      onSuccess(res.data); // notify parent
      onClose();           // close modal
    } catch (err) {
      console.error("Error adding organisation", err);
      alert("Failed to add organisation.");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Add Organisation</h3>
      <input placeholder="Name" onChange={e => setOrg({ ...org, name: e.target.value })} />
      <input placeholder="Org ID" onChange={e => setOrg({ ...org, oid: e.target.value })} />
      <button type="submit">Add</button>
    </form>
  );
};

export default AddOrganisation;
