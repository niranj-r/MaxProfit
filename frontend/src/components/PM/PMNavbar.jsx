import React from "react";
import { FaUserCircle } from "react-icons/fa";
import { NavLink } from "react-router-dom";
import "../Navbar.css";


const PMNavbar = () => {
    return (
        <nav className="navbar">
            <div className="navbar-left">
                <NavLink to="/admin-dashboard"><div className="logo"></div></NavLink>
                <ul className="nav-links">
                    <li>
                        <NavLink to="/pm-dashboard" className={({ isActive }) => isActive ? "active" : ""}>
                            Dashboard
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="/pm-project-dashboard" className={({ isActive }) => isActive ? "active" : ""}>
                            Projects
                        </NavLink>
                    </li>
                </ul>
            </div>
            <div className="profile-icon">
                <FaUserCircle />
            </div>
        </nav>
    );
};

export default PMNavbar;
