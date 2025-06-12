import React, { useState } from 'react';
import axios from 'axios';

const CreateUserForm = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee'
  });

  const roles = ['admin', 'department_manager', 'project_manager', 'financial_analyst', 'employee'];

  const handleAdd = async () => {
    try {
      await axios.post("http://127.0.0.1:5000/api/users", form);
      alert("User added.");
      setForm({ name: '', email: '', password: '', role: 'employee' });
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add user');
    }
  };

  return (
    <div className="card">
      <h3>Create User</h3>
      <input
        placeholder="Name"
        value={form.name}
        onChange={e => setForm({ ...form, name: e.target.value })}
      />
      <input
        placeholder="Email"
        value={form.email}
        onChange={e => setForm({ ...form, email: e.target.value })}
      />
      <input
        placeholder="Password"
        value={form.password}
        onChange={e => setForm({ ...form, password: e.target.value })}
      />
      <select
        value={form.role}
        onChange={e => setForm({ ...form, role: e.target.value })}
      >
        {roles.map(role => <option key={role} value={role}>{role}</option>)}
      </select>
      <button onClick={handleAdd}>Add User</button>
    </div>
  );
};

export default CreateUserForm;
