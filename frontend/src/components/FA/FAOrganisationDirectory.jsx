import React, { useState, useEffect } from 'react';
import '../EmployeeDirectory.css';
import axios from 'axios';

const API = process.env.REACT_APP_API_BASE_URL;

const FAOrganisationDirectory = () => {
  const [organisations, setOrganisations] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchOrganisations();
  }, []);

  const fetchOrganisations = async () => {
    try {
      const res = await axios.get(`${API}/api/organisations`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setOrganisations(res.data);
    } catch (err) {
      console.error('Failed to fetch organisations', err);
    }
  };

  const filteredOrganisations = organisations.filter(org =>
    (org.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="employee-table-container">
      <div className="table-header">
        <h2>Organisation Details</h2>
        <div className="controls">
          <input
            type="text"
            className="search-bar"
            placeholder="Search organisation..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <table className="employee-table">
        <thead>
          <tr>
            <th>Organisation ID</th>
            <th>Name</th>
          </tr>
        </thead>
        <tbody>
          {filteredOrganisations.length > 0 ? (
            filteredOrganisations.map(org => (
              <tr key={org.oid}>
                <td>{org.oid}</td>
                <td>{org.name}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="2" className="no-data">
                No matching organisations found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default FAOrganisationDirectory;
