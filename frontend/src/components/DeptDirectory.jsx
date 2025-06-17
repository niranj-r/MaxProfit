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

const DepartmentDirectory = () => {
  const [departments, setDepartments] = useState([]);
  const [organisations, setOrganisations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [currentDept, setCurrentDept] = useState({
    did: '',
    name: '',
    oid: '',
    managerId: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetchDepartments();
    fetchOrganisations();
    fetchEmployees();
  }, []);

  const fetchDepartments = async () => {
    try {
      const res = await axios.get(`${API}/api/departments`, authHeader);
      setDepartments(res.data);
    } catch (err) {
      console.error('Failed to fetch departments', err);
    }
  };

  const fetchOrganisations = async () => {
    try {
      const res = await axios.get(`${API}/api/organisations`, authHeader);
      setOrganisations(res.data);
    } catch (err) {
      console.error('Failed to fetch organisations', err);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${API}/api/employees`, authHeader);
      setEmployees(res.data);
    } catch (err) {
      console.error('Failed to fetch employees', err);
    }
  };

  const openAddModal = () => {
    const defaultOid = organisations.length === 1 ? organisations[0].oid : '';
    setFormMode('add');
    setCurrentDept({ did: '', name: '', oid: defaultOid, managerId: '' });
    setFormErrors({});
    setGeneralError('');
    setShowModal(true);
  };

  const openEditModal = (dept) => {
    setFormMode('edit');
    setCurrentDept({
      did: dept.did,
      name: dept.name,
      oid: dept.oid,
      managerId: dept.managerId || ''
    });
    setEditId(dept.did);
    setFormErrors({});
    setGeneralError('');
    setShowModal(true);
  };

  const validateField = (name, value) => {
    let errorMsg = '';
    switch (name) {
      case 'did':
        if (!value.trim()) {
          errorMsg = 'Department ID cannot be empty or just spaces.';
        } else {
          const didRegex = /^D\d{3}$/;
          if (!didRegex.test(value.trim())) {
            errorMsg = 'Department ID must be in the format D000.';
          } else if (formMode === 'add' && departments.some(dep => dep.did === value.trim())) {
            errorMsg = `Department ID '${value}' already exists.`;
          }
        }
        break;
      case 'name':
        if (!value.trim()) {
          errorMsg = 'Department name cannot be empty.';
        } else {
          const nameRegex = /^[A-Za-z ]{2,50}$/;
          const trimmedValue = value.trim();
          if (!nameRegex.test(trimmedValue)) {
            errorMsg = 'Department name must be 2-50 letters and cannot contain numbers or special characters.';
          } else {
            const duplicate = departments.find(
              dept =>
                dept.name.toLowerCase() === trimmedValue.toLowerCase() &&
                (formMode !== 'edit' || dept.did !== currentDept.did)
            );
            if (duplicate) {
              errorMsg = 'This department name already exists.';
            }
          }
        }
        break;
      case 'managerId':
        if (!value.trim()) {
          errorMsg = 'Manager ID cannot be empty or just spaces.';
        } else {
          const isValidManager = employees.some(emp => emp.eid === value.trim());
          if (!isValidManager) {
            errorMsg = 'Manager ID must be a valid Employee ID.';
          }
        }
        break;
      default:
        break;
    }
    return errorMsg;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentDept(prev => ({ ...prev, [name]: value }));
    const errorMsg = validateField(name, value);
    setFormErrors(prev => ({ ...prev, [name]: errorMsg }));
    if (generalError) setGeneralError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');
    setFormErrors({});

    const { did, name, managerId } = currentDept;
    const newErrors = {};
    let hasErrors = false;

    ['did', 'name', 'managerId'].forEach(field => {
      const error = validateField(field, currentDept[field]);
      if (error) {
        newErrors[field] = error;
        hasErrors = true;
      }
    });

    if (!did || !name || !managerId) {
      setGeneralError('All fields are required.');
      hasErrors = true;
    }

    if (hasErrors) {
      setFormErrors(newErrors);
      return;
    }

    try {
      if (formMode === 'add') {
        const res = await axios.post(`${API}/api/departments`, currentDept, authHeader);
        setDepartments(prev => [...prev, { ...currentDept, _id: res.data._id || Math.random().toString() }]);
        alert("Department added successfully");
        fetchDepartments();
      } else {
        const res = await axios.put(`${API}/api/departments/${editId}`, currentDept, authHeader);
        setDepartments(prev => prev.map(dept => dept.did === editId ? { ...dept, ...currentDept } : dept));
        alert("Department updated successfully");
        fetchDepartments();
      }
      setShowModal(false);
    } catch (err) {
      console.error("Failed to submit department", err);
      const errorMsg = err.response?.data?.error || 'Error submitting department';
      setGeneralError(errorMsg);
    }
  };

  const handleDelete = async (did) => {
    if (!window.confirm("Are you sure you want to delete this department?")) return;
    try {
      await axios.delete(`${API}/api/departments/${did}`, authHeader);
      setDepartments(prev => prev.filter(dept => dept.did !== did));
      alert("Department deleted successfully");
    } catch (err) {
      console.error("Failed to delete department", err);
      alert("Error deleting department.");
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setFormErrors({});
    setGeneralError('');
  };

  const filteredDepartments = departments.filter(d =>
    d.name?.toLowerCase().includes(search.toLowerCase())
  );

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
          <button className="add-btn" onClick={openAddModal}>
            <FaPlus /> Add Department
          </button>
        </div>
      </div>

      <table className="employee-table">
        <thead>
          <tr>
            <th>Department ID</th>
            <th>Name</th>
            <th>Organisation ID</th>
            <th>Manager ID</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredDepartments.map((dept) => (
            <tr key={dept._id || dept.did}>
              <td>{dept.did}</td>
              <td>{dept.name}</td>
              <td>{dept.oid}</td>
              <td>{dept.managerId || '—'}</td>
              <td>
                <FaEdit className="icon edit-icon" onClick={() => openEditModal(dept)} />
                <FaTrash className="icon delete-icon" onClick={() => handleDelete(dept.did)} />
              </td>
            </tr>
          ))}
          {filteredDepartments.length === 0 && (
            <tr>
              <td colSpan="7" className="no-data">No matching departments found.</td>
            </tr>
          )}
        </tbody>
      </table>

      {showModal && (
        <ModalWrapper
          title={formMode === 'add' ? 'Add Department' : 'Edit Department'}
          onClose={closeModal}
        >
          <form className="modal-form" onSubmit={handleSubmit}>
            {generalError && (
              <div className="form-error" style={{ backgroundColor: '#fee', color: '#c33', padding: '10px', borderRadius: '4px', marginBottom: '15px', border: '1px solid #fcc' }}>
                {generalError}
              </div>
            )}

            <div className="floating-label">
              <input
                name="did"
                placeholder=" "
                value={currentDept.did}
                onChange={handleInputChange}
                disabled={formMode === 'edit'}
                style={formErrors.did ? { borderColor: '#c33' } : {}}
              />
              <label>Department ID</label>
              {formErrors.did && <div className="field-error">{formErrors.did}</div>}
            </div>

            <div className="floating-label">
              <input
                name="name"
                placeholder=" "
                value={currentDept.name}
                onChange={handleInputChange}
                style={formErrors.name ? { borderColor: '#c33' } : {}}
              />
              <label>Department Name</label>
              {formErrors.name && <div className="field-error">{formErrors.name}</div>}
            </div>

            <div className="floating-label">
              <input
                name="organizationName"
                placeholder=" "
                value={
                  organisations.find(org => org.oid === currentDept.oid)?.name || ''
                }
                disabled
                readOnly
              />
              <label>Organisation</label>
            </div>

            <div className="floating-label">
              <input
                name="managerId"
                placeholder=" "
                value={currentDept.managerId}
                onChange={handleInputChange}
                style={formErrors.managerId ? { borderColor: '#c33' } : {}}
              />
              <label>Manager ID</label>
              {formErrors.managerId && <div className="field-error">{formErrors.managerId}</div>}
            </div>

            <button type="submit">{formMode === 'add' ? 'Add' : 'Update'}</button>
          </form>
        </ModalWrapper>
      )}
    </div>
  );
};

export default DepartmentDirectory;
