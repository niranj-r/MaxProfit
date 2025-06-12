import React, { useEffect, useState } from 'react';
import axios from 'axios';

const OrganisationsList = () => {
  const [organisations, setOrganisations] = useState([]);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const orgRes = await axios.get('http://localhost:5000/api/organisations');
        const deptRes = await axios.get('http://localhost:5000/api/departments');

        setOrganisations(orgRes.data);
        setDepartments(deptRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  // Calculate department count for each organisation
  const getDepartmentCount = (oid) => {
    return departments.filter(dept => dept.oid === oid).length;
  };

  return (
    <div>
      <h2>Organisations</h2>
      <table border="1" cellPadding="10" cellSpacing="0">
        <thead>
          <tr>
            <th>Organisation ID</th>
            <th>Name</th>
            <th>Number of Departments</th>
          </tr>
        </thead>
        <tbody>
          {organisations.map(org => (
            <tr key={org.oid}>
              <td>{org.oid}</td>
              <td>{org.name}</td>
              <td>{getDepartmentCount(org.oid)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OrganisationsList;
