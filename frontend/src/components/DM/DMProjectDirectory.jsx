import React, { useState, useEffect } from 'react';
import '../EmployeeDirectory.css';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import axios from 'axios';
import DMModalWrapper from './DMModalWrapper';
import { useNavigate } from 'react-router-dom';
import DMProjectAssignee from './DMProjectAssignees';

const API = process.env.REACT_APP_API_BASE_URL;

const DMProjectDirectory = () => {
  const [projects, setProjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [form, setForm] = useState({
    name: '',
    departmentId: '',
    startDate: '',
    endDate: '',
    budget: ''
  });
  const [editId, setEditId] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [showAssigneesModal, setShowAssigneesModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectCosts, setProjectCosts] = useState({});

  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (projects.length > 0) {
      fetchProjectCosts();
    }
  }, [projects]);

  const fetchProjects = async () => {
    try {
      const res = await axios.get(`${API}/api/dm-projects`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setProjects(res.data);
    } catch (err) {
      console.error('Failed to fetch projects', err);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await axios.get(`${API}/api/dm-departments`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setDepartments(res.data);
    } catch (err) {
      console.error('Failed to load departments', err);
    }
  };

  const fetchProjectCosts = async () => {
    const costs = {};
    try {
      for (const proj of projects) {
        const res = await axios.get(`${API}/api/projects/${proj.id}/total-cost`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        costs[proj.id] = res.data.totalCost;
      }
      setProjectCosts(costs);
    } catch (err) {
      console.error('Failed to fetch project costs', err);
    }
  };

  const openAddModal = () => {
    setForm({ name: '', departmentId: '', startDate: '', endDate: '', budget: '' });
    setFormMode('add');
    setEditId(null);
    setFormErrors({});
    setGeneralError('');
    setShowModal(true);
  };

  const openEditModal = (project) => {
    setForm({
      name: project.name || '',
      departmentId: project.departmentId || '',
      startDate: project.startDate?.substring(0, 10) || '',
      endDate: project.endDate?.substring(0, 10) || '',
      budget: project.budget?.toString() || ''
    });
    setFormMode('edit');
    setEditId(project.id);
    setFormErrors({});
    setGeneralError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormErrors({});
    setGeneralError('');
  };

  const validateField = (name, value) => {
    let errorMsg = '';
    const trimmedValue = value.trim();

    switch (name) {
      case 'name':
        if (!trimmedValue) {
          errorMsg = 'Project name is required.';
        } else if (trimmedValue.length < 3 || trimmedValue.length > 30) {
          errorMsg = 'Project name must be 3–30 characters.';
        } else if (!/^[A-Za-z\s]+$/.test(trimmedValue)) {
          errorMsg = 'Project name can only contain letters and spaces.';
        }
        break;
      case 'departmentId':
        if (!trimmedValue) {
          errorMsg = 'Department ID is required.';
        } else if (!departments.some(dep => dep.did === trimmedValue)) {
          errorMsg = 'Invalid department ID.';
        }
        break;
      case 'startDate':
        if (!trimmedValue) {
          errorMsg = 'Start date is required.';
        } else {
          const start = new Date(trimmedValue);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (start < today) {
            errorMsg = 'Start date cannot be in the past.';
          }
        }
        break;
      case 'endDate':
        if (!trimmedValue) {
          errorMsg = 'End date is required.';
        } else {
          const start = new Date(form.startDate);
          const end = new Date(trimmedValue);
          if (start >= end) {
            errorMsg = 'End date must be after start date.';
          }
        }
        break;
      case 'budget':
        if (!trimmedValue) {
          errorMsg = 'Budget is required.';
        } else {
          const num = parseFloat(trimmedValue);
          if (isNaN(num) || num <= 0) {
            errorMsg = 'Budget must be a positive number.';
          } else if (!/^\d+(\.\d{1,2})?$/.test(trimmedValue)) {
            errorMsg = 'Budget can have up to 2 decimal places only.';
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

    const fields = ['name', 'departmentId', 'startDate', 'endDate', 'budget'];
    const newErrors = {};
    fields.forEach(field => {
      const errorMsg = validateField(field, form[field]);
      if (errorMsg) newErrors[field] = errorMsg;
    });

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      setGeneralError('Please correct the errors in the form.');
      return;
    }

    try {
      if (formMode === 'add') {
        const res = await axios.post(`${API}/api/projects`, form, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setProjects(prev => [...prev, res.data]);
        alert('Project added successfully');
      } else {
        const res = await axios.put(`${API}/api/projects/${editId}`, form, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setProjects(prev => prev.map(p => p.id === editId ? res.data : p));
        alert('Project updated successfully');
      }
      closeModal();
      fetchProjects();
    } catch (err) {
      console.error('Error submitting project', err);
      const errorMsg = err.response?.data?.error || 'Error submitting project';
      setGeneralError(errorMsg);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project?')) return;
    try {
      await axios.delete(`${API}/api/projects/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setProjects(prev => prev.filter(p => p.id !== id));
      alert('Project deleted successfully');
      fetchProjects();
    } catch (err) {
      console.error('Error deleting project', err);
    }
  };

  const handleAssigneesClick = (project) => {
    setSelectedProject(project);
    setShowAssigneesModal(true);
  };

  const getFieldLabel = (field) => {
    switch (field) {
      case 'name': return 'Project Name';
      case 'departmentId': return 'Department';
      case 'startDate': return 'Start Date';
      case 'endDate': return 'End Date';
      case 'budget': return 'Budget';
      default: return field;
    }
  };

  const filteredProjects = projects.filter(p =>
    (p.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="employee-table-container">
      <div className="table-header">
        <h2>Project Details</h2>
        <div className="controls">
          <input
            type="text"
            className="search-bar"
            placeholder="Search project..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button className="add-btn" onClick={openAddModal}>
            <FaPlus /> Add Project
          </button>
        </div>
      </div>

      <table className="employee-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Department</th>
            <th>Start</th>
            <th>End</th>
            <th>Budget</th>
            <th>Total Cost</th>
            <th>Actions</th>
            <th>Assign</th>
          </tr>
        </thead>
        <tbody>
          {filteredProjects.map(proj => (
            <tr key={proj.id}>
              <td>{proj.name}</td>
              <td>{proj.departmentId}</td>
              <td>{proj.startDate?.substring(0, 10) || '-'}</td>
              <td>{proj.endDate?.substring(0, 10) || '-'}</td>
              <td>{proj.budget}</td>
              <td>{projectCosts[proj.id] || 0}</td>
              <td>
                <FaEdit className="icon edit-icon" onClick={() => openEditModal(proj)} />
                <FaTrash className="icon delete-icon" onClick={() => handleDelete(proj.id)} />
              </td>
              <td>
                <button className="assignees-btn" onClick={() => handleAssigneesClick(proj)}>
                  Assign
                </button>
              </td>
            </tr>
          ))}
          {filteredProjects.length === 0 && (
            <tr>
              <td colSpan="8" className="no-data">No matching projects found.</td>
            </tr>
          )}
        </tbody>
      </table>

      {showModal && (
        <DMModalWrapper
          onClose={closeModal}
          title={formMode === 'add' ? 'Add Project' : 'Edit Project'}
        >
          <form onSubmit={handleSubmit} className="modal-form">
            {generalError && <div className="form-error">{generalError}</div>}

            {['name', 'departmentId', 'startDate', 'endDate', 'budget'].map(field => (
              <div className="floating-label" key={field}>
                {field === 'departmentId' ? (
                  <>
                    <select
                      name="departmentId"
                      value={form.departmentId || ""}
                      onChange={handleChange}
                      required
                      style={formErrors[field] ? { borderColor: '#c33' } : {}}
                    >
                      <option value="" disabled>Select Department</option>
                      {departments.map(dep => (
                        <option key={dep.did} value={dep.did}>
                          {dep.name} ({dep.did})
                        </option>
                      ))}
                    </select>
                    <label className="select-label">
                      Department<span className="required-star">*</span>
                    </label>
                  </>
                ) : (
                  <>
                    <input
                      name={field}
                      type={
                        field.includes('Date') ? 'date' :
                        field === 'budget' ? 'number' : 'text'
                      }
                      value={form[field]}
                      onChange={handleChange}
                      placeholder=" "
                      required
                      style={formErrors[field] ? { borderColor: '#c33' } : {}}
                      step={field === 'budget' ? '0.01' : undefined}
                      min={field === 'budget' ? '0.01' : undefined}
                    />
                    <label>
                      {getFieldLabel(field)}<span className="required-star">*</span>
                    </label>
                  </>
                )}
                {formErrors[field] && (
                  <div className="field-error">{formErrors[field]}</div>
                )}
              </div>
            ))}

            <button type="submit">{formMode === 'add' ? 'Add' : 'Update'}</button>
          </form>
        </DMModalWrapper>
      )}

      {showAssigneesModal && selectedProject && (
        <DMModalWrapper
          title={`Assign Users to "${selectedProject.name}"`}
          onClose={() => {
            setShowAssigneesModal(false);
            setSelectedProject(null);
          }}
        >
          <DMProjectAssignee
            projectId={selectedProject.id}
            projectName={selectedProject.name}
            onClose={() => {
              setShowAssigneesModal(false);
              setSelectedProject(null);
            }}
          />
        </DMModalWrapper>
      )}
    </div>
  );
};

export default DMProjectDirectory;
