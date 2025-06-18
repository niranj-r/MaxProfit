import React, { useState, useEffect } from "react";
import "./FinancialYearManager.css";
import Navbar from './Navbar';

const API = process.env.REACT_APP_API_BASE_URL;

const FinancialYearManager = () => {
    const [year, setYear] = useState("");
    const [financialYears, setFinancialYears] = useState([]);

    useEffect(() => {
        fetch(`${API}/financial-years`)
            .then(res => res.json())
            .then(data => setFinancialYears(data))
            .catch(err => console.error("Failed to fetch:", err));
    }, []);

    const handleAdd = async () => {
        const startYear = parseInt(year);
        if (!startYear || isNaN(startYear)) return;

        const endYear = startYear + 1;
        const label = `${startYear}-${endYear}`;

        if (financialYears.some(y => y.label === label)) {
            alert("This financial year already exists.");
            return;
        }

        try {
            const res = await fetch(`${API}/financial-years`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ start_year: startYear })
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.error || "Error adding financial year.");
                return;
            }

            setFinancialYears(prev => [...prev, data]);
            setYear("");
        } catch (error) {
            console.error("Add error:", error);
        }
    };


    const handleDelete = async (id) => {
        try {
            await fetch(`${API}/financial-years/${id}`, {
                method: "DELETE"
            });
            setFinancialYears(prev => prev.filter(year => year.id !== id));
        } catch (error) {
            console.error("Delete error:", error);
        }
    };

    return (
        <div className="financial-year-manager">
            <header className="dashboard-header">
                <Navbar />
            </header>

            <main className="fy-main-container">
                <section className="fy-box">
                    <h2 className="fy-title">Financial Year Manager</h2>

                    <div className="fy-form">
                        <label htmlFor="start-year">Start Year:</label>
                        <input
                            id="start-year"
                            type="number"
                            min="2000"
                            max="2100"
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                        />
                        <button className="fy-add-btn" onClick={handleAdd}>Add</button>
                    </div>

                    <ul className="fy-list">
                        {financialYears.map(year => {
                            const [startYearStr, endYearStr] = year.label.split("-");
                            const startDate = `Apr 1, ${startYearStr}`;
                            const endDate = `Mar 31, ${endYearStr}`;

                            return (
                                <li key={year.id} className="fy-list-item">
                                    <span className="fy-label">
                                        {startDate} – {endDate}
                                    </span>
                                    <div className="fy-buttons">
                                        <button className="fy-manage-btn">Manage</button>
                                        <button className="fy-delete-btn" onClick={() => handleDelete(year.id)}>Delete</button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </section>
            </main>
        </div>

    );
};

export default FinancialYearManager;