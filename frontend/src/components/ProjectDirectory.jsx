import React, { useState, useEffect } from 'react';
import './EmployeeDirectory.css';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import axios from 'axios';
import ModalWrapper from './ModalWrapper';
import { useNavigate } from 'react-router-dom';
import ProjectAssignee from './ProjectAssignees';
import Papa from 'papaparse';

const API = process.env.REACT_APP_API_BASE_URL;

const ProjectDirectory = () => {
  const [projects, setProjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [form, setForm] = useState({
    name: '',
    departmentId: '',
    startDate: '',
    endDate: ''
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
    if (projects.length > 0) fetchProjectCosts();
  }, [projects]);

  const fetchProjectCosts = async () => {
    const costs = {};
    try {
      for (const proj of projects) {
        const res = await axios.get(`${API}/api/projects/${proj.id}/total-cost`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        costs[proj.id] = {
          totalCost: res.data.totalCost,
          actualCost: res.data.actualCost
        };
      }
      setProjectCosts(costs);
    } catch (err) {
      console.error('Failed to fetch project costs', err);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await axios.get(`${API}/api/projects`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setProjects(res.data);
    } catch (err) {
      console.error('Failed to fetch projects', err);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await axios.get(`${API}/api/departments`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setDepartments(res.data);
    } catch (err) {
      console.error('Failed to load departments', err);
    }
  };

  const openAddModal = () => {
    setForm({ name: '', departmentId: '', startDate: '', endDate: '' });
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
      endDate: project.endDate?.substring(0, 10) || ''
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
        if (!trimmedValue) errorMsg = 'Project name is required.';
        else if (trimmedValue.length < 3 || trimmedValue.length > 30)
          errorMsg = 'Project name must be 3–30 characters.';
        else if (!/^[A-Za-z\s]+$/.test(trimmedValue))
          errorMsg = 'Project name can only contain letters and spaces.';
        break;

      case 'departmentId':
        if (!trimmedValue) errorMsg = 'Department ID is required.';
        else if (!departments.some(dep => dep.did === trimmedValue))
          errorMsg = 'Invalid department ID. Please select a valid department.';
        break;

      case 'startDate':
        if (!trimmedValue) errorMsg = 'Start date is required.';
        else {
          const start = new Date(trimmedValue);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (start < today) errorMsg = 'Start date cannot be in the past.';
        }
        break;

      case 'endDate':
        if (!trimmedValue) errorMsg = 'End date is required.';
        else {
          const start = new Date(form.startDate);
          const end = new Date(trimmedValue);
          if (start >= end) errorMsg = 'End date must be after start date.';
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

    const fields = ['name', 'departmentId', 'startDate', 'endDate'];
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
      const errorMsg = err.response?.data?.error || `Error ${formMode === 'add' ? 'adding' : 'updating'} project`;
      setGeneralError(errorMsg);
    }
  };

  const handleAssigneesClick = (project) => {
    setSelectedProject(project);
    setShowAssigneesModal(true);
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
      alert('Error deleting project. Check console.');
    }
  };

  const handleDownloadCSV = () => {
    if (!projects || projects.length === 0) {
      alert('No project data available to export.');
      return;
    }

    const csvData = projects.map(proj => {
      const total = projectCosts[proj.id]?.totalCost || 0;
      const actual = projectCosts[proj.id]?.actualCost || 0;
      return {
        'Project Name': proj.name,
        'Department ID': proj.departmentId,
        'Start Date': proj.startDate?.substring(0, 10) || '',
        'End Date': proj.endDate?.substring(0, 10) || '',
        'Total Cost': total,
        'Actual Cost': actual,
        'Margin': (total - actual).toFixed(2)
      };
    });

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'project_directory.csv');
    link.click();
  };

  const filteredProjects = projects.filter(p =>
    (p.name || '').toLowerCase().includes(search.toLowerCase())
  );

  const getFieldLabel = (field) => {
    switch (field) {
      case 'name':
        return 'Project Name';
      case 'startDate':
        return 'Start Date';
      case 'endDate':
        return 'End Date';
      default:
        return field;
    }
  };
  
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
          <button className="add-btn" onClick={openAddModal}><FaPlus /> Add Project</button>
          <button className="add-btn" onClick={handleDownloadCSV}>📥 Download</button>
        </div>
      </div>

      <table className="employee-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Department ID</th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Total Revenue ($)</th>
            <th>Actual Cost ($)</th>
            <th>Margin ($)</th>
            <th>Actions</th>
            <th>Assign</th>
          </tr>
        </thead>
        <tbody>
          {filteredProjects.map(proj => (
            <tr key={proj.id}>
              <td>{proj.name}</td>
              <td>{proj.departmentId}</td>
              <td>{proj.startDate?.substring(0, 10) || '—'}</td>
              <td>{proj.endDate?.substring(0, 10) || '—'}</td>
              <td>{projectCosts[proj.id]?.totalCost?.toFixed(2) || '—'}</td>
              <td>{projectCosts[proj.id]?.actualCost?.toFixed(2) || '—'}</td>
              <td>
                {(projectCosts[proj.id]?.totalCost != null && projectCosts[proj.id]?.actualCost != null)
                  ? (projectCosts[proj.id].totalCost - projectCosts[proj.id].actualCost).toFixed(2)
                  : '—'}
              </td>
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
            <tr><td colSpan="9" className="no-data">No matching projects found.</td></tr>
          )}
        </tbody>
      </table>

      {showModal && (
        <ModalWrapper
          onClose={() => setShowModal(false)}
          title={formMode === 'add' ? 'Add Project' : 'Edit Project'}
        >
          <form onSubmit={handleSubmit} className="modal-form">
            {generalError && (
              <div className="form-error">{generalError}</div>
            )}

            {['name', 'startDate', 'endDate'].map(field => (
              <div className="floating-label" key={field}>
                <input
                  name={field}
                  type={field.includes('Date') ? 'date' : 'text'}
                  value={form[field]}
                  onChange={handleChange}
                  placeholder=" "
                  required
                  style={formErrors[field] ? { borderColor: '#c33' } : {}}
                />
                <label>{getFieldLabel(field)}<span className="required-star">*</span></label>
                {formErrors[field] && (
                  <div className="field-error">{formErrors[field]}</div>
                )}
              </div>
            ))}

            {/* Department ID dropdown */}
            <div className="floating-label" key="departmentId">
              <select
                name="departmentId"
                value={form.departmentId}
                onChange={handleChange}
                required
                style={formErrors.departmentId ? { borderColor: '#c33' } : {}}
              >
                <option value="" disabled>Select Department</option>
                {departments.map(dep => (
                  <option key={dep.did} value={dep.did}>
                    {dep.did} ({dep.name})
                  </option>
                ))}
              </select>
              <label>Department ID <span className="required-star">*</span></label>
              {formErrors.departmentId && (
                <div className="field-error">{formErrors.departmentId}</div>
              )}
            </div>

            <button type="submit">{formMode === 'add' ? 'Add' : 'Update'}</button>
          </form>
        </ModalWrapper>
      )}

      {showAssigneesModal && selectedProject && (
        <ModalWrapper
          title={`Assign Users to "${selectedProject.name}"`}
          onClose={() => {
            setShowAssigneesModal(false);
            setSelectedProject(null);
          }}
        >
          <ProjectAssignee
            projectId={selectedProject.id}
            projectName={selectedProject.name}
            onClose={() => {
              setShowAssigneesModal(false);
              setSelectedProject(null);
            }}
          />
        </ModalWrapper>
      )}
    </div>
  );
};

export default ProjectDirectory;
