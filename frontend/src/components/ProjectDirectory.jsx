import React, { useState, useEffect } from 'react';
import './EmployeeDirectory.css';
import { FaEdit, FaTrash, FaPlus, FaUsers } from 'react-icons/fa';
import axios from 'axios';
import ModalWrapper from './ModalWrapper';
import { useNavigate } from 'react-router-dom';
import ProjectAssignee from './ProjectAssignees';
import { format, parseISO } from 'date-fns';

const API = process.env.REACT_APP_API_BASE_URL;

const ProjectDirectory = () => {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [showAssigneesModal, setShowAssigneesModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  
  // Form states
  const [formMode, setFormMode] = useState('add');
  const [currentProject, setCurrentProject] = useState({
    name: '',
    departmentId: '',
    startDate: '',
    endDate: '',
    budget: ''
  });
  const [editId, setEditId] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    const filtered = projects.filter(project =>
      project.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.departmentId?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProjects(filtered);
  }, [searchTerm, projects]);

  const fetchProjects = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API}/api/projects`, {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Cache-Control': 'no-cache'
        }
      });
      setProjects(response.data);
    } catch (err) {
      console.error('Failed to fetch projects', err);
      setError('Failed to load projects. Please try again.');
      if (err.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentProject({
      name: '',
      departmentId: '',
      startDate: '',
      endDate: '',
      budget: ''
    });
    setEditId(null);
  };

  const openAddModal = () => {
    setFormMode('add');
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (project) => {
    setFormMode('edit');
    setCurrentProject({
      name: project.name || '',
      departmentId: project.departmentId || '',
      startDate: project.startDate ? format(parseISO(project.startDate), 'yyyy-MM-dd') : '',
      endDate: project.endDate ? format(parseISO(project.endDate), 'yyyy-MM-dd') : '',
      budget: project.budget || ''
    });
    setEditId(project.id);
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentProject(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const { name, departmentId, startDate, endDate, budget } = currentProject;
    if (!name.trim()) return 'Project name is required';
    if (!departmentId.trim()) return 'Department ID is required';
    if (!startDate || !endDate) return 'Dates are required';
    if (new Date(startDate) > new Date(endDate)) return 'End date must be after start date';
    if (!budget || isNaN(budget)) return 'Budget must be a valid number';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      alert(validationError);
      return;
    }

    try {
      const config = {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      };

      if (formMode === 'add') {
        await axios.post(`${API}/api/projects`, currentProject, config);
        alert('Project added successfully');
      } else {
        await axios.put(`${API}/api/projects/${editId}`, currentProject, config);
        alert('Project updated successfully');
      }
      
      setShowModal(false);
      await fetchProjects(); // Refresh the list
    } catch (err) {
      console.error('Error submitting project', err);
      alert(err.response?.data?.error || 'Error saving project');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    
    try {
      await axios.delete(`${API}/api/projects/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert('Project deleted successfully');
      await fetchProjects();
    } catch (err) {
      console.error('Error deleting project', err);
      alert(err.response?.data?.error || 'Error deleting project');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return format(parseISO(dateString), 'dd MMM yyyy');
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '—';
    return format(parseISO(dateString), 'dd MMM yyyy, hh:mm a');
  };

  if (isLoading) return <div className="loading">Loading projects...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="employee-table-container">
      <div className="table-header">
        <h2>Project Management</h2>
        <div className="controls">
          <input
            type="text"
            className="search-bar"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="add-btn" onClick={openAddModal}>
            <FaPlus /> Add Project
          </button>
        </div>
      </div>

      <div className="table-responsive">
        <table className="employee-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Department</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Budget</th>
              <th>Created</th>
              <th>Updated</th>
              <th>Actions</th>
              <th>Team</th>
            </tr>
          </thead>
          <tbody>
            {filteredProjects.length > 0 ? (
              filteredProjects.map(project => (
                <tr key={project.id}>
                  <td>{project.name || '—'}</td>
                  <td>{project.departmentId || '—'}</td>
                  <td>{formatDate(project.startDate)}</td>
                  <td>{formatDate(project.endDate)}</td>
                  <td>{project.budget ? `$${parseFloat(project.budget).toLocaleString()}` : '—'}</td>
                  <td>{formatDateTime(project.createdAt)}</td>
                  <td>{formatDateTime(project.updatedAt)}</td>
                  <td className="actions">
                    <button 
                      className="icon-btn edit"
                      onClick={() => openEditModal(project)}
                      title="Edit"
                    >
                      <FaEdit />
                    </button>
                    <button
                      className="icon-btn delete"
                      onClick={() => handleDelete(project.id)}
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
                  </td>
                  <td>
                    <button
                      className="assign-btn"
                      onClick={() => {
                        setSelectedProject(project);
                        setShowAssigneesModal(true);
                      }}
                      title="Manage Team"
                    >
                      <FaUsers /> Assign
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="no-data">
                  {searchTerm ? 'No matching projects found' : 'No projects available'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Project Form Modal */}
      {showModal && (
        <ModalWrapper
          onClose={() => setShowModal(false)}
          title={`${formMode === 'add' ? 'Add New' : 'Edit'} Project`}
        >
          <form className="modal-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Project Name*</label>
              <input
                name="name"
                value={currentProject.name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Department ID*</label>
              <input
                name="departmentId"
                value={currentProject.departmentId}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Start Date*</label>
                <input
                  type="date"
                  name="startDate"
                  value={currentProject.startDate}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>End Date*</label>
                <input
                  type="date"
                  name="endDate"
                  value={currentProject.endDate}
                  onChange={handleInputChange}
                  min={currentProject.startDate}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Budget ($)*</label>
              <input
                type="number"
                name="budget"
                value={currentProject.budget}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                required
              />
            </div>

            <div className="form-actions">
              <button type="button" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button type="submit" className="primary">
                {formMode === 'add' ? 'Create Project' : 'Save Changes'}
              </button>
            </div>
          </form>
        </ModalWrapper>
      )}

      {/* Assignees Modal */}
      {showAssigneesModal && selectedProject && (
        <ModalWrapper
          title={`Manage Team: ${selectedProject.name}`}
          onClose={() => setShowAssigneesModal(false)}
          size="large"
        >
          <ProjectAssignee
            projectId={selectedProject.id}
            name={selectedProject.name}
            budget={selectedProject.budget}
            onClose={() => setShowAssigneesModal(false)}
            onUpdate={fetchProjects}
          />
        </ModalWrapper>
      )}
    </div>
  );
};

export default ProjectDirectory;