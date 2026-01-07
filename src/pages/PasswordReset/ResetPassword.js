// src/pages/PasswordReset/ResetPassword.js
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './PasswordReset.css';

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get from OTP page
  const { email, resetToken } = location.state || {};

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();

  const passwordRegex = /^(?=.*[0-9])(?=.*[A-Z])(?=.*[a-z])(?=.*[^A-Za-z0-9]).{8,}$/;

  useEffect(() => {
    if (!resetToken) {
      navigate('/forgot-password', { replace: true });
    }
  }, [resetToken, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      setErr('Please fill in all fields');
      return;
    }

    if (newPassword.length < 8) {
      setErr('Password must be at least 8 characters long');
      return;
    }

    if (!passwordRegex.test(newPassword)) {
      setErr('Password must include an uppercase letter, lowercase letter, number, and special character.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErr('Passwords do not match');
      return;
    }

    setMsg('');
    setErr('');
    setLoading(true);

    try {
      // Send resetToken + passwords in request
      const result = await resetPassword(resetToken, newPassword, confirmPassword);
      
      if (result.success) {
        setMsg('Password reset successfully!');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setErr(result.message || 'Failed to reset password');
      }
    } catch (error) {
      setErr('Network error. Please try again.');
      console.error('Reset password error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-container">
      <div className="reset-card">
        <div className="reset-header">
          <div className="logo-section-reset">
            <img
              src="/hearingzen_logo.jpeg"
              alt="HearingZen"
              className="reset-logo"
            />
          </div>
          <h2>Set New Password</h2>
          <p>
            Create a new password for<br />
            <strong>{email}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="reset-form">
          {msg && (
            <div className="alert alert-success" role="alert">
              {msg}
            </div>
          )}
          {err && (
            <div className="alert alert-danger" role="alert">
              {err}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="newPassword" className="form-label">
              New Password
            </label>
            <div className="password-input-wrapper">
              <input
                type={showNewPassword ? 'text' : 'password'}
                id="newPassword"
                className="form-control"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
                required
                minLength={8}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowNewPassword(!showNewPassword)}
                disabled={loading}
              >
                {showNewPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <small className="form-text">
              Password must be at least 8 characters long, include an uppercase letter, lowercase letter, number, and special character.
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">
              Confirm Password
            </label>
            <div className="password-input-wrapper">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                className="form-control"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
                minLength={8}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={loading}
              >
                {showConfirmPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" />
                Resetting Password...
              </>
            ) : (
              'Reset Password'
            )}
          </button>
        </form>

        <div className="reset-footer">
          <Link to="/login" className="text-muted">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}