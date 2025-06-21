import React, { useState, useEffect } from 'react';
import '../EmployeeDirectory.css';
import { FaSearch } from 'react-icons/fa';
import axios from 'axios';

const API = process.env.REACT_APP_API_BASE_URL;
const token = localStorage.getItem("token");
const authHeader = {
  headers: {
    Authorization: `Bearer ${token}`,
  },
};

const FADepartmentDirectory = () => {
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchDepartments();
    fetchEmployees();
  }, []);

  const fetchDepartments = async () => {
    try {
      const res = await axios.get(`${API}/api/departments`, authHeader);
      setDepartments(res.data);
    } catch (err) {
      console.error("Failed to fetch departments", err);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${API}/api/employees/dept`, authHeader);
      setEmployees(res.data);
    } catch (err) {
      console.error('Failed to fetch employees', err);
    }
  };

  const filteredDepartments = departments.filter(d => d.name?.toLowerCase().includes(search.toLowerCase()));

  const getManagerNames = (dept) => {
    if (dept.managerIds?.length > 0) {
      return dept.managerIds.map(id => {
        const manager = employees.find(emp => emp.eid === id);
        return manager ? `${id} (${manager.fname} ${manager.lname})` : id;
      }).join(', ');
    }
    return 'No managers assigned';
  };

  return (
    <div className="employee-table-container">
      <div className="table-header">
        <h2>Department Details</h2>
        <div className="controls">
          <input
            type="text"
            className="search-bar"
            placeholder="Search department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      <table className="employee-table">
        <thead>
          <tr>
            <th>Department ID</th>
            <th>Name</th>
            <th>Organisation ID</th>
            <th>Managers</th>
          </tr>
        </thead>
        <tbody>
          {filteredDepartments.length > 0 ? (
            filteredDepartments.map((dept) => (
              <tr key={dept.did}>
                <td>{dept.did}</td>
                <td>{dept.name}</td>
                <td>{dept.oid}</td>
                <td>{getManagerNames(dept)}</td>
              </tr>
            ))
          ) : (
            <tr><td colSpan="4" className="no-data">No matching departments found.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default FADepartmentDirectory;
