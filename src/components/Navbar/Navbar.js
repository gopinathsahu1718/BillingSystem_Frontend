import React from 'react';
import './Navbar.css';

function Navbar({ activePage, sidebarOpen, setSidebarOpen }) {
  return (
    <header className="navbar-header bg-white border-bottom">
      <div className="container-fluid py-3">
        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-3">
            <button 
              className="btn btn-light d-lg-none"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <i className="bi bi-list fs-4"></i>
            </button>
            <div>
              <h1 className="h3 mb-1 d-none d-md-block">Admin</h1>
              <h1 className="h5 mb-1 d-md-none">Admin</h1>
              <nav aria-label="breadcrumb" className="d-none d-sm-block">
                <ol className="breadcrumb mb-0 small">
                  <li className="breadcrumb-item">
                    <a href="#" className="text-decoration-none">Home</a>
                  </li>
                  <li className="breadcrumb-item active" aria-current="page">
                    {activePage}
                  </li>
                </ol>
              </nav>
            </div>
          </div>
          <div className="d-flex gap-2 align-items-center">
            <button className="btn btn-light d-none d-sm-inline-block">
              <i className="bi bi-search"></i>
            </button>
            <button className="btn btn-light d-none d-md-inline-block">
              <i className="bi bi-gear"></i>
            </button>
            <div className="avatar bg-secondary rounded-circle">
                <img 
                    src="profile.webp" 
                    alt="Avatar" 
                    className="img-fluid rounded-circle" 
                    style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;