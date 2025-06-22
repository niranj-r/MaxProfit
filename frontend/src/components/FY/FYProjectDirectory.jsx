import React, { useState, useEffect } from 'react';
import '../EmployeeDirectory.css';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import Papa from 'papaparse';
import ModalWrapper from '../ModalWrapper';
import ProjectAssignee from './ProjectAssignees';

const API = process.env.REACT_APP_API_BASE_URL;

const FYProjectDirectory = () => {
  const [projects, setProjects] = useState([]);
  const [projectCosts, setProjectCosts] = useState({});
  const [search, setSearch] = useState('');
  const [showAssigneesModal, setShowAssigneesModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const { label: fyLabel } = useParams();

  useEffect(() => {
    fetchProjects();
  }, [fyLabel]);

  useEffect(() => {
    if (projects.length) fetchProjectCosts();
  }, [projects]);

  const fetchProjects = async () => {
    console.log('📌 Fetching all projects for FYLabel:', fyLabel);
    try {
      const [sy, ey] = fyLabel.split('-').map(Number);
      const fyStart = `${sy}-04-01`;
      const fyEnd = `${ey}-03-31`;

      const res = await axios.get(`${API}/api/projects/by-fy`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        params: { startDate: fyStart, endDate: fyEnd }
      });

      console.log('✔️ Projects received from backend:', res.data.length);
      setProjects(res.data);
    } catch (err) {
      console.error('❌ Failed to fetch projects', err);
    }
  };

  const fetchProjectCosts = async () => {
    const costs = {};
    for (const p of projects) {
      try {
        const res = await axios.get(`${API}/api/projects/${p.id}/total-cost`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        costs[p.id] = {
          totalCost: res.data.totalCost,
          actualCost: res.data.actualCost
        };
      } catch (err) {
        console.error('📉 Failed cost fetch for project', p.id, err);
      }
    }
    setProjectCosts(costs);
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
    link.setAttribute('download', `FY_${fyLabel}_Projects.csv`);
    link.click();
  };

  const handleAssigneesClick = (project) => {
    setSelectedProject(project);
    setShowAssigneesModal(true);
  };

  const filteredProjects = projects.filter(p =>
    (p.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="employee-table-container">
      <div className="table-header">
        <h2>Project Details - FY {fyLabel}</h2>
        <div className="controls">
          <input
            type="text"
            className="search-bar"
            placeholder="Search project..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button className="add-btn" onClick={handleDownloadCSV}>📥 Download CSV</button>
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
            <th>Assignees</th>
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
                <button className="assignees-btn" onClick={() => handleAssigneesClick(proj)}>
                  View Assignees
                </button>
              </td>
            </tr>
          ))}
          {filteredProjects.length === 0 && (
            <tr><td colSpan="8" className="no-data">No matching projects found.</td></tr>
          )}
        </tbody>
      </table>

      {showAssigneesModal && selectedProject && (
        <ModalWrapper
          title={`Project Assignees for "${selectedProject.name}"`}
          onClose={() => {
            setShowAssigneesModal(false);
            setSelectedProject(null);
          }}
        >
          <ProjectAssignee
            projectId={selectedProject.id}
            projectName={selectedProject.name}
            readOnly={true}
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

export default FYProjectDirectory;

