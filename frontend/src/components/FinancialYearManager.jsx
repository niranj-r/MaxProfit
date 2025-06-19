import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './FinancialYearManager.css';
import Navbar from './Navbar';

const API = process.env.REACT_APP_API_BASE_URL;

const FinancialYearManager = () => {
    const [year, setYear] = useState('');
    const [financialYears, setFinancialYears] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        fetchFinancialYears();
    }, []);

    const fetchFinancialYears = async () => {
        try {
            const res = await fetch(`${API}/financial-years`);
            const data = await res.json();
            setFinancialYears(data);
        } catch (err) {
            console.error('Failed to fetch:', err);
        }
    };

    const getCurrentFinancialYear = () => {
        const today = new Date();
        const year = today.getMonth() < 3 ? today.getFullYear() - 1 : today.getFullYear();
        return `${year}-${year + 1}`;
    };

    const currentFY = getCurrentFinancialYear();

    const handleAdd = async () => {
        const startYear = parseInt(year);
        if (!startYear || isNaN(startYear)) {
            alert('Please enter a valid start year.');
            return;
        }

        const endYear = startYear + 1;
        const label = `${startYear}-${endYear}`;

        if (financialYears.some(y => y.label === label)) {
            alert('This financial year already exists.');
            return;
        }

        try {
            const res = await fetch(`${API}/financial-years`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ start_year: startYear }),
            });

            const data = await res.json();
            if (!res.ok) {
                alert(data.error || 'Error adding financial year.');
                return;
            }

            setFinancialYears(prev => [...prev, data]);
            setYear('');
        } catch (error) {
            console.error('Add error:', error);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this financial year?')) return;

        try {
            await fetch(`${API}/financial-years/${id}`, { method: 'DELETE' });
            setFinancialYears(prev => prev.filter(y => y.id !== id));
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    return (
        <div className="f-dashboard">
            <div className="page-wrapper">
                <div className="f-dashboard-header">
                    <Navbar />
                </div>

                <div className="financial-card">
                    <div className="current-year-box">
                        <h2>Financial Year Manager</h2>
                        <div className="current-year-info">
                            <div className="icon-circle">
                                📆
                            </div>
                            <div className="current-year-text">
                                <span>Current Financial Year</span>
                                <strong>{currentFY}</strong>
                            </div>
                        </div>
                    </div>

                    <div className="fy-input">
                        <label htmlFor="start-year">Start Year:</label>
                        <input
                            id="start-year"
                            type="number"
                            min="2000"
                            max="2100"
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                            placeholder="e.g., 2024"
                        />
                        <button onClick={handleAdd}>Add</button>
                    </div>

                    <table className="financial-table">
                        <thead>
                            <tr>
                                <th>FY</th>
                                <th>Start Date</th>
                                <th>End Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {financialYears.length > 0 ? financialYears.map((fy) => {
                                const [start, end] = fy.label.split("-");
                                return (
                                    <tr key={fy.id}>
                                        <td>{fy.label}</td>
                                        <td>Apr 1, {start}</td>
                                        <td>Mar 31, {end}</td>
                                        <td>
                                            <div className="action-buttons">
                                                <button className="manage-btn" onClick={() => navigate(`/employee-financials/${fy.label}`)}>Manage</button>
                                                <button className="delete-btn" onClick={() => handleDelete(fy.id)}>Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan="4" className="no-data">No financial years available.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default FinancialYearManager;