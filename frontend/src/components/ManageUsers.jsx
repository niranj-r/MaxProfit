import React from 'react';
import { useNavigate } from 'react-router-dom';
import CreateUserForm from './CreateUserForm';
import DeleteUserForm from './DeleteUserForm';
import EmployeeDirectory from './EmployeeDirectory';
import './styles/ManageUsers.css';

const ManageUsers = () => {
  const navigate = useNavigate();

  return (
    <div className="UserManagementContainer">
      <h2>Manage Users</h2>

      <CreateUserForm />
      <DeleteUserForm />

      <div className="card">
        <h3>Employee Directory</h3>
        <EmployeeDirectory />
      </div>

      <button className="back-btn" onClick={() => navigate('/admin-dashboard')}>
        Back to Dashboard
      </button>
    </div>
  );
};

export default ManageUsers;
