import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaTrash, FaEdit } from 'react-icons/fa'; // Make sure react-icons is installed

const DepartmentsList = () => {
  const [departments, setDepartments] = useState([]);
  const [organisations, setOrganisations] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ name: '', oid: '' });

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const deptRes = await axios.get('http://localhost:5000/api/departments');
      const orgRes = await axios.get('http://localhost:5000/api/organisations');
      setDepartments(deptRes.data);
      setOrganisations(orgRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const getOrganisationName = (oid) => {
    const org = organisations.find(org => org.oid === oid);
    return org ? org.name : 'Unknown';
  };

  const handleDelete = async (did) => {
    if (window.confirm("Are you sure you want to delete this department?")) {
      try {
        await axios.delete(`http://localhost:5000/api/departments/${did}`);
        fetchAll();
      } catch (err) {
        alert("Error deleting department");
      }
    }
  };

  const startEdit = (dept) => {
    setEditingId(dept.did);
    setEditData({ name: dept.name, oid: dept.oid });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({ name: '', oid: '' });
  };

  const handleEditSave = async () => {
    try {
      await axios.delete(`http://localhost:5000/api/departments/${editingId}`);
      await axios.post('http://localhost:5000/api/departments', {
        did: editingId,
        name: editData.name,
        oid: editData.oid
      });
      setEditingId(null);
      fetchAll();
    } catch (err) {
      alert("Error saving changes.");
    }
  };

  return (
    <div>
      <h2>Departments</h2>
      <table border="1" cellPadding="10" cellSpacing="0">
        <thead>
          <tr>
            <th>Department ID</th>
            <th>Department Name</th>
            <th>Organisation Name</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {departments.map(dept => (
            <tr key={dept.did}>
              <td>{dept.did}</td>
              <td>
                {editingId === dept.did ? (
                  <input
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  />
                ) : (
                  dept.name
                )}
              </td>
              <td>
                {editingId === dept.did ? (
                  <select
                    value={editData.oid}
                    onChange={(e) => setEditData({ ...editData, oid: e.target.value })}
                  >
                    {organisations.map(org => (
                      <option key={org.oid} value={org.oid}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  getOrganisationName(dept.oid)
                )}
              </td>
              <td>
                {editingId === dept.did ? (
                  <>
                    <button onClick={handleEditSave}>Save</button>
                    <button onClick={cancelEdit}>Cancel</button>
                  </>
                ) : (
                  <>
                    <FaEdit onClick={() => startEdit(dept)} style={{ cursor: 'pointer', marginRight: '10px' }} />
                    <FaTrash onClick={() => handleDelete(dept.did)} style={{ cursor: 'pointer' }} />
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DepartmentsList;
