// src/pages/PasswordReset/ResetOtp.js
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './PasswordReset.css';

export default function ResetOtp() {
  const location = useLocation();
  const navigate = useNavigate();

  // Extract from state (passed from ForgotPassword)
  const { email } = location.state || {};
  const [resetInitToken, setResetInitToken] = useState(location.state?.resetInitToken);

  const [otp, setOtp] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const { verifyResetOtp, resendResetOtp } = useAuth();

  // If no token → go back
  useEffect(() => {
    if (!resetInitToken) {
      console.warn('No resetInitToken → redirecting');
      navigate('/forgot-password', { replace: true });
    }
  }, [resetInitToken, navigate]);

  const handleVerify = async (e) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      setErr('Please enter a valid 6-digit OTP');
      return;
    }

    setMsg('');
    setErr('');
    setLoading(true);

    try {
      const result = await verifyResetOtp(resetInitToken, otp);
      console.log('OTP Verification Result:', result);

      // In handleVerify, after successful verification:
if (result.success && result.token) {
    setMsg('OTP Verified!');
    setTimeout(() => {
        navigate('/reset-password', {
            state: {
                email,
                resetToken: result.token   // This will now be the passwordResetToken value
            }
        });
    }, 1000);
} else {
        setErr(result.message || 'Invalid OTP. Please try again.');
      }
    } catch (error) {
      setErr('Network error. Please try again.');
      console.error('OTP verify error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setMsg('');
    setErr('');
    setLoading(true);
    
    const result = await resendResetOtp(email);
    setLoading(false);
    
    if (result.success) {
      setMsg('New OTP sent to your email.');
      setResetInitToken(result.resetInitToken); // Update token
      setOtp(''); // Clear the OTP input
    } else {
      setErr(result.message || 'Failed to resend OTP.');
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
          <h2>Enter OTP</h2>
          <p>
            We sent a 6-digit code to<br />
            <strong>{email}</strong>
          </p>
        </div>

        <form onSubmit={handleVerify} className="reset-form">
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
            <label htmlFor="otp" className="form-label">
              OTP Code
            </label>
            <input
              type="text"
              id="otp"
              maxLength={6}
              className="form-control text-center"
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              disabled={loading}
              required
              autoComplete="off"
            />
            <small className="form-text">
              Enter the 6-digit code sent to your email
            </small>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={loading || otp.length !== 6}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" />
                Verifying...
              </>
            ) : (
              'Verify OTP'
            )}
          </button>
        </form>

        <div className="reset-footer d-flex justify-content-between align-items-center">
          <button
            type="button"
            className="btn btn-link p-0 text-decoration-none"
            onClick={handleResend}
            disabled={loading}
          >
            Resend OTP
          </button>
          <Link to="/login" className="text-muted">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}