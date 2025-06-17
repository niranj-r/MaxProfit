import React, { useState, useEffect } from "react";
import "./FinancialYearManager.css";

const API_BASE_URL = "http://localhost:5000"; // Change if needed

const FinancialYearManager = () => {
    const [year, setYear] = useState("");
    const [financialYears, setFinancialYears] = useState([]);

    useEffect(() => {
        fetch(`${API_BASE_URL}/financial-years`)
            .then(res => res.json())
            .then(data => setFinancialYears(data))
            .catch(err => console.error("Failed to fetch:", err));
    }, []);

    const handleAdd = async () => {
        const startYear = parseInt(year);
        if (!startYear || isNaN(startYear)) return;

        const endYear = startYear + 1;
        const label = `${startYear}-${endYear}`;

        // Prevent duplicates
        if (financialYears.some(y => y.label === label)) {
            alert("This financial year already exists.");
            return;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/financial-years`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ start_year: startYear }) // Send only year
            });

            const newYear = await res.json();
            setFinancialYears(prev => [...prev, newYear]);
            setYear("");
        } catch (error) {
            console.error("Add error:", error);
        }
    };

    const handleDelete = async (id) => {
        try {
            await fetch(`${API_BASE_URL}/financial-years/${id}`, {
                method: "DELETE"
            });
            setFinancialYears(prev => prev.filter(year => year.id !== id));
        } catch (error) {
            console.error("Delete error:", error);
        }
    };

    return (
        <div className="fy-container">
            <h2>Financial Year Manager</h2>
            <div className="fy-input">
                <label>Start Year:</label>
                <input
                    type="number"
                    min="2000"
                    max="2100"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                />
                <button onClick={handleAdd}>Add</button>
            </div>

            <ul className="fy-list">
                {financialYears.map(year => {
                    const [startYearStr, endYearStr] = year.label.split("-");
                    const startDate = `Apr 1, ${startYearStr}`;
                    const endDate = `Mar 31, ${endYearStr}`;

                    return (
                        <li key={year.id} className="fy-item">
                            <span>
                                {startDate} – {endDate}
                            </span>
                            <div className="fy-actions">
                                <button className="manage-btn">Manage</button>
                                <button className="delete-btn" onClick={() => handleDelete(year.id)}>Delete</button>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

export default FinancialYearManager;
