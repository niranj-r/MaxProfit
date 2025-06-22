import React, { useState, useEffect } from "react";
import { FaUserCircle } from "react-icons/fa";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import "../Navbar.css";

const Navbar = () => {
    const [showDropdown, setShowDropdown] = useState(false);
    const [userName, setUserName] = useState('');
    const navigate = useNavigate();
    const { label } = useParams();  // ✅ Get FY label from URL

    useEffect(() => {
        const name = localStorage.getItem("userName");
        if (name) {
            setUserName(name);
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("userName");
        navigate("/");
    };

    return (
        <nav className="navbar">
            <div className="navbar-left">
                <NavLink to={`/financial-year/${label}`}>
                    <div className="logo"></div>
                </NavLink>
                <ul className="nav-links">
                    <li>
                        <NavLink to={`/financial-year/${label}`} className={({ isActive }) => isActive ? "active" : ""}>
                            Dashboard
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to={`/financial-year/${label}/projects`} className={({ isActive }) => isActive ? "active" : ""}>
                            Projects
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="/financial-year-manager" className={({ isActive }) => isActive ? "active" : ""}>
                            Back to Financial Years
                        </NavLink>
                    </li>
                </ul>
            </div>

            <div className="profile-dropdown-container">
                <FaUserCircle
                    className="profile-icon"
                    onClick={() => setShowDropdown(!showDropdown)}
                />
                {showDropdown && (
                    <div className="dropdown">
                        <p className="org-heading">
                            {userName ? `${userName}` : "Welcome"}
                        </p>
                        <button className="dropdown-logout" onClick={handleLogout}>Logout</button>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
