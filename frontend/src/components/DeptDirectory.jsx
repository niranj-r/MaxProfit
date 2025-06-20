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

// Custom Multi-Select Manager Component
const ManagerSelector = ({ selectedManagers, onManagerChange, employees, error }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredEmployees = employees.filter(emp =>
    emp.eid.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${emp.fname} ${emp.lname}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleManagerSelect = (managerId) => {
    const newSelectedManagers = selectedManagers.includes(managerId)
      ? selectedManagers.filter(id => id !== managerId)
      : [...selectedManagers, managerId];

    onManagerChange(newSelectedManagers);
  };

  const removeManager = (managerId) => {
    const newSelectedManagers = selectedManagers.filter(id => id !== managerId);
    onManagerChange(newSelectedManagers);
  };

  const getManagerName = (managerId) => {
    const manager = employees.find(emp => emp.eid === managerId);
    return manager ? `${manager.fname} ${manager.lname}` : managerId;
  };

  return (
    <div className="manager-selector" ref={dropdownRef}>
      <label>Managers</label>

      {/* Selected Managers Display */}
      <div className="selected-managers">
        {selectedManagers.map(managerId => (
          <div key={managerId} className="manager-tag">
            <span>{managerId} - {getManagerName(managerId)}</span>
            <FaTimes
              className="remove-manager"
              onClick={() => removeManager(managerId)}
            />
          </div>
        ))}
      </div>

      {/* Search Input */}
      <div className="manager-search-container">
        <div className="search-input-wrapper">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search managers by ID or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setIsOpen(true)}
            className="manager-search-input"
            style={error ? { borderColor: '#c33' } : {}}
          />
        </div>
      </div>

      {/* Dropdown List */}
      {isOpen && (
        <div className="manager-dropdown">
          {filteredEmployees.length > 0 ? (
            filteredEmployees.map(emp => (
              <div
                key={emp.eid}
                className={`manager-option ${selectedManagers.includes(emp.eid) ? 'selected' : ''}`}
                onClick={() => handleManagerSelect(emp.eid)}
              >
                <input
                  type="checkbox"
                  checked={selectedManagers.includes(emp.eid)}
                  readOnly
                />
                <span>{emp.eid} - {emp.fname} {emp.lname}</span>
              </div>
            ))
          ) : (
            <div className="no-results">No managers found</div>
          )}
        </div>
      )}

      {error && <div className="field-error">{error}</div>}
    </div>
  );
};

