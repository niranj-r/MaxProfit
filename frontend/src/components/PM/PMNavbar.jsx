import React,{ useState, useEffect } from "react";
import { FaUserCircle } from "react-icons/fa";
import { NavLink, useNavigate } from "react-router-dom";
import "../Navbar.css";


const PMNavbar = () => {
    const [showDropdown, setShowDropdown] = useState(false);
    const navigate = useNavigate();
    const [userName, setUserName] = useState('');

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
                <NavLink to="/pm-dashboard"><div className="logo"></div></NavLink>
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

export default PMNavbar;
