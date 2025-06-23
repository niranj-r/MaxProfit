import React, { useState, useEffect } from 'react';
import '../EmployeeDirectory.css';
import { FaPlus } from 'react-icons/fa';
import axios from 'axios';
import ModalWrapper from '../ModalWrapper';

const API = process.env.REACT_APP_API_BASE_URL;
const token = localStorage.getItem("token");
const authHeader = { headers: { Authorization: `Bearer ${token}` } };

const initialForm = { eid: '', fname: '', lname: '', email: '', did: '', password: '', manager: '' };
const getFieldLabel = (field) => {
  switch (field) {
    case 'eid': return 'Employee ID';
    case 'fname': return 'First Name';
    case 'lname': return 'Last Name';
    case 'email': return 'Email';
    case 'did': return 'Department';
    case 'manager': return 'Manager';
    case 'password': return 'Password';
    default: return field;
  }
};

const FAEmployeeDirectory = () => {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(initialForm);
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
        else if (!/^E\d{3}$/.test(trimmedValue)) errorMsg = 'Employee ID must be in format E001';
        else if (employees.some(emp => emp.eid === trimmedValue)) errorMsg = 'ID already exists';
        break;
      case 'fname':
        if (!/^[A-Za-z]*$/.test(value)) errorMsg = 'Only letters allowed.';
        else if (!trimmedValue) errorMsg = 'First name required.';
        else if (trimmedValue.length < 3) errorMsg = 'Min 3 characters.';
        break;
      case 'lname':
        if (!trimmedValue) errorMsg = 'Last name required.';
        else if (!/^[A-Za-z\s]+$/.test(trimmedValue)) errorMsg = 'Only letters & spaces allowed.';
        break;
      case 'email':
        if (!trimmedValue) {
          errorMsg = 'Email is required.';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedValue)) {
          errorMsg = 'Invalid email format.';
        } else if (
          employees.some(emp => emp.email.toLowerCase() === trimmedValue.toLowerCase())
        ) {
          errorMsg = 'Email already exists.';
        }
        break;
      case 'did':
        if (!trimmedValue) {
          errorMsg = 'Department is required.';
        } else if (
          !existingDepartments.some(dept => dept.toLowerCase() === trimmedValue.toLowerCase())
        ) {
          errorMsg = `Department "${trimmedValue}" does not exist. Available: ${existingDepartments.join(', ')}`;
        }
        break;
      case 'password':
        if (!value) errorMsg = 'Password required.';
        else if (value.length < 6) errorMsg = 'Min 6 characters.';
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
    const fields = ['eid', 'fname', 'lname', 'email', 'did', 'manager', 'password'];
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
      await axios.post(`${API}/api/employees`, form, authHeader);
      alert('Employee added');
      close();
      fetchEmployees();
    } catch (err) {
      console.error('Submit error', err);
      setGeneralError(err.response?.data?.error || 'Submit error');
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
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={5} className="no-data">No employees found.</td>
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
                    disabled
                    className={emp.status === 'active' ? 'status-active' : 'status-inactive'}
                  >
                    {emp.status === 'active' ? 'Active' : 'Inactive'}
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {showModal && (
        <ModalWrapper onClose={close} title="Add Employee">
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
                />
                <label>{getFieldLabel(field)}<span className="required-star">*</span></label>
                {formErrors[field] && <div className="field-error">{formErrors[field]}</div>}
              </div>
            ))}

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

            <button type="submit">Add</button>
          </form>
        </ModalWrapper>
      )}
    </div>
  );
};

export default FAEmployeeDirectory;
