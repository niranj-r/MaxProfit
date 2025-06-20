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
  const [formMode, setFormMode] = useState('add');
  const [form, setForm] = useState(initialForm);
  const [selectedId, setSelectedId] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [existingDepartments, setExistingDepartments] = useState([]);

  useEffect(() => { fetchEmployees(); }, []);

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
      console.error('Failed to fetch employees', e.response?.data || e);
      alert('Failed to fetch employees. Please try again.');
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
    setForm({ eid: emp.eid, fname: emp.fname, lname: emp.lname, email: emp.email, did: emp.did, manager: emp.manager || '', password: '' });
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

    switch (name) {
      case 'eid':
        if (value.trim() === '') {
          errorMsg = 'Employee ID cannot be empty.';
        } else {
          const empIdPattern = /^E\d{3}$/;
          if (!empIdPattern.test(value)) {
            errorMsg = 'Employee ID must be in the format E001, E123, etc.';
          } else if (formMode === 'add' && employees.some(emp => emp.eid === value)) {
            errorMsg = `Employee ID '${value}' already exists. Please use a different one.`;
          }
        }
        break;

      case 'fname':
        if (value.trim() === '') {
          errorMsg = 'First name cannot be empty.';
        } else {
          const alphabeticOnlyPattern = /^[A-Za-z]+$/;
          if (!alphabeticOnlyPattern.test(value)) {
            errorMsg = 'First name must contain only alphabetic characters.';
          } else if (value.length < 3) {
            errorMsg = 'First name must be more than 3 characters long.';
          } else if (value.length > 30) {
            errorMsg = 'First name must not exceed 30 characters.';
          }
        }
        break;

      case 'lname':
        if (value.trim() === '') {
          errorMsg = 'Last name cannot be empty.';
        } else {
          const alphabeticAndSpacePattern = /^[A-Za-z\s]+$/;
          if (!alphabeticAndSpacePattern.test(value)) {
            errorMsg = 'Last name must contain only alphabetic characters and spaces.';
          } else if (value.length < 1 || value.length > 30) {
            errorMsg = 'Last name must be between 1 and 30 characters.';
          }
        }
        break;

      case 'email':
        if (!trimmedValue) {
          errorMsg = 'Email is required.';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedValue)) {
          errorMsg = 'Please enter a valid email format (e.g., user@company.com).';
        } else if (formMode === 'add' && employees.some(emp => emp.email.toLowerCase() === trimmedValue.toLowerCase())) {
          errorMsg = 'Email already exists. Please use a different email.';
        } else if (formMode === 'edit' && employees.some(emp => emp.email.toLowerCase() === trimmedValue.toLowerCase() && emp.eid !== form.eid)) {
          errorMsg = 'Email already exists. Please use a different email.';
        }
        break;

      case 'did':
        if (!trimmedValue) {
          errorMsg = 'Department is required.';
        } else if (!existingDepartments.includes(trimmedValue.toLowerCase())) {
          errorMsg = `Department "${trimmedValue}" does not exist. Available departments: ${existingDepartments.join(', ')}`;
        }
        break;

      case 'password':
        if (formMode === 'add') {
          if (value.trim() === '') {
            errorMsg = 'Password cannot be empty.';
          } else if (value.length < 6) {
            errorMsg = 'Password must be at least 6 characters long.';
          }
        }
        break;

      default:
        break;
    }

    return errorMsg;
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    const errorMsg = validateField(name, value);
    setFormErrors(prev => ({ ...prev, [name]: errorMsg }));
    if (generalError) setGeneralError('');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setGeneralError('');
    setFormErrors({});
    const { eid, fname, lname, email, did, password } = form;

    const fields = [
      { name: 'eid', value: eid },
      { name: 'fname', value: fname },
      { name: 'lname', value: lname },
      { name: 'email', value: email },
      { name: 'did', value: did },
      ...(formMode === 'add' ? [{ name: 'password', value: password }] : [])
    ];

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
        alert('Employee added successfully');
      } else {
        await axios.put(`${API}/api/employees/${selectedId}`, form, authHeader);
        alert('Employee updated successfully');
      }
      close();
      fetchEmployees();
    } catch (err) {
      console.error('Submit error', err.response?.data || err);
      const errorMsg = err.response?.data?.error || 'Error submitting employee';
      setGeneralError(errorMsg);
    }
  };

  const handleDelete = async id => {
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
  const toggleStatus = async (emp) => {
    const newStatus = emp.status === 'active' ? 'inactive' : 'active';

    try {
      await axios.put(`${API}/api/users/${emp.id}/status`, { status: newStatus }, authHeader);
      //alert(Employee status updated to ${newStatus});
      fetchEmployees();
    } catch (err) {
      console.error('Status update error', err.response?.data || err);
      alert('Failed to update status');
    }
  };

  const filtered = employees.filter(emp =>
    `${emp.fname} ${emp.lname}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="employee-table-container">
      <div className="table-header">
        <h2>User Directory</h2>
        <div className="controls">
          <input type="text" className="search-bar" placeholder="Search employee..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <button className="add-btn" onClick={openAdd}><FaPlus /> Add Employee</button>
        </div>
      </div>
      <table className="employee-table">
        <thead>
          <tr>
            <th>Employee ID</th><th>Name</th><th>Email</th><th>Department</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(emp => (
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
          ))}
        </tbody>
      </table>

      {showModal && (
        <ModalWrapper
          onClose={close}
          title={formMode === 'add' ? 'Add Employee' : 'Edit Employee'}
        >
          <form className="modal-form" onSubmit={handleSubmit}>
            {generalError && <div className="form-error">{generalError}</div>}

            {['eid', 'fname', 'lname', 'email', 'did'].map(field => (
              <div className="floating-label" key={field}>
                <input name={field} value={form[field]} onChange={handleChange} placeholder=" " required disabled={field === 'eid' && formMode === 'edit'} />
                <label>{getFieldLabel(field)}<span className="required-star">*</span></label>
                {formErrors[field] && <div className="field-error">{formErrors[field]}</div>}
              </div>
            ))}

            {formMode === 'add' && (
              <div className="floating-label">
                <input name="password" type="password" value={form.password} onChange={handleChange} placeholder=" " required />
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
