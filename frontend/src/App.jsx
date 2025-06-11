import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import ManageUsers from './components/ManageUsers';
import ManageOrgDept from './components/ManageOrgDept';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/admin-dashboard" element={<AdminDashboard />} />
      <Route path="/manage-users" element={<ManageUsers />} />
      <Route path="/manage-org-dept" element={<ManageOrgDept />} />
    </Routes>
  );
}

export default App;
