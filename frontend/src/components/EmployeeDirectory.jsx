import React, { useState, useEffect } from 'react';
import './EmployeeDirectory.css';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import axios from 'axios';
import ModalWrapper from './ModalWrapper';
import AddEmployee from './AddEmployee';

const EmployeeDirectory = () => {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/employees');
      setEmployees(res.data);
    } catch (err) {
      console.error('Failed to fetch employees', err);
    }
  };

  const handleEdit = async (eid) => {
    // Add edit modal logic if needed
  };

  const handleDelete = async (eid) => {
    try {
      await axios.delete(`http://localhost:5000/api/employees/${eid}`);
      fetchEmployees();
    } catch (err) {
      console.error('Failed to delete employee', err);
    }
  };

  const filteredEmployees = employees.filter(emp =>
    `${emp.fname} ${emp.lname}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="employee-table-container">
      <div className="table-header">
        <h2>Employee Details</h2>
        <div className="controls">
          <input
            type="text"
            className="search-bar"
            placeholder="Search employee..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="add-btn" onClick={() => setShowAddModal(true)}>
            <FaPlus /> Add Employee
          </button>
        </div>
      </div>

      <table className="employee-table">
        <thead>
          <tr>
            <th>Employee ID</th>
            <th>First Name</th>
            <th>Last Name</th>
            <th>Email</th>
            <th>Department ID</th>
            <th>Join Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredEmployees.map((emp) => (
            <tr key={emp._id}>
              <td>{emp.eid}</td>
              <td>{emp.fname}</td>
              <td>{emp.lname}</td>
              <td>{emp.email}</td>
              <td>{emp.did}</td>
              <td>{emp.joinDate || '—'}</td>
              <td>{emp.status || '—'}</td>
              <td>
                <FaEdit className="icon edit-icon" onClick={() => handleEdit(emp.eid)} />
                <FaTrash className="icon delete-icon" onClick={() => handleDelete(emp.eid)} />
              </td>
            </tr>
          ))}
          {filteredEmployees.length === 0 && (
            <tr>
              <td colSpan="8" className="no-data">No matching employees found.</td>
            </tr>
          )}
        </tbody>
      </table>

      {showAddModal && (
        <ModalWrapper onClose={() => setShowAddModal(false)}>
          <AddEmployee
            onClose={() => {
              setShowAddModal(false);
              fetchEmployees(); // refresh list
            }}
          />
        </ModalWrapper>
      )}
    </div>
  );
};

export default EmployeeDirectory;
