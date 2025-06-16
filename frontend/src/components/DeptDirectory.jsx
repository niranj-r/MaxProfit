import React, { useState, useEffect } from 'react';
import './EmployeeDirectory.css';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import axios from 'axios';
import ModalWrapper from './ModalWrapper';

const API = process.env.REACT_APP_API_BASE_URL;
const token = localStorage.getItem("token");
const authHeader = {
  headers: {
    Authorization: `Bearer ${token}`,
  },
};


const DepartmentDirectory = () => {
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formMode, setFormMode] = useState('add'); // 'add' or 'edit'
  const [currentDept, setCurrentDept] = useState({
    did: '',
    name: '',
    oid: '',
    managerId: ''
  });
  const [editId, setEditId] = useState(null); // stores `did` now, not `_id`

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const res = await axios.get(`${API}/api/departments`, authHeader);

      setDepartments(res.data);
    } catch (err) {
      console.error('Failed to fetch departments', err);
    }
  };

  const handleDelete = async (did) => {
    if (!window.confirm("Are you sure you want to delete this department?")) return;

    try {
      await axios.delete(`${API}/api/departments/${did}`, authHeader);
      setDepartments(prev => prev.filter(dept => dept.did !== did));
    } catch (err) {
      console.error("Failed to delete department", err);
      alert("Error deleting department.");
    }
  };

  const openAddModal = () => {
    setFormMode('add');
    setCurrentDept({ did: '', name: '', oid: '', managerId: '' });
    setShowModal(true);
  };

  const openEditModal = (dept) => {
    setFormMode('edit');
    setCurrentDept({
      did: dept.did,
      name: dept.name,
      oid: dept.oid,
      managerId: dept.managerId || ''
    });
    setEditId(dept.did); // use did instead of _id
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentDept((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentDept.did || !currentDept.name || !currentDept.oid || !currentDept.managerId) {
      alert("All fields are required.");
      return;
    }

    try {
      if (formMode === 'add') {
        const res = await axios.post(`${API}/api/departments`, currentDept, authHeader);
        setDepartments(prev => [...prev, { ...currentDept, _id: res.data._id || Math.random().toString() }]);
        alert("Department added.");
        fetchDepartments(); // Refresh list after adding
      } else {
        const res = await axios.put(
          `${API}/api/departments/${editId}`,
          currentDept, authHeader
        );
        setDepartments(prev =>
          prev.map(dept => dept.did === editId ? { ...dept, ...currentDept } : dept)
        );
        alert("Department updated.");
        fetchDepartments(); // Refresh list after updating
      }
      setShowModal(false);
    } catch (err) {
      console.error("Failed to submit department", err);
      alert("Error submitting department.");
    }
  };

  const convertToIST = (isoString) => {
    if (!isoString) return '-';
    const utcDate = new Date(isoString);

    const istOffset = 5.5 * 60;
    const istTime = new Date(utcDate.getTime() + istOffset * 60 * 1000);

    return istTime.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour12: true,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit'
    });
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
              <td>{dept.managerId || '—'}</td>
              <td>{convertToIST(dept.createdAt)}</td>
              <td>{convertToIST(dept.updatedAt)}</td>
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
          onClose={() => setShowModal(false)}
        >
          <form className="modal-form" onSubmit={handleSubmit}>
            <input
              name="did"
              placeholder="Department ID"
              value={currentDept.did}
              onChange={handleInputChange}
              disabled={formMode === 'edit'}
            />
            <input
              name="name"
              placeholder="Department Name"
              value={currentDept.name}
              onChange={handleInputChange}
            />
            <input
              name="oid"
              placeholder="Organisation ID"
              value={currentDept.oid}
              onChange={handleInputChange}
            />
            <input
              name="managerId"
              placeholder="Manager ID"
              value={currentDept.managerId}
              onChange={handleInputChange}
            />
            <button type="submit">{formMode === 'add' ? 'Add' : 'Update'}</button>
          </form>
        </ModalWrapper>
      )}

    </div>
  );
};

export default DepartmentDirectory;
