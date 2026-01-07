// src/pages/PasswordReset/ForgotPassword.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './PasswordReset.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const { forgotPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setErr('Please enter your email address');
      return;
    }

    setMsg('');
    setErr('');
    setLoading(true);

    const result = await forgotPassword(email);
    setLoading(false);

    if (result.success) {
      setMsg(result.message || 'OTP sent to your email.');

      // Pass resetInitToken to OTP page
      setTimeout(() => {
        navigate('/reset-otp', {
          state: {
            email,
            resetInitToken: result.resetInitToken
          }
        });
      }, 1000);
    } else {
      setErr(result.message || 'Failed to send OTP. Please try again.');
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
          <h2>Forgot Password</h2>
          <p>Enter your email address and we'll send you an OTP to reset your password</p>
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
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              className="form-control"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" />
                Sending OTP...
              </>
            ) : (
              'Send OTP'
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