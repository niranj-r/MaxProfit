import React, { useState, useEffect } from 'react';
import '../EmployeeDirectory.css';
import axios from 'axios';

const API = process.env.REACT_APP_API_BASE_URL;

const FAProjectDirectory = () => {
  const [projects, setProjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState('');
  const [projectCosts, setProjectCosts] = useState({});

  useEffect(() => {
    fetchProjects();
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (projects.length > 0) fetchProjectCosts();
  }, [projects]);

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
            <th>Budget ($)</th>
            <th>Total Revenue ($)</th>
          </tr>
        </thead>
        <tbody>
          {filteredProjects.map(proj => (
            <tr key={proj.id}>
              <td>{proj.name}</td>
              <td>{proj.departmentId}</td>
              <td>{proj.startDate?.substring(0, 10) || '—'}</td>
              <td>{proj.endDate?.substring(0, 10) || '—'}</td>
              <td>{proj.budget}</td>
              <td>{projectCosts[proj.id] || 0}</td>
            </tr>
          ))}
          {filteredProjects.length === 0 && (
            <tr><td colSpan="6" className="no-data">No matching projects found.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default FAProjectDirectory;
