import React from 'react';
import './MobileHeader.css';

function MobileHeader({ sidebarOpen, setSidebarOpen }) {
  return (
    <header className="mobile-header bg-white border-bottom d-lg-none">
      <div className="container-fluid">
        <div className="d-flex align-items-center justify-content-center py-3 position-relative">
          <button 
            className="btn btn-light menu-toggle position-absolute start-0"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            <i className="bi bi-list fs-4"></i>
          </button>
          
          <div className="d-flex align-items-center gap-2">
            <div className="logo-icon-mobile">
              <img
                className="rounded-3"
                src="hearingzen_logo.jpeg"
                alt="HearingZen"
                width="40"
                height="40"
              />
            </div>
            <div className="logo-text-mobile">
              <span className="company-name-mobile fw-semibold">HearingZen</span>
              <div className="admin-text-mobile">Admin</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default MobileHeader;