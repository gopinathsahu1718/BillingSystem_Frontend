// src/pages/ChangePassword/ChangePassword.js
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import './ChangePassword.css';

const API_BASE = 'http://13.232.200.172/api/admin';

function ChangePassword() {
  const { token, loading: authLoading } = useAuth();

  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [activeField, setActiveField] = useState(null);

  const passwordRegex = /^(?=.*[0-9])(?=.*[A-Z])(?=.*[a-z])(?=.*[^A-Za-z0-9]).{8,}$/;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: '' });
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validate = () => {
    let err = {};

    if (!form.currentPassword) err.currentPassword = 'Current password is required';
    if (!form.newPassword) err.newPassword = 'New password is required';
    if (!form.confirmPassword) err.confirmPassword = 'Confirm password is required';

    if (form.newPassword && form.newPassword.length < 8) {
      err.newPassword = 'Password must be at least 8 characters long';
    }

    if (form.newPassword && !passwordRegex.test(form.newPassword)) {
      err.newPassword = 'Password must include an uppercase letter, lowercase letter, number, and special character.';
    }

    if (form.confirmPassword && form.newPassword !== form.confirmPassword) {
      err.confirmPassword = 'Passwords do not match';
    }

    if (form.currentPassword === form.newPassword) {
      err.newPassword = 'New password must be different';
    }

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const res = await fetch(`${API_BASE}/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });

      const data = await res.json();

      if (!data.success) throw new Error(data.message || 'Failed to change password');

      setSuccess(true);
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // === Breadcrumb Logic ===
  const getBreadcrumbText = () => {
    if (activeField) {
      const labels = { 
        currentPassword: 'Current Password', 
        newPassword: 'New Password', 
        confirmPassword: 'Confirm Password' 
      };
      return `Profile > ${labels[activeField] || activeField}`;
    }
    return 'Profile > Change Password';
  };

  const handleFocus = (field) => setActiveField(field);
  const handleBlur = () => setActiveField(null);

  if (authLoading) {
    return (
      <div className="change-password-page d-flex align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="change-password-page">
      <div className="page-header">
        <div className="header-content">
          <div className="header-text">
            <h2 className="page-title">
              <i className="bi bi-key-fill me-2"></i>
              Change Password
            </h2>
            <div className="profile-breadcrumb">
              <span className="page-subtitle">{getBreadcrumbText()}</span>
            </div>
          </div>
        </div>
      </div>

      {success && (
        <div className="save-success-msg">
          Password changed successfully!
        </div>
      )}

      {error && (
        <div className="alert alert-danger">{error}</div>
      )}

      <div className="profile-info-section">
        <div className="profile-layout">
          <div className="profile-content-section">
            <form className="profile-form" onSubmit={handleSubmit}>
              <div className="profile-field">
                <label>Current Password</label>
                <div className="password-wrapper">
                  <input
                    type={showPasswords.currentPassword ? "text" : "password"}
                    name="currentPassword"
                    value={form.currentPassword}
                    onChange={handleChange}
                    onFocus={() => handleFocus('currentPassword')}
                    onBlur={handleBlur}
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    className="toggle-password-btn"
                    onClick={() => togglePasswordVisibility('currentPassword')}
                    tabIndex="-1"
                  >
                    <i className={`bi ${showPasswords.currentPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
                  </button>
                </div>
                {errors.currentPassword && (
                  <span className="error-text">{errors.currentPassword}</span>
                )}
              </div>

              <div className="profile-field">
                <label>New Password</label>
                <div className="password-wrapper">
                  <input
                    type={showPasswords.newPassword ? "text" : "password"}
                    name="newPassword"
                    value={form.newPassword}
                    onChange={handleChange}
                    onFocus={() => handleFocus('newPassword')}
                    onBlur={handleBlur}
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    className="toggle-password-btn"
                    onClick={() => togglePasswordVisibility('newPassword')}
                    tabIndex="-1"
                  >
                    <i className={`bi ${showPasswords.newPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
                  </button>
                </div>
                {errors.newPassword && (
                  <span className="error-text">{errors.newPassword}</span>
                )}
              </div>

              <div className="profile-field">
                <label>Confirm New Password</label>
                <div className="password-wrapper">
                  <input
                    type={showPasswords.confirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    onFocus={() => handleFocus('confirmPassword')}
                    onBlur={handleBlur}
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    className="toggle-password-btn"
                    onClick={() => togglePasswordVisibility('confirmPassword')}
                    tabIndex="-1"
                  >
                    <i className={`bi ${showPasswords.confirmPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
                  </button>
                </div>
                {errors.confirmPassword && (
                  <span className="error-text">{errors.confirmPassword}</span>
                )}
              </div>

              <div className="profile-actions mt-4">
                <button
                  type="submit"
                  className="save-profile-btn"
                  disabled={loading}
                >
                  {loading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChangePassword;