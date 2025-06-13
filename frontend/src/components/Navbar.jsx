import React from "react";
import { FaUserCircle } from "react-icons/fa";
import "./Navbar.css";
const Navbar = () => {
    return (
        <nav className="navbar">
            <div className="navbar-left">
                <div className="logo"></div>
                <ul className="nav-links">
                    <li><a href="/employee-dashboard">Manage Users</a></li>
                    <li><a href="/org-dashboard">Manage Organisation</a></li>
                    <li><a href="/dept-dashboard">Manage Departments</a></li>
                    <li><a href="/project-dashboard">Manage Projects</a></li>
                </ul>
            </div>
            <div className="profile-icon">
                <li><a href="/admin-dashboard"><FaUserCircle /></a></li>
            </div>
        </nav>
    );
};

export default Navbar;
