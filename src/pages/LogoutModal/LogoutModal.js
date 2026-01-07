import React from 'react';
import { useAuth } from '../../context/AuthContext';
import './LogoutModal.css';

function LogoutModal({ show, onCancel }) {
  const { logout } = useAuth();

  if (!show) return null;

  const handleLogout = () => {
    logout();
    onCancel();
  };

  return (
    <div className="logout-modal-overlay" onClick={onCancel}>
      <div className="logout-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-icon">
          <i className="bi bi-exclamation-circle text-warning"></i>
        </div>
        <h3 className="modal-title">Confirm Logout</h3>
        <p className="modal-message">
          Are you sure you want to logout? You will need to login again to access the admin panel.
        </p>
        <div className="modal-actions">
          <button
            className="btn btn-secondary btn-cancel"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="btn btn-danger btn-logout"
            onClick={handleLogout}
          >
            <i className="bi bi-box-arrow-right me-2"></i>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export default LogoutModal;