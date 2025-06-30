// components/ViewAssigneesModal.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

const API = process.env.REACT_APP_API_BASE_URL;
const token = localStorage.getItem("token");

const authHeader = {
  headers: {
    Authorization: `Bearer ${token}`,
  },
};

const ViewAssigneesModal = ({ projectId }) => {
  const [assignees, setAssignees] = useState([]);

  useEffect(() => {
    const fetchAssignees = async () => {
      try {
        const res = await axios.get(`${API}/api/projects/${projectId}/assignees`, authHeader);
        setAssignees(res.data);
      } catch (err) {
        console.error("Failed to fetch assignees", err);
      }
    };
    fetchAssignees();
  }, [projectId]);

  return (
    <div>
      <h3>Assigned Members</h3>
      {assignees.length > 0 ? (
        <table className="assignee-table">
          <thead>
            <tr>
              <th>EID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Revenue ($)</th>
              <th>Cost ($)</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Allocation Percentage</th>
            </tr>
          </thead>
          <tbody>
            {assignees.map(emp => (
              <tr key={emp.eid}>
                <td>{emp.eid}</td>
                <td>{emp.fname} {emp.lname}</td>
                <td>{emp.email}</td>
                <td>{emp.role}</td>
                <td>{emp.cost ?? '—'}</td>
                <td>{emp.actual_cost ?? '—'}</td>
                <td>{emp.start_date ? new Date(emp.start_date).toLocaleDateString() : '—'}</td>
                <td>{emp.end_date ? new Date(emp.end_date).toLocaleDateString() : '—'}</td>
                <td>{emp.allocation_percentage ? `${emp.allocation_percentage}%` : '—  '}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No members assigned.</p>
      )}
    </div>
  );
};

export default ViewAssigneesModal;
