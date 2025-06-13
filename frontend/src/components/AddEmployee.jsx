import React, { useState } from "react";
import axios from "axios";
import "./AddEmployee.css";

const AddEmployee = ({ onClose }) => {
  const [emp, setEmp] = useState({
    eid: "",
    fname: "",
    lname: "",
    email: "",
    did: "",
    password: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post("http://127.0.0.1:5000/api/employees", emp)
      .then(() => {
        alert("Employee added!");
        onClose();
      })
      .catch(err => {
        console.error("Failed to add employee:", err);
        alert("Failed to add employee.");
      });
  };

  return (
    <form onSubmit={handleSubmit} className="add-employee-form">
      <h3>Add Employee</h3>
      <input placeholder="Employee ID" onChange={e => setEmp({ ...emp, eid: e.target.value })} />
      <input placeholder="First Name" onChange={e => setEmp({ ...emp, fname: e.target.value })} />
      <input placeholder="Last Name" onChange={e => setEmp({ ...emp, lname: e.target.value })} />
      <input placeholder="Email" onChange={e => setEmp({ ...emp, email: e.target.value })} />
      <input placeholder="Department ID" onChange={e => setEmp({ ...emp, did: e.target.value })} />
      <input placeholder="Password" type="password" onChange={e => setEmp({ ...emp, password: e.target.value })} />
      <div className="form-actions">
        <button type="submit">Add</button>
        <button type="button" onClick={onClose}>Cancel</button>
      </div>
    </form>
  );
};

export default AddEmployee;