const DepartmentDirectory = () => {
  const [departments, setDepartments] = useState([]);
  const [organisations, setOrganisations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [currentDept, setCurrentDept] = useState({ did: '', name: '', oid: '', managerIds: [] });
  const [formErrors, setFormErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [editId, setEditId] = useState(null);
  const [formErrors, setFormErrors] = useState({}); // Object to store field-specific errors
  const [generalError, setGeneralError] = useState('');
  // General form error

  useEffect(() => {
    fetchDepartments();
    fetchOrganisations();
    fetchEmployees();
  }, []);

  // Fetch departments - FIXED: moved outside useEffect and called properly
  const fetchDepartments = async () => {
    try {
      const res = await axios.get(`${API}/api/departments`, authHeader);
      setDepartments(res.data); // set departments directly here
    } catch (err) {
      console.error("Failed to fetch departments", err);
    }
  };


  const fetchOrganisations = async () => {
    try {
      const res = await axios.get(`${API}/api/organisations`, authHeader);
      setOrganisations(res.data);
      if (res.data.length > 0) {
        const org = res.data[0];
        setOrganisationName(org.name);
        setOrganisationId(org.oid);
        setCurrentDept(prev => ({ ...prev, oid: org.oid }));
      }
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

  const handleDelete = async (did) => {
    if (!window.confirm("Are you sure you want to delete this department?")) return;
    try {
      await axios.delete(`${API}/api/departments/${did}`, authHeader);
      setDepartments(prev => prev.filter(dept => dept.did !== did));
      alert("Department deleted successfully");
    } catch (err) {
      console.error("Failed to delete department", err);
      if (err.response?.data?.error) alert(err.response.data.error);
      else alert("Error deleting department.");
    }
  };

  const openAddModal = () => {
    setFormMode('add');
    setCurrentDept({ did: '', name: '', oid: '', managerId: '' });
    setFormErrors({}); // Clear any previous errors
    setGeneralError(''); // Clear general error
    setShowModal(true);
  };

  const openEditModal = (dept) => {
    setFormMode('edit');
    const managerIds = dept.managerIds || (dept.managerId ? [dept.managerId] : []);
    setCurrentDept({ ...dept, managerIds });
    setEditId(dept.did);
    setFormErrors({}); // Clear any previous errors
    setGeneralError(''); // Clear general error
    setShowModal(true);
  };

  const validateField = (name, value) => {
    let errorMsg = '';

    switch (name) {
      case 'did':
        if (!value.trim()) errorMsg = 'Department ID cannot be empty.';
        else if (!/^D\d{3}$/.test(value)) errorMsg = 'Department ID must be in format D001';
        else if (formMode === 'add' && departments.some(dep => dep.did === value)) errorMsg = 'Department ID already exists.';
        break;

      case 'name':
        if (!value.trim()) errorMsg = 'Department name is required.';
        else if (!/^[A-Za-z ]{2,50}$/.test(value)) errorMsg = 'Name must be 2-50 letters.';
        else if (departments.some(dep => dep.name.trim().toLowerCase() === value.trim().toLowerCase() && dep.did !== currentDept.did)) errorMsg = `Department "${value}" already exists.`;
        break;


      case 'oid':
        if (!value.trim()) errorMsg = 'Organization ID required.';
        else if (!organisations.some(org => org.oid === value)) errorMsg = 'Invalid Organization ID.';
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
    setFormErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
    setGeneralError('');
  };

  const handleManagerChange = (selectedManagers) => {
    setCurrentDept(prev => ({ ...prev, managerIds: selectedManagers }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fields = ['did', 'name', 'oid'];
    const newErrors = {};
    let hasErrors = false;

    fields.forEach(field => {
      const error = validateField(field, currentDept[field]);
      if (error) {
        newErrors[field] = error;
        hasErrors = true;
      }
    }

    // Check for empty fields
    if (!did || !name || !oid || !managerId) {
      setGeneralError('All fields are required.');
      hasErrors = true;
    }

    // Check for duplicate department ID when adding
    if (formMode === 'add') {
      const isDuplicate = departments.some(dept => dept.did === did);
      if (isDuplicate) {
        setFormErrors(prev => ({
          ...prev,
          did: `A department with ID '${did}' already exists. Please use a different Department ID.`
        }));
        hasErrors = true;
      }
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
      await fetchDepartments(); // refresh after update/add
    } catch (err) {
      console.error("Failed to submit department", err);
      const errorMsg = err.response?.data?.error || 'Error submitting department';
      setGeneralError(errorMsg);
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
          <button className="add-btn" onClick={openAddModal}><FaPlus /> Add Department</button>
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
          {filteredDepartments.length > 0 ? (
            filteredDepartments.map((dept) => (
              <tr key={dept.did}>
                <td>{dept.did}</td>
                <td>{dept.name}</td>
                <td>{dept.oid}</td>
                <td>{getManagerNames(dept)}</td>
                <td>
                  <FaEdit className="icon edit-icon" onClick={() => openEditModal(dept)} />
                  <FaTrash className="icon delete-icon" onClick={() => handleDelete(dept.did)} />
                </td>
              </tr>
            ))
          ) : (
            <tr><td colSpan="5" className="no-data">No matching departments found.</td></tr>
          )}
        </tbody>
      </table>

      {showModal && (
        <ModalWrapper title={formMode === 'add' ? 'Add Department' : 'Edit Department'} onClose={() => setShowModal(false)}>
          <form className="modal-form" onSubmit={handleSubmit}>
            {generalError && (<div className="form-error">{generalError}</div>)}

            <div className="floating-label">
              <input
                name="did"
                value={currentDept.did}
                onChange={handleInputChange}
                disabled={formMode === 'edit'}
                style={formErrors.did ? { borderColor: '#c33' } : {}}
              />
              <label>Department ID <span style={{ color: '#c33' }}>*</span></label>
              {formErrors.did && (<div className="field-error">{formErrors.did}</div>)}
            </div>

            <div className="floating-label">
              <input
                name="name"
                value={currentDept.name}
                onChange={handleInputChange}
                style={formErrors.name ? { borderColor: '#c33' } : {}}
              />
              <label>Department Name <span style={{ color: '#c33' }}>*</span></label>
              {formErrors.name && (<div className="field-error">{formErrors.name}</div>)}
            </div>

            <div className="floating-label">
              <input
                name="organisationName"
                value={organisationName}
                readOnly
                style={{ backgroundColor: '#f0f0f0', cursor: 'not-allowed' }}
              />
              <label>Organisation ID</label>
              {formErrors.oid && <div className="field-error">{formErrors.oid}</div>}
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
