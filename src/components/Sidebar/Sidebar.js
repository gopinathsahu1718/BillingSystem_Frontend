import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import './Sidebar.css';

function Sidebar({ handleLogout, sidebarOpen, setSidebarOpen }) {
  const location = useLocation();
  const closeSidebar = () => setSidebarOpen(false);

  // Helper function to check if a path is active
  const isPathActive = (path) => {
    if (path === '/profile') {
      // Profile is active only on exact /profile, not on sub-routes
      return location.pathname === '/profile';
    }
    return location.pathname === path;
  };

  return (
    <div className={`sidebar bg-white border-end ${sidebarOpen ? 'open' : ''}`}>
      <div className="logo-section p-4 border-bottom">
        <div className="d-flex align-items-center gap-3">
          <div className="logo-icon text-white rounded d-flex align-items-center justify-content-center">
            <span className="fw-bold fs-4">
              <img
                className="rounded-3"
                src="hearingzen_logo.jpeg"
                alt="HearingZen"
                width="50"
                height="50"
              />
            </span>
          </div>
          <div className="logo-text">
            <span className="company-name fs-5 fw-semibold">Billing System</span>
            <div className="admin-text">Admin</div>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav p-3">
        <ul className="nav flex-column gap-1">
          <li className="nav-item">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `nav-link ${isActive ? 'active' : ''}`
              }
              onClick={closeSidebar}
            >
              <i className="bi bi-speedometer2 me-3"></i>
              Dashboard
            </NavLink>
          </li>

          <li className="nav-item">
            <NavLink
              to="/store-management"
              className={({ isActive }) =>
                `nav-link ${isActive ? 'active' : ''}`
              }
              onClick={closeSidebar}
            >
              <i className="bi bi-shop me-3"></i>
              Store Management
            </NavLink>
          </li>

          <li className="nav-item">
            <NavLink
              to="/products"
              className={({ isActive }) =>
                `nav-link ${isActive ? 'active' : ''}`
              }
              onClick={closeSidebar}
            >
              
              <i className="bi bi-receipt me-3"></i>
              Product selection
            </NavLink>
          </li>
          
          <li className="nav-item">
            <NavLink
              to="/cart"
              className={({ isActive }) =>
                `nav-link ${isActive ? 'active' : ''}`
              }
              onClick={closeSidebar}
            >
              <i className="bi bi-cart3 me-3"></i>
              Cart
            </NavLink>
          </li>

          <li className="nav-item">
            <NavLink
              to="/billing-report"
              className={({ isActive }) =>
                `nav-link ${isActive ? 'active' : ''}`
              }
              onClick={closeSidebar}
            >
              <i className="bi bi-file-earmark-bar-graph me-3"></i>
              Billing Reports
            </NavLink>
          </li>

          

          <li className="nav-item">
            <NavLink
              to="/profile"
              className={`nav-link ${isPathActive('/profile') ? 'active' : ''}`}
              onClick={closeSidebar}
              end
            >
              <i className="bi bi-person me-3"></i>
              Profile
            </NavLink>
          </li>

          <li className="nav-item">
            <NavLink
              to="/profile/change-password"
              className={`nav-link ${isPathActive('/profile/change-password') ? 'active' : ''}`}
              onClick={closeSidebar}
            >
              <i className="bi bi-key me-3"></i>
              Change Password
            </NavLink>
          </li>

          <li className="nav-item mt-3">
            <button
              className="nav-link text-danger"
              onClick={() => {
                handleLogout();
                closeSidebar();
              }}
            >
              <i className="bi bi-box-arrow-right me-3"></i>
              Logout
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}

export default Sidebar;