import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import axios from 'axios';
import ModalWrapper from './ModalWrapper'; // update path as per your project


const OrganisationDirectory = () => {
  const [organisations, setOrganisations] = useState([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newOrg, setNewOrg] = useState({ name: '', oid: '' });

  useEffect(() => {
    fetchOrganisations();
  }, []);

  const fetchOrganisations = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/organisations');
      setOrganisations(res.data);
    } catch (err) {
      console.error('Failed to fetch organisations', err);
    }
  };

  const handleDelete = async (oid) => {
    if (!window.confirm('Are you sure you want to delete this organisation?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/organisations/${oid}`);
      setOrganisations(prev => prev.filter(o => o.oid !== oid));
      alert('Organisation deleted successfully');
    } catch (err) {
      console.error('Delete error', err);
      alert('Error deleting organisation');
    }
  };

  const handleEdit = async (oid) => {
    const org = organisations.find(o => o.oid === oid);
    if (!org) return alert("Organisation not found");

    const name = prompt("Edit organisation name", org.name);
    if (!name) {
      alert("Name cannot be empty.");
      return;
    }

    try {
      const res = await axios.put(`http://localhost:5000/api/organisations/${oid}`, { name });
      setOrganisations(prev =>
        prev.map(o => (o.oid === oid ? res.data : o))
      );
      alert("Organisation updated successfully");
    } catch (err) {
      console.error("Update error", err);
      alert("Error updating organisation");
    }
  };

  const convertToIST = (utcDateStr) => {
    if (!utcDateStr) return '—';
    const date = new Date(utcDateStr + "Z");
    const istOffset = 5 * 60 + 30;
    const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
    const istTime = new Date(utc + istOffset * 60000);
    const year = istTime.getFullYear();
    const month = String(istTime.getMonth() + 1).padStart(2, '0');
    const day = String(istTime.getDate()).padStart(2, '0');
    const hours = String(istTime.getHours()).padStart(2, '0');
    const minutes = String(istTime.getMinutes()).padStart(2, '0');
    const seconds = String(istTime.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    if (!newOrg.name || !newOrg.oid) {
      alert("All fields are required.");
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/api/organisations", newOrg);
      setOrganisations(prev => [...prev, res.data]);
      alert("Organisation added successfully!");
      setNewOrg({ name: '', oid: '' });
      setIsModalOpen(false);
    } catch (err) {
      console.error("Add error", err);
      alert("Error adding organisation");
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
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="add-btn" onClick={() => setIsModalOpen(true)}>
            <FaPlus /> Add Organisation
          </button>
        </div>
      </div>

      <table className="employee-table">
        <thead>
          <tr>
            <th>Organisation ID</th>
            <th>Name</th>
            <th>Created At (IST)</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredOrganisations.map(org => (
            <tr key={org.oid}>
              <td>{org.oid}</td>
              <td>{org.name}</td>
              <td>{convertToIST(org.createdAt)}</td>
              <td>
                <FaEdit className="icon edit-icon" onClick={() => handleEdit(org.oid)} />
                <FaTrash className="icon delete-icon" onClick={() => handleDelete(org.oid)} />
              </td>
            </tr>
          ))}
          {filteredOrganisations.length === 0 && (
            <tr>
              <td colSpan="4" className="no-data">No matching organisations found.</td>
            </tr>
          )}
        </tbody>
      </table>

      {isModalOpen && (
        <ModalWrapper onClose={() => setIsModalOpen(false)}>
          <form onSubmit={handleModalSubmit} className="modal-form">
            <h3>Add Organisation</h3>
            <input
              type="text"
              placeholder="Organisation ID"
              value={newOrg.oid}
              onChange={(e) => setNewOrg({ ...newOrg, oid: e.target.value })}
            />
            <input
              type="text"
              placeholder="Organisation Name"
              value={newOrg.name}
              onChange={(e) => setNewOrg({ ...newOrg, name: e.target.value })}
            />
            <button type="submit">Add</button>
          </form>
        </ModalWrapper>
      )}
    </div>
  );
};

export default OrganisationDirectory;
