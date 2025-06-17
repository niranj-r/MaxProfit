import React from "react";
import { FaUserCircle } from "react-icons/fa";
import { NavLink } from "react-router-dom";
import "./Navbar.css";

const Navbar = () => {
    return (
        <nav className="navbar">
            <div className="navbar-left">
                <NavLink to="/admin-dashboard"><div className="logo"></div></NavLink>
                <ul className="nav-links">
                    <li>
                        <NavLink to="/project-dashboard" className={({ isActive }) => isActive ? "active" : ""}>
                            Projects
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="/org-dashboard" className={({ isActive }) => isActive ? "active" : ""}>
                            Organisation
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="/dept-dashboard" className={({ isActive }) => isActive ? "active" : ""}>
                            Departments
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="/employee-dashboard" className={({ isActive }) => isActive ? "active" : ""}>
                            Users
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="/settings" className={({ isActive }) => isActive ? "active" : ""}>
                            Settings
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

export default Navbar;
