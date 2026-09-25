import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("bulkmail_token");
    localStorage.removeItem("bulkmail_admin");
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <span className="navbar-brand">Bulk Mailer</span>
      <div className="navbar-links">
        <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
          Compose
        </NavLink>
        <NavLink to="/history" className={({ isActive }) => (isActive ? "active" : "")}>
          History
        </NavLink>
        <button type="button" className="navbar-logout" onClick={handleLogout}>
          Sign out
        </button>
      </div>
    </nav>
  );
}
