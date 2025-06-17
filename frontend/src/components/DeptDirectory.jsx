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
      const res = await axios.get(`${API}/api/employees/dept`, authHeader);
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

    // ✅ Refresh employees to reflect department updates
    await fetchEmployees();

  } catch (err) {
  console.error("Failed to delete department", err);
  if (err.response && err.response.data && err.response.data.error) {
    alert(err.response.data.error);
  } else {
    alert("Error deleting department.");
  }
}
};

  const openAddModal = () => {
    setFormMode('add');
    setCurrentDept({ did: '', name: '', oid: '', managerId: '' });
    setFormErrors({});
    setGeneralError('');
    setShowModal(true);
  };

  const openEditModal = (dept) => {
    setFormMode('edit');
    setCurrentDept({ ...dept });
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
          errorMsg = 'Department ID cannot be empty.';
        } else if (!/^D\d{3}$/.test(value)) {
          errorMsg = 'Format must be D000.';
        } else if (formMode === 'add' && departments.some(dep => dep.did === value)) {
          errorMsg = 'Department ID already exists.';
        }
        break;
      case 'name':
        if (!value.trim()) {
          errorMsg = 'Department name is required.';
        } else if (!/^[A-Za-z ]{2,50}$/.test(value)) {
          errorMsg = 'Name must be 2-50 letters.';
        } else if (departments.find(dep => dep.name.toLowerCase() === value.toLowerCase() && dep.did !== currentDept.did)) {
          errorMsg = 'Duplicate department name.';
        }
        break;
      case 'oid':
        if (!value.trim()) {
          errorMsg = 'Organization ID required.';
        } else if (!organisations.some(org => org.oid === value)) {
          errorMsg = 'Invalid Organization ID.';
        }
        break;
      case 'managerId':
        if (!value.trim()) {
          errorMsg = 'Manager is required.';
        } else if (!employees.some(emp => emp.eid === value)) {
          errorMsg = 'Invalid Manager ID.';
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
    setFormErrors(prev => ({
      ...prev,
      [name]: validateField(name, value)
    }));
    setGeneralError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { did, name, oid, managerId } = currentDept;
    const fields = ['did', 'name', 'oid', 'managerId'];
    const newErrors = {};

    let hasErrors = false;
    fields.forEach(field => {
      const error = validateField(field, currentDept[field]);
      if (error) {
        newErrors[field] = error;
        hasErrors = true;
      }
    });

    if (hasErrors) {
      setFormErrors(newErrors);
      return;
    }

    try {
      if (formMode === 'add') {
        const res = await axios.post(`${API}/api/departments`, currentDept, authHeader);
        setDepartments(prev => [...prev, res.data]);
        alert("Department added.");
      } else {
        const res = await axios.put(`${API}/api/departments/${editId}`, currentDept, authHeader);
        setDepartments(prev => prev.map(dep => dep.did === editId ? res.data : dep));
        alert("Department updated.");
      }
      setShowModal(false);
      fetchDepartments();
    } catch (err) {
      console.error(err);
      setGeneralError('Submission failed.');
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
              <td>{dept.managerId}</td>
              <td>
                <FaEdit className="icon edit-icon" onClick={() => openEditModal(dept)} />
                <FaTrash className="icon delete-icon" onClick={() => handleDelete(dept.did)} />
              </td>
            </tr>
          ))}
          {filteredDepartments.length === 0 && (
            <tr>
              <td colSpan="5" className="no-data">No matching departments found.</td>
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
              <div className="form-error">{generalError}</div>
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
                name="oid"
                placeholder=" "
                value={currentDept.oid}
                onChange={handleInputChange}
                style={formErrors.oid ? { borderColor: '#c33' } : {}}
              />
              <label>Organisation ID</label>
              {formErrors.oid && <div className="field-error">{formErrors.oid}</div>}
            </div>

            <div className="assign-panel">
              <label htmlFor="managerId">Manager</label>
              <select
                name="managerId"
                id="managerId"
                value={currentDept.managerId}
                onChange={handleInputChange}
                className="assign-panel-select"
                style={formErrors.managerId ? { borderColor: '#c33' } : {}}
              >
                <option value="">Select Manager</option>
                {employees.map(emp => (
                  <option key={emp.eid} value={emp.eid}>
                    {emp.eid} - {emp.fname} {emp.lname}
                  </option>
                ))}
              </select>
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