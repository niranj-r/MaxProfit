import React, { useState, useEffect } from 'react';
import './EmployeeDirectory.css';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import axios from 'axios';
import ModalWrapper from './ModalWrapper';
import './ModalWrapper.css';

const API = process.env.REACT_APP_API_BASE_URL;
const token = localStorage.getItem("token");
const authHeader = {
  headers: {
    Authorization: `Bearer ${token}`,
  },
};


const initialForm = { eid: '', fname: '', lname: '', email: '', did: '', password: '' };

const EmployeeDirectory = () => {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formMode, setFormMode] = useState('add'); // "add" or "edit"
  const [form, setForm] = useState(initialForm);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    const load = async () => {
      await fetchEmployees();
    };
    load();
  }, []);


  const fetchEmployees = async () => {
    try {
      console.log("Token:", token);
      const res = await axios.get(`${API}/api/employees`, authHeader);
      setEmployees(res.data);
    } catch (e) {
      console.error('Failed to fetch employees', e.response?.data || e);
    }
  };


  const openAdd = () => {
    setForm(initialForm);
    setFormMode('add');
    setSelectedId(null);
    setShowModal(true);
  };

  const openEdit = emp => {
    setForm({ eid: emp.eid, fname: emp.fname, lname: emp.lname, email: emp.email, did: emp.did, password: '' });
    setFormMode('edit');
    setSelectedId(emp.eid);
    setShowModal(true);
  };

  const close = () => setShowModal(false);

  const handleChange = e => { setForm(prev => ({ ...prev, [e.target.name]: e.target.value })); };

  const handleSubmit = async e => {
  e.preventDefault();

  const { eid, fname, lname, email, did, password } = form;

  // Required fields check
  if (!eid || !fname || !lname || !email || !did || (formMode === 'add' && !password)) {
    return alert('All fields are required. Password is required for new employees.');
  }

  // Trim check
  if (
    !eid.trim() || !fname.trim() || !lname.trim() || !email.trim() || !did.trim() ||
    (formMode === 'add' && !password.trim())
  ) {
    return alert('Fields cannot be empty or just whitespace.');
  }

  // ✅ EmpID: Must match E001, E123 etc.
  const empIdPattern = /^E\d{3}$/;
  if (!empIdPattern.test(eid)) {
    return alert('Employee ID must be in the format E001, E123, etc.');
  }

  // ✅ First Name: 3 to 30 characters
  if (fname.length < 3 || fname.length > 30) {
    return alert('First name must be between 3 and 30 characters.');
  }

  // ✅ Last Name: 1 to 30 characters
  if (lname.length < 1 || lname.length > 30) {
    return alert('Last name must be between 1 and 30 characters.');
  }

  // ✅ Email format check
  if (!email.includes('@') || !email.includes('.')) {
    return alert('Email must be a valid format (contain "@" and ".").');
  }

  // ✅ Password length (only for add mode)
  if (formMode === 'add' && password.length < 6) {
    return alert('Password must be at least 6 characters long.');
  }

  try {
    if (formMode === 'add') {
      await axios.post(`${API}/api/employees`, form, authHeader);
      alert('Employee added successfully');
    } else {
      await axios.put(`${API}/api/employees/${selectedId}`, form, authHeader);
      alert('Employee updated successfully');
    }

    close(); // Close modal
    fetchEmployees(); // Refresh list
  } catch (err) {
    console.error('Submit error', err.response?.data || err);
    alert(err.response?.data?.error || 'Error submitting employee');
  }
};


  const handleDelete = async (id) => {
    if (!window.confirm('Delete employee?')) return;
    try {
      await axios.delete(`${API}/api/users/${id}`, authHeader);
      alert('Employee deleted successfully');
      fetchEmployees();
    } catch (e) {
      console.error('Delete error', e.response?.data || e);
      alert('Error deleting employee');
    }
  };

  const convertToIST = (isoString) => {
    if (!isoString) return '-';
    const utcDate = new Date(isoString);

    const istOffset = 5.5 * 60;
    const istTime = new Date(utcDate.getTime() + istOffset * 60 * 1000);

    return istTime.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour12: true,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const filtered = employees.filter(emp =>
    `${emp.fname} ${emp.lname}`.toLowerCase().includes(search.toLowerCase())
  );


  return (
    <div className="employee-table-container">
      <div className="table-header">
        <h2>Employee Directory</h2>
        <div className="controls">
          <input
            type="text"
            className="search-bar"
            placeholder="Search employee..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="add-btn" onClick={openAdd}><FaPlus /> Add Employee</button>        </div>
      </div>
      <table className="employee-table">
        <thead>
          <tr>
            <th>Employee ID</th><th>Name</th><th>Email</th><th>Department</th><th>Created At (IST)</th><th>Updated At (IST)</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(emp => (
            <tr key={emp._id || emp.eid}>
              <td>{emp.eid}</td>
              <td>{emp.fname} {emp.lname}</td>
              <td>{emp.email}</td>
              <td>{emp.did}</td>
              <td>{convertToIST(emp.createdAt)}</td>
              <td>{convertToIST(emp.updatedAt)}</td>
              <td>
                <FaEdit onClick={() => openEdit(emp)} className="icon edit-icon" />
                <FaTrash onClick={() => handleDelete(emp.id || emp._id)} className="icon delete-icon" />
              </td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr><td colSpan="5">No employees found.</td></tr>
          )}
        </tbody>

      </table>

      {showModal && (
        <ModalWrapper
          onClose={close}
          title={formMode === 'add' ? 'Add Employee' : 'Edit Employee'}
        >
          <form className="modal-form" onSubmit={handleSubmit}>
            <input
              name="eid"
              placeholder="Employee ID"
              value={form.eid}
              onChange={handleChange}
              disabled={formMode === 'edit'}
            />
            <input
              name="fname"
              placeholder="First Name"
              value={form.fname}
              onChange={handleChange}
            />
            <input
              name="lname"
              placeholder="Last Name"
              value={form.lname}
              onChange={handleChange}
            />
            <input
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
            />
            <input
              name="did"
              placeholder="Department ID"
              value={form.did}
              onChange={handleChange}
            />
            {formMode === 'add' && (
              <input
                name="password"
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
              />
            )}
            <button type="submit">{formMode === 'add' ? 'Add' : 'Update'}</button>
          </form>
        </ModalWrapper>
      )}
    </div>
  );
};

export default EmployeeDirectory;
