import React, { useState, useEffect } from 'react';
import './EmployeeDirectory.css'; // Ensure you have this CSS file for styling
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import axios from 'axios';

const EmployeeDirectory = () => {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');

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

  const handleEdit = (id) => {
    const emp = employees.find(e => e._id === id);
    const updated = {
      ...emp,
      name: prompt('Edit name', emp.name) || emp.name,
      email: prompt('Edit email', emp.email) || emp.email,
      phone: prompt('Edit phone', emp.phone) || emp.phone,
      joinDate: prompt('Edit join date', emp.joinDate) || emp.joinDate
    };
    setEmployees(prev => prev.map(e => (e._id === id ? updated : e)));
    // Optionally send PUT to backend here
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this employee?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/employees/${id}`);
      setEmployees(prev => prev.filter(e => e._id !== id));
    } catch (err) {
      console.error('Failed to delete employee', err);
    }
  };

  const handleAdd = async () => {
    const name = prompt('Enter name');
    const email = prompt('Enter email');
    const phone = prompt('Enter phone number');
    const joinDate = prompt('Enter join date (YYYY-MM-DD)');
    if (!name || !email || !phone || !joinDate) return;

    try {
      const res = await axios.post('http://localhost:5000/api/employees', {
        name, email, phone, joinDate
      });
      setEmployees(prev => [...prev, res.data]);
    } catch (err) {
      console.error('Failed to add employee', err);
    }
  };

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(search.toLowerCase())
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
          <button className="add-btn" onClick={handleAdd}>
            <FaPlus /> Add Employee
          </button>
        </div>
      </div>

      <table className="employee-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone Number</th>
            <th>Join Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredEmployees.map((emp) => (
            <tr key={emp._id}>
              <td>{emp.name}</td>
              <td>{emp.email}</td>
              <td>{emp.phone}</td>
              <td>{emp.joinDate}</td>
              <td>
                <FaEdit className="icon edit-icon" onClick={() => handleEdit(emp._id)} />
                <FaTrash className="icon delete-icon" onClick={() => handleDelete(emp._id)} />
              </td>
            </tr>
          ))}
          {filteredEmployees.length === 0 && (
            <tr>
              <td colSpan="5" className="no-data">No matching employees found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default EmployeeDirectory;
