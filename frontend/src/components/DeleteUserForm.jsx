import React, { useState } from 'react';
import axios from 'axios';

const DeleteUserForm = () => {
  const [deleteEmail, setDeleteEmail] = useState('');

  const handleDelete = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:5000/api/users");
      const user = res.data.find(u => u.email === deleteEmail);
      if (user) {
        await axios.delete(`http://127.0.0.1:5000/api/users/${user._id}`);
        alert("User deleted.");
        setDeleteEmail('');
      } else {
        alert("User not found.");
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete user');
    }
  };

  return (
    <div className="card">
      <h3>Delete User (by Email)</h3>
      <input
        placeholder="Email"
        value={deleteEmail}
        onChange={e => setDeleteEmail(e.target.value)}
      />
      <button onClick={handleDelete}>Delete</button>
    </div>
  );
};

export default DeleteUserForm;
