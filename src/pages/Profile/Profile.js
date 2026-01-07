// src/pages/Profile.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import './Profile.css';

const API_BASE = 'https://api.hearingzen.in/api/user';

function Profile() {
  const { user: authUser, token, loading: authLoading } = useAuth();

  const [profile, setProfile] = useState({
    username: '',
    email: '',
    contact: '',
  });
  const [originalProfile, setOriginalProfile] = useState({});
  const [editing, setEditing] = useState(false);
  const [activeField, setActiveField] = useState(null);
  const [errors, setErrors] = useState({});
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // === API Helper ===
  const api = async (path, opts = {}) => {
    if (!token) throw new Error('No token');
    const res = await fetch(`${API_BASE}${path}`, {
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...opts.headers,
      },
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'API error');
    return json;
  };

  // === Fetch Profile ===
  useEffect(() => {
    if (!token || authLoading) return;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await api('/profile');
        const { username, email, contact } = data;

        const normalized = { username, email, contact: contact || '' };
        setProfile(normalized);
        setOriginalProfile(normalized);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [token, authLoading]);

  // === Input Change ===
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'contact') {
      if (!/^\d{0,10}$/.test(value)) return;
      if (value.length > 0 && !['9', '8', '7', '6'].includes(value.charAt(0))) return;
    }

    if (name === 'username') {
      const emojiRegex = /[^a-zA-Z\s]/;
      if (emojiRegex.test(value)) return;
    }

    setProfile({ ...profile, [name]: value });
  };

  const handleEdit = () => setEditing(true);
  const handleFocus = (field) => editing && setActiveField(field);
  const handleBlur = () => setActiveField(null);

  // === Save to API ===
  const handleSave = async () => {
    let newErrors = {};

    if (!profile.username?.trim()) newErrors.username = 'Name is required';
    if (!profile.contact) newErrors.contact = "Contact can't be empty";
    if (profile.contact && profile.contact.length !== 10) {
      newErrors.contact = 'Contact must be exactly 10 digits';
    }
    if (profile.contact && !['9', '8', '7', '6'].includes(profile.contact[0])) {
      newErrors.contact = 'Must start with 9, 8, 7, or 6';
    }

    if (profile.username) {
      const name = profile.username.trim();
      const hasEmoji = /[^a-zA-Z\s]/.test(name);
      if (hasEmoji) {
        newErrors.username = 'No emojis or special characters';
      } else {
        const words = name.split(' ').filter(w => w);
        const isProperCase = words.every(w => w[0] === w[0].toUpperCase() && w.slice(1) === w.slice(1).toLowerCase());
        const isAllUpper = name === name.toUpperCase();
        const isAllLower = name === name.toLowerCase();

        if (!isProperCase && !isAllUpper && !isAllLower) {
          newErrors.username = 'Use proper case, all caps, or all lowercase';
        }
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    try {
      setLoading(true);
      await api('/profile', {
        method: 'PUT',
        body: JSON.stringify({
          username: profile.username,
          contact: profile.contact,
        }),
      });

      setOriginalProfile(profile);
      setEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (e) {
      setError('Failed to update profile: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  // === Breadcrumb ===
  const getBreadcrumbText = () => {
    if (!editing) return 'Manage your account settings and personal information';
    if (activeField) {
      const labels = { username: 'Name', contact: 'Mobile Number' };
      return `Profile > Edit > ${labels[activeField] || activeField}`;
    }
    return 'Profile > Edit';
  };

  // === Loading / Access Denied ===
  if (authLoading || loading) {
    return (
      <div className="profile-page d-flex align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!token || !authUser || !['admin', 'main_admin'].includes(authUser.role)) {
    return (
      <div className="profile-page p-4">
        <div className="alert alert-danger">Access denied. Admin login required.</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-page p-4">
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="page-header">
        <div className="header-content">
          <div className="header-text">
            <h2 className="page-title">
              <i className="bi bi-person-circle me-2"></i>
              Profile
            </h2>
            <div className="profile-breadcrumb">
              <span className="page-subtitle">{getBreadcrumbText()}</span>
            </div>
          </div>
        </div>
      </div>

      {saveSuccess && <div className="save-success-msg">Profile saved successfully!</div>}

      <div className="profile-info-section">
        <div className="profile-layout">
          {/* === Placeholder Image Section === */}
          <div className="profile-photo-section">
            <div className="profile-info">
              <h2 className="profile-name">{profile.username}</h2>
            </div>
            <div className="photo-container">
              <img
                src="/profile.webp"
                alt="Profile"
                className="profile-photo"
              />
            </div>
          </div>

          {/* === Form Fields === */}
          <div className="profile-content-section">
            <form className="profile-form" onSubmit={e => e.preventDefault()}>
              <div className="profile-field">
                <label>Name</label>
                <input
                  type="text"
                  name="username"
                  value={profile.username}
                  onChange={handleChange}
                  onFocus={() => handleFocus('username')}
                  onBlur={handleBlur}
                  disabled={!editing}
                />
                {errors.username && <span className="error-text">{errors.username}</span>}
              </div>

              <div className="profile-field">
                <label>Email account</label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                />
              </div>

              <div className="profile-field">
                <label>Mobile number</label>
                <input
                  type="text"
                  name="contact"
                  value={profile.contact}
                  onChange={handleChange}
                  onFocus={() => handleFocus('contact')}
                  onBlur={handleBlur}
                  disabled={!editing}
                  placeholder="Add number"
                  maxLength={10}
                  inputMode="numeric"
                />
                {errors.contact && <span className="error-text">{errors.contact}</span>}
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="profile-actions">
        {!editing ? (
          <button type="button" className="profile-edit-btn" onClick={handleEdit}>
            Edit Profile
          </button>
        ) : (
          <button type="button" className="profile-save-btn" onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </button>
        )}
      </div>
    </div>
  );
}

export default Profile;