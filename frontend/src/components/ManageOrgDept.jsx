// src/components/ManageOrgDept.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AddOrganisation from './AddOrganisation';
import OrganisationList from './OrganisationList';
import AddDepartment from './AddDepartment';
import DepartmentList from './DepartmentList';
import './styles/ManageOrgDept.css';

const ManageOrgDept = () => {
  const navigate = useNavigate();

  const [organisations, setOrganisations] = useState([]);
  const [departments, setDepartments] = useState([]);

  const fetchData = async () => {
    const orgRes = await axios.get('http://127.0.0.1:5000/api/organisations');
    const deptRes = await axios.get('http://127.0.0.1:5000/api/departments');
    setOrganisations(orgRes.data);
    setDepartments(deptRes.data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="org-dept-container">
      <h2>Manage Organisations & Departments</h2>

      <AddOrganisation onAdded={fetchData} />
      <AddDepartment organisations={organisations} onAdded={fetchData} />

      <OrganisationList organisations={organisations} onDeleted={fetchData} />
      <DepartmentList departments={departments} onDeleted={fetchData} />

      <button className="back-btn" onClick={() => navigate('/admin-dashboard')}>
        Back to Dashboard
      </button>
    </div>
  );
};

export default ManageOrgDept;
