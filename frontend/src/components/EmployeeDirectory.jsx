import React, { useState, useEffect } from 'react';
import './EmployeeDirectory.css';
import { FaEdit, FaTrash, FaPlus, FaDownload } from 'react-icons/fa';
import axios from 'axios';
import ModalWrapper from './ModalWrapper';

const API = process.env.REACT_APP_API_BASE_URL;
const token = localStorage.getItem("token");
const authHeader = { headers: { Authorization: `Bearer ${token}` } };

const initialForm = { eid: '', fname: '', lname: '', email: '', did: '', password: '', manager: '' };

const EmployeeDirectory = () => {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [form, setForm] = useState(initialForm);
  const [selectedId, setSelectedId] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [existingDepartments, setExistingDepartments] = useState([]);

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await axios.get(`${API}/api/departments`, authHeader);
        // Store original department names exactly as received
        const deptNames = res.data.map(dept => dept.name.trim());
        setExistingDepartments(deptNames);
      } catch (err) {
        console.error("Failed to fetch departments", err);
      }
    };
    fetchDepartments();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${API}/api/employees`, authHeader);
      setEmployees(res.data);
    } catch (e) {
      console.error('Failed to fetch employees', e);
      alert('Failed to fetch employees.');
    }
  };

  const openAdd = () => {
    setForm(initialForm);
    setFormMode('add');
    setSelectedId(null);
    setFormErrors({});
    setGeneralError('');
    setShowModal(true);
  };

  const openEdit = emp => {
    setForm({ 
      eid: emp.eid, 
      fname: emp.fname, 
      lname: emp.lname, 
      email: emp.email, 
      did: emp.did, 
      manager: emp.manager || '', 
      password: '' 
    });
    setFormMode('edit');
    setSelectedId(emp.eid);
    setFormErrors({});
    setGeneralError('');
    setShowModal(true);
  };

  const close = () => {
    setShowModal(false);
    setFormErrors({});
    setGeneralError('');
  };

  const validateField = (name, value) => {
    let errorMsg = '';
    const trimmedValue = value.trim();
    switch (name) {
      case 'eid':
        if (!trimmedValue) errorMsg = 'Employee ID is required.';
        else if (!/^E\\d{3}$/.test(trimmedValue)) errorMsg = 'Employee ID must be in format E001';
        else if (formMode === 'add' && employees.some(emp => emp.eid === trimmedValue)) errorMsg = 'ID already exists';
        break;
      case 'fname':
        if (!/^[A-Za-z]*$/.test(value)) errorMsg = 'Only letters allowed.';
        else if (!trimmedValue) errorMsg = 'First name required.';
        else if (trimmedValue.length < 3) errorMsg = 'Min 3 characters.';
        break;
      case 'lname':
        if (!trimmedValue) errorMsg = 'Last name required.';
        else if (!/^[A-Za-z\\s]+$/.test(trimmedValue)) errorMsg = 'Only letters & spaces allowed.';
        break;
      case 'email':
        if (!trimmedValue) {
          errorMsg = 'Email is required.';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedValue)) {
          errorMsg = 'Please enter a valid email format (e.g., user@company.com).';
        } else if (
          formMode === 'add' && employees.some(emp => emp.email.toLowerCase() === trimmedValue.toLowerCase())
        ) {
          errorMsg = 'Email already exists. Please use a different email.';
        } else if (
          formMode === 'edit' && employees.some(emp => emp.email.toLowerCase() === trimmedValue.toLowerCase() && emp.eid !== form.eid)
        ) {
          errorMsg = 'Email already exists. Please use a different email.';
        }
        break;
      case 'did':
        if (!trimmedValue) {
          errorMsg = 'Department name cannot be empty.';
        } else if (
          !existingDepartments.some(dept => dept.toLowerCase() === trimmedValue.toLowerCase())
        ) {
          errorMsg = `Department "${trimmedValue}" does not exist. Available departments: ${existingDepartments.join(', ')}`;
        }
        break;
      case 'password':
        if (formMode === 'add') {
          if (!value) errorMsg = 'Password required.';
          else if (value.length < 6) errorMsg = 'Min 6 characters.';
        }
        break;
    }

    return errorMsg;
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setFormErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
    if (generalError) setGeneralError('');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const fields = ['eid', 'fname', 'lname', 'email', 'did', 'manager', ...(formMode === 'add' ? ['password'] : [])];
    const newErrors = {};

    fields.forEach(field => {
      const errorMsg = validateField(field, form[field]);
      if (errorMsg) newErrors[field] = errorMsg;
    });

    if (Object.keys(newErrors).length) {
      setFormErrors(newErrors);
      return;
    }

    try {
      if (formMode === 'add') {
        await axios.post(`${API}/api/employees`, form, authHeader);
        alert('Employee added');
      } else {
        await axios.put(`${API}/api/employees/${selectedId}`, form, authHeader);
        alert('Employee updated');
      }
      close();
      fetchEmployees();
    } catch (err) {
      console.error('Submit error', err);
      setGeneralError(err.response?.data?.error || 'Submit error');
    }
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete employee?')) return;
    try {
      await axios.delete(`${API}/api/users/${id}`, authHeader);
      alert('Deleted');
      fetchEmployees();
    } catch (e) {
      console.error('Delete error', e);
      alert(e.response?.data?.error || 'Error deleting');
    }
  };

  const toggleStatus = async (emp) => {
    const newStatus = emp.status === 'active' ? 'inactive' : 'active';
    try {
      await axios.put(`${API}/api/users/${emp.id}/status`, { status: newStatus }, authHeader);
      fetchEmployees();
    } catch (err) {
      console.error('Status update error', err);
      alert('Failed to update status');
    }
  };

  const downloadCSV = () => {
    const headers = ['Employee ID', 'First Name', 'Last Name', 'Email', 'Department', 'Status'];
    const rows = filtered.map(emp => [emp.eid, emp.fname, emp.lname, emp.email, emp.did, emp.status]);
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'employee_directory.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = employees.filter(emp =>
    `${emp.fname} ${emp.lname}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="employee-table-container">
      <div className="table-header">
        <h2>User Directory</h2>
        <div className="controls">
          <input
            type="text"
            className="search-bar"
            placeholder="Search employee..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button className="add-btn" onClick={openAdd}>
            <FaPlus /> Add Employee
          </button>
        </div>
      </div>

      <table className="employee-table">
        <thead>
          <tr>
            <th>Employee ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Department</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={6} className="no-data">No employees found.</td>
            </tr>
          ) : (
            filtered.map(emp => (
              <tr key={emp._id || emp.eid}>
                <td>{emp.eid}</td>
                <td>{emp.fname} {emp.lname}</td>
                <td>{emp.email}</td>
                <td>{emp.did}</td>
                <td>
                  <button
                    onClick={() => toggleStatus(emp)}
                    className={emp.status === 'active' ? 'status-active' : 'status-inactive'}
                  >
                    {emp.status === 'active' ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td>
                  <FaEdit onClick={() => openEdit(emp)} className="icon edit-icon" />
                  <FaTrash onClick={() => handleDelete(emp.id || emp._id)} className="icon delete-icon" />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {showModal && (
        <ModalWrapper onClose={close} title={formMode === 'add' ? 'Add Employee' : 'Edit Employee'}>
          <form className="modal-form" onSubmit={handleSubmit}>
            {generalError && <div className="form-error">{generalError}</div>}

            {['eid', 'fname', 'lname', 'email'].map(field => (
              <div className="floating-label" key={field}>
                <input
                  name={field}
                  value={form[field]}
                  onChange={handleChange}
                  placeholder=" "
                  required
                  disabled={field === 'eid' && formMode === 'edit'}
                />
                <label>{getFieldLabel(field)}<span className="required-star">*</span></label>
                {formErrors[field] && <div className="field-error">{formErrors[field]}</div>}
              </div>
            ))}

            {/* Department dropdown */}
            <div className="floating-label" key="did">
              <select
                name="did"
                value={form.did}
                onChange={handleChange}
                required
              >
                <option value="" disabled>Select Department</option>
                {existingDepartments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              <label>{getFieldLabel('did')}<span className="required-star">*</span></label>
              {formErrors.did && <div className="field-error">{formErrors.did}</div>}
            </div>

            {formMode === 'add' && (
              <div className="floating-label">
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder=" "
                  required
                />
                <label>Password<span className="required-star">*</span></label>
                {formErrors.password && <div className="field-error">{formErrors.password}</div>}
              </div>
            )}
            <button type="submit">{formMode === 'add' ? 'Add' : 'Update'}</button>
          </form>
        </ModalWrapper>
      )}
    </div>
  );
};

export default EmployeeDirectory;
