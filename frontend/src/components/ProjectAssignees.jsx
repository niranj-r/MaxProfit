import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ProjectAssignees.css';

const AVAILABLE_ROLES = ['Developer', 'Tester', 'Project Manager'];

const API = process.env.REACT_APP_API_BASE_URL;

const ProjectAssignees = ({ projectId, name, budget, onClose }) => {
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [assignees, setAssignees] = useState([]);
  const [pending, setPending] = useState(null);
  const [selectedRole, setSelectedRole] = useState(AVAILABLE_ROLES[0]);

  // For /api/assign-task
  const [userId, setUserId] = useState('');
  const [percentage, setPercentage] = useState('');
  const [billingRate, setBillingRate] = useState('');

  useEffect(() => {
    if (projectId) fetchAssignees();
  }, [projectId]);

  const fetchAssignees = async () => {
    try {
      const res = await axios.get(`${API}/api/projects/${projectId}/assignees`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      setAssignees(res.data);
    } catch (err) {
      console.error('Failed to fetch assignees', err);
    }
  };

  const handleSearch = async e => {
    const q = e.target.value;
    setSearch(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await axios.get(`${API}/api/search/users`, {
        params: { q },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      setSearchResults(res.data.filter(emp => emp && emp.eid && emp.fname && emp.lname));
    } catch (err) {
      console.error('Search error', err);
    }
  };

  const startAdd = emp => {
    setPending(emp);
    const hasPM = assignees.some(a => a.role === 'Project Manager');
    setSelectedRole(hasPM ? AVAILABLE_ROLES[0] : 'Project Manager');
  };

  const cancelAdd = () => {
    setPending(null);
  };

  const confirmAdd = async () => {
    if (!pending) return;
    try {
      await axios.post(
        `${API}/api/projects/${projectId}/assignees`,
        { eid: pending.eid, role: selectedRole },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      setAssignees(a => [...a, { ...pending, role: selectedRole }]);
      setPending(null);
      setSearch('');
      setSearchResults([]);
    } catch (err) {
      console.error('Add error', err);
    }
  };

  const removeAssignee = async emp => {
    try {
      await axios.delete(
        `${API}/api/projects/${projectId}/assignees/${emp.eid}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setAssignees(a => a.filter(x => x.eid !== emp.eid));
    } catch (err) {
      console.error('Remove error', err);
    }
  };

  const assignTask = async () => {
    if (!userId || !percentage || !billingRate) {
      alert('Please fill in all task assignment fields.');
      return;
    }

    const payload = {
      project_id: parseInt(projectId),
      assignments: [
        {
          user_id: parseInt(userId),
          percentage: parseFloat(percentage),
          billing_rate: parseFloat(billingRate)
        }
      ]
    };

    try {
      await axios.post(`${API}/api/assign-task`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      alert('User task assigned successfully!');
      setUserId('');
      setPercentage('');
      setBillingRate('');
    } catch (err) {
      console.error('Task assign error:', err.response?.data || err);
      alert('Failed to assign task.');
    }
  };

  const hasPM = assignees.some(a => a.role === 'Project Manager');

  return (
    <div className="assignee-page">
      <div className="search-container">
        <input
          type="text"
          placeholder="Search employees…"
          value={search}
          onChange={handleSearch}
          className="search-bar-assign"
        />

        {!pending && searchResults.length > 0 && (
          <ul className="search-dropdown">
            {searchResults.map(emp => (
              <li key={emp.eid} onClick={() => startAdd(emp)}>
                {emp.fname} {emp.lname} ({emp.eid})
              </li>
            ))}
          </ul>
        )}

        {pending && (
          <div className="assign-panel">
            <span>
              Assign <strong>{pending.fname} {pending.lname}</strong> as:
            </span>
            <select
              value={selectedRole}
              onChange={e => setSelectedRole(e.target.value)}
            >
              {AVAILABLE_ROLES.map(r => (
                <option
                  key={r}
                  value={r}
                  disabled={r === 'Project Manager' && hasPM}
                >
                  {r}
                </option>
              ))}
            </select>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
              <button className="confirm-btn" onClick={confirmAdd}>Add</button>
              <button className="cancel-btn" onClick={cancelAdd}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      <h3>Assigned Members:</h3>
      {assignees.length > 0 ? (
        <table className="assignee-table">
          <thead>
            <tr>
              <th>EID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Remove</th>
            </tr>
          </thead>
          <tbody>
            {assignees.map(emp => (
              <tr key={emp.eid}>
                <td>{emp.eid}</td>
                <td>{emp.fname} {emp.lname}</td>
                <td>{emp.email}</td>
                <td>{emp.role}</td>
                <td>
                  <button className="remove-btn" onClick={() => removeAssignee(emp)}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No members assigned yet.</p>
      )}

      <hr style={{ margin: '20px 0' }} />

      <div className="task-assignment-section">
        <h3>Assign Task to User</h3>
        <div className="task-form">
          <input
            type="number"
            placeholder="User ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
          <input
            type="number"
            placeholder="Percentage"
            value={percentage}
            onChange={(e) => setPercentage(e.target.value)}
          />
          <input
            type="number"
            placeholder="Billing Rate"
            value={billingRate}
            onChange={(e) => setBillingRate(e.target.value)}
          />
          <button onClick={assignTask}>Assign Task</button>
        </div>
      </div>
    </div>
  );
};

export default ProjectAssignees;


