import React, { useState } from "react";
import axios from "axios";

const AddDepartment = () => {
  const [dept, setDept] = useState({
    name: "",
    did: "",
    oid: "",
    managerId: ""
  });

  const handleChange = (e) => {
    setDept({ ...dept, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { name, did, oid, managerId } = dept;
    if (!name || !did || !oid || !managerId) {
      alert("All fields are required.");
      return;
    }

    try {
      await axios.post("http://127.0.0.1:5000/api/departments", dept);
      alert("Department added!");
      setDept({ name: "", did: "", oid: "", managerId: "" });
    } catch (err) {
      console.error("Error adding department", err);
      alert("Failed to add department.");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Add Department</h3>
      <input
        name="name"
        placeholder="Name"
        value={dept.name}
        onChange={handleChange}
      />
      <input
        name="did"
        placeholder="Department ID"
        value={dept.did}
        onChange={handleChange}
      />
      <input
        name="oid"
        placeholder="Organisation ID"
        value={dept.oid}
        onChange={handleChange}
      />
      <input
        name="managerId"
        placeholder="Manager ID"
        value={dept.managerId}
        onChange={handleChange}
      />
      <button type="submit">Add</button>
    </form>
  );
};

export default AddDepartment;
