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
    endDate: ''
  });
  const [editId, setEditId] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [showAssigneesModal, setShowAssigneesModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectCosts, setProjectCosts] = useState({});
  const [loading, setLoading] = useState(true);

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
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/dm-projects`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setProjects(res.data);
    } catch (err) {
      console.error('Failed to fetch projects', err);
    }
    setLoading(false);
  };

    const SkeletonRow = () => (
    <tr className="skeleton-row">
      {[...Array(9)].map((_, i) => (
        <td key={i}>
          <div className="skeleton-box"></div>
        </td>
      ))}
    </tr>
  );
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

  const validateField = (name, value, mode = 'add') => {
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
          errorMsg = 'Invalid department ID.';
        break;
      case 'startDate':
        if (mode === 'edit') break;
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
    const errorMsg = validateField(name, value, formMode);
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
      const errorMsg = validateField(field, form[field], formMode);
      if (errorMsg) newErrors[field] = errorMsg;
    });

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      setGeneralError('Please correct the errors in the form.');
      return;
    }

    try {
      const url = formMode === 'add'
        ? `${API}/api/projects`
        : `${API}/api/projects/${editId}`;

      const method = formMode === 'add' ? 'post' : 'put';

      const res = await axios[method](url, form, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (formMode === 'add') setProjects(prev => [...prev, res.data]);
      else setProjects(prev => prev.map(p => p.id === editId ? res.data : p));

      alert(`Project ${formMode === 'add' ? 'added' : 'updated'} successfully`);
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
            <th>Assign</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </>
          ) : (
            <>
              {filteredProjects.map(proj => {
                const totalCost = projectCosts[proj.id]?.totalCost ?? null;
                const actualCost = projectCosts[proj.id]?.actualCost ?? null;
                const margin = totalCost !== null && actualCost !== null ? totalCost - actualCost : null;

                return (
                  <tr key={proj.id}>
                    <td>{proj.name}</td>
                    <td>{proj.departmentId}</td>
                    <td>{proj.startDate?.substring(0, 10) || '—'}</td>
                    <td>{proj.endDate?.substring(0, 10) || '—'}</td>

                    <td className="align-numbers">
                      {totalCost !== null ? totalCost.toFixed(2) : <div className="skeleton-box-sm" />}
                    </td>
                    <td className="align-numbers">
                      {actualCost !== null ? actualCost.toFixed(2) : <div className="skeleton-box-sm" />}
                    </td>
                    <td className="align-numbers" style={{
                      color:
                        margin > 0
                          ? '#008000' // green
                          : margin < 0
                            ? '#e74a3b' // red
                            : '#000000'  // black for zero or null
                    }}
                    >
                      {margin !== null ? margin.toFixed(2) : <div className="skeleton-box-sm" />}
                    </td>
                    <td>
                      <button className="assignees-btn" onClick={() => handleAssigneesClick(proj)}>Assign</button>
                    </td>
                  </tr>

                );
              })}

              {filteredProjects.length === 0 && (
                <tr>
                  <td colSpan="9" className="no-data">No matching projects found.</td>
                </tr>
              )}
            </>
          )}
        </tbody>
      </table>

      {showModal && (
        <DMModalWrapper onClose={closeModal} title={formMode === 'add' ? 'Add Project' : 'Edit Project'}>
          <form onSubmit={handleSubmit} className="modal-form">
            {generalError && <div className="form-error">{generalError}</div>}
            {['name', 'departmentId', 'startDate', 'endDate'].map(field => (
              <div className="floating-label" key={field}>
                {field === 'departmentId' ? (
                  <>
                    <select name="departmentId" value={form.departmentId || ""} onChange={handleChange} required
                      style={formErrors[field] ? { borderColor: '#c33' } : {}}>
                      <option value="" disabled>Select Department</option>
                      {departments.map(dep => (
                        <option key={dep.did} value={dep.did}>{dep.name} ({dep.did})</option>
                      ))}
                    </select>
                    <label className="select-label">Department<span className="required-star">*</span></label>
                  </>
                ) : (
                  <>
                    <input name={field} type={field.includes('Date') ? 'date' : 'text'} value={form[field]}
                      onChange={handleChange} placeholder=" " required
                      style={formErrors[field] ? { borderColor: '#c33' } : {}} />
                    <label>{getFieldLabel(field)}<span className="required-star">*</span></label>
                  </>
                )}
                {formErrors[field] && <div className="field-error">{formErrors[field]}</div>}
              </div>
            ))}
            <button type="submit">{formMode === 'add' ? 'Add' : 'Update'}</button>
          </form>
        </DMModalWrapper>
      )}

      {showAssigneesModal && selectedProject && (
        <DMModalWrapper title={`Assign Users to "${selectedProject.name}"`}
          onClose={() => { setShowAssigneesModal(false); setSelectedProject(null); }}>
          <DMProjectAssignee projectId={selectedProject.id} projectName={selectedProject.name}
            onClose={() => { setShowAssigneesModal(false); setSelectedProject(null); }} />
        </DMModalWrapper>
      )}
    </div>
  );
};

export default DMProjectDirectory;
