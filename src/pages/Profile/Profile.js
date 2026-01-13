import React, { useState, useEffect } from 'react';
import { Building2, Mail, Phone, MapPin, CreditCard, Building, Save, Edit2, X, Camera, Loader, AlertCircle } from 'lucide-react';
import './Profile.css';
import { useAuth } from "../../context/AuthContext";

const API_BASE = 'http://13.232.200.172/api/store/profile';

const StoreProfileCard = ({ storeType, onEditingChange }) => {
  const { token } = useAuth();
  const [profile, setProfile] = useState(null);
  const [originalProfile, setOriginalProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  const storeName = storeType === 'swasthik' ? 'Swasthik' : 'Laxmi';

  // Notify parent component when editing state changes
  useEffect(() => {
    if (onEditingChange) {
      onEditingChange(editing);
    }
  }, [editing, onEditingChange]);

  useEffect(() => {
    if (token) {
      fetchProfile();
    }
  }, [storeType, token]);

  const fetchProfile = async () => {
    if (!token) {
      setError('Authentication token not found');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const res = await fetch(`${API_BASE}/${storeType}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const json = await res.json();
      
      if (json.success && json.data) {
        setProfile(json.data);
        setOriginalProfile(json.data);
      } else {
        setError(json.message || 'Failed to load profile');
      }
    } catch (e) {
      console.error('Fetch profile error:', e);
      setError(`Failed to fetch profile: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setProfile({ ...profile, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const validateProfile = () => {
    const newErrors = {};
    
    if (!profile.storeName?.trim()) newErrors.storeName = 'Store name is required';
    if (!profile.ownerName?.trim()) newErrors.ownerName = 'Owner name is required';
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!profile.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(profile.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (!profile.phone) {
      newErrors.phone = 'Phone is required';
    } else if (!/^\d{10}$/.test(profile.phone)) {
      newErrors.phone = 'Phone must be 10 digits';
    } else if (!['9', '8', '7', '6'].includes(profile.phone[0])) {
      newErrors.phone = 'Phone must start with 9, 8, 7, or 6';
    }
    
    if (profile.alternatePhone && !/^\d{10}$/.test(profile.alternatePhone)) {
      newErrors.alternatePhone = 'Alternate phone must be 10 digits';
    }
    
    if (!profile.address?.trim()) newErrors.address = 'Address is required';
    if (!profile.city?.trim()) newErrors.city = 'City is required';
    if (!profile.state?.trim()) newErrors.state = 'State is required';
    
    if (!profile.pincode) {
      newErrors.pincode = 'Pincode is required';
    } else if (!/^\d{6}$/.test(profile.pincode)) {
      newErrors.pincode = 'Pincode must be 6 digits';
    }
    
    if (profile.gstNumber && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(profile.gstNumber)) {
      newErrors.gstNumber = 'Invalid GST format';
    }
    
    if (profile.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(profile.panNumber)) {
      newErrors.panNumber = 'Invalid PAN format';
    }
    
    if (profile.accountNumber && !/^\d{9,18}$/.test(profile.accountNumber)) {
      newErrors.accountNumber = 'Account number must be 9-18 digits';
    }
    
    if (profile.ifscCode && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(profile.ifscCode)) {
      newErrors.ifscCode = 'Invalid IFSC format';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateProfile()) return;

    if (!token) {
      setError('Authentication token not found');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const updatePayload = {
        storeName: profile.storeName,
        ownerName: profile.ownerName,
        email: profile.email,
        phone: profile.phone,
        alternatePhone: profile.alternatePhone || null,
        address: profile.address,
        city: profile.city,
        state: profile.state,
        pincode: profile.pincode,
        gstNumber: profile.gstNumber || null,
        panNumber: profile.panNumber || null,
        bankName: profile.bankName || null,
        accountNumber: profile.accountNumber || null,
        ifscCode: profile.ifscCode || null,
        branchName: profile.branchName || null
      };

      const res = await fetch(`${API_BASE}/${storeType}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatePayload)
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const json = await res.json();
      
      if (json.success) {
        setOriginalProfile(profile);
        setEditing(false);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(json.message || 'Failed to update profile');
      }
    } catch (e) {
      console.error('Save profile error:', e);
      setError(`Failed to save: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setProfile(originalProfile);
    setEditing(false);
    setErrors({});
    setError(null);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Loader className="spinner" size={48} />
        <p>Loading {storeType} profile...</p>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="error-card">
        <AlertCircle className="error-icon" size={48} />
        <h3>Error Loading Profile</h3>
        <p>{error}</p>
        <button onClick={fetchProfile} className="retry-btn">Retry</button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="error-card">
        <AlertCircle className="error-icon" size={48} />
        <p>No profile data available</p>
      </div>
    );
  }

  return (
    <div className={`profile-card ${storeType}`}>
      <div className="profile-sidebar">
        <div className="store-name-header">
          <h2>{profile.storeName}</h2>
          <p className="store-subtitle">{profile.ownerName}</p>
        </div>
        
        <div className="store-type-badge">
          {storeType.toUpperCase()} STORE
        </div>

        <div className="sidebar-section">
          <h3>Store ID</h3>
          <p style={{ fontSize: '0.875rem', opacity: 0.9 }}>#{profile.id}</p>
        </div>

        <div className="sidebar-section">
          <h3>Bank Details</h3>
          <div style={{ fontSize: '0.875rem', opacity: 0.95 }}>
            <p style={{ margin: '0.25rem 0' }}><strong>Bank:</strong> {profile.bankName || 'Not provided'}</p>
            <p style={{ margin: '0.25rem 0' }}><strong>Account:</strong> {profile.accountNumber || 'Not provided'}</p>
            <p style={{ margin: '0.25rem 0' }}><strong>IFSC:</strong> {profile.ifscCode || 'Not provided'}</p>
            <p style={{ margin: '0.25rem 0' }}><strong>Branch:</strong> {profile.branchName || 'Not provided'}</p>
          </div>
        </div>
      </div>

      <div className="profile-main">
        {success && (
          <div className="success-banner">
            <Save size={20} />
            <span>Profile updated successfully!</span>
          </div>
        )}

        {error && (
          <div className="error-banner">
            <AlertCircle size={20} />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="close-error">
              <X size={16} />
            </button>
          </div>
        )}

        <div className="profile-header">
          <div className="profile-title">
            <h1>{profile.storeName}</h1>
            <p className="profile-subtitle">{storeType === 'swasthik' ? 'Swasthik Bookstore' : 'Laxmi Bookstore'}</p>
          </div>
          {!editing ? (
            <button onClick={() => setEditing(true)} className="edit-profile-btn">
              <Edit2 size={18} />
              Edit Profile
            </button>
          ) : (
            <div className="action-buttons">
              <button onClick={handleCancel} className="cancel-profile-btn" disabled={saving}>
                <X size={18} />
                Cancel
              </button>
              <button onClick={handleSave} className="save-profile-btn" disabled={saving}>
                {saving ? <Loader className="spinner-small" /> : <Save size={18} />}
                Save Changes
              </button>
            </div>
          )}
        </div>

        <div className="profile-content">
          <div className="info-grid">
            <div className="info-item">
              <div className="info-label">
                <Building2 size={16} />
                Store Name
              </div>
              <div className="info-value">
                {editing ? (
                  <>
                    <input
                      type="text"
                      value={profile.storeName || ''}
                      onChange={(e) => handleChange('storeName', e.target.value)}
                      className={errors.storeName ? 'input-error' : ''}
                    />
                    {errors.storeName && <span className="error-text">{errors.storeName}</span>}
                  </>
                ) : (
                  profile.storeName
                )}
              </div>
            </div>

            <div className="info-item">
              <div className="info-label">Owner Name</div>
              <div className="info-value">
                {editing ? (
                  <>
                    <input
                      type="text"
                      value={profile.ownerName || ''}
                      onChange={(e) => handleChange('ownerName', e.target.value)}
                      className={errors.ownerName ? 'input-error' : ''}
                    />
                    {errors.ownerName && <span className="error-text">{errors.ownerName}</span>}
                  </>
                ) : (
                  profile.ownerName
                )}
              </div>
            </div>

            <div className="info-item">
              <div className="info-label">
                <Mail size={16} />
                Email
              </div>
              <div className="info-value">
                {editing ? (
                  <>
                    <input
                      type="email"
                      value={profile.email || ''}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className={errors.email ? 'input-error' : ''}
                    />
                    {errors.email && <span className="error-text">{errors.email}</span>}
                  </>
                ) : (
                  profile.email
                )}
              </div>
            </div>

            <div className="info-item">
              <div className="info-label">
                <Phone size={16} />
                Phone
              </div>
              <div className="info-value">
                {editing ? (
                  <>
                    <input
                      type="tel"
                      value={profile.phone || ''}
                      onChange={(e) => {
                        if (/^\d{0,10}$/.test(e.target.value)) {
                          handleChange('phone', e.target.value);
                        }
                      }}
                      maxLength={10}
                      className={errors.phone ? 'input-error' : ''}
                    />
                    {errors.phone && <span className="error-text">{errors.phone}</span>}
                  </>
                ) : (
                  profile.phone
                )}
              </div>
            </div>

            <div className="info-item">
              <div className="info-label">Alternate Phone</div>
              <div className="info-value">
                {editing ? (
                  <>
                    <input
                      type="tel"
                      value={profile.alternatePhone || ''}
                      onChange={(e) => {
                        if (/^\d{0,10}$/.test(e.target.value)) {
                          handleChange('alternatePhone', e.target.value);
                        }
                      }}
                      maxLength={10}
                      placeholder="Optional"
                      className={errors.alternatePhone ? 'input-error' : ''}
                    />
                    {errors.alternatePhone && <span className="error-text">{errors.alternatePhone}</span>}
                  </>
                ) : (
                  profile.alternatePhone || 'Not provided'
                )}
              </div>
            </div>

            <div className="info-item full-width">
              <div className="info-label">
                <MapPin size={16} />
                Address
              </div>
              <div className="info-value">
                {editing ? (
                  <>
                    <textarea
                      value={profile.address || ''}
                      onChange={(e) => handleChange('address', e.target.value)}
                      className={errors.address ? 'input-error' : ''}
                    />
                    {errors.address && <span className="error-text">{errors.address}</span>}
                  </>
                ) : (
                  profile.address
                )}
              </div>
            </div>

            <div className="info-item">
              <div className="info-label">City</div>
              <div className="info-value">
                {editing ? (
                  <>
                    <input
                      type="text"
                      value={profile.city || ''}
                      onChange={(e) => handleChange('city', e.target.value)}
                      className={errors.city ? 'input-error' : ''}
                    />
                    {errors.city && <span className="error-text">{errors.city}</span>}
                  </>
                ) : (
                  profile.city
                )}
              </div>
            </div>

            <div className="info-item">
              <div className="info-label">State</div>
              <div className="info-value">
                {editing ? (
                  <>
                    <input
                      type="text"
                      value={profile.state || ''}
                      onChange={(e) => handleChange('state', e.target.value)}
                      className={errors.state ? 'input-error' : ''}
                    />
                    {errors.state && <span className="error-text">{errors.state}</span>}
                  </>
                ) : (
                  profile.state
                )}
              </div>
            </div>

            <div className="info-item">
              <div className="info-label">Pincode</div>
              <div className="info-value">
                {editing ? (
                  <>
                    <input
                      type="text"
                      value={profile.pincode || ''}
                      onChange={(e) => {
                        if (/^\d{0,6}$/.test(e.target.value)) {
                          handleChange('pincode', e.target.value);
                        }
                      }}
                      maxLength={6}
                      className={errors.pincode ? 'input-error' : ''}
                    />
                    {errors.pincode && <span className="error-text">{errors.pincode}</span>}
                  </>
                ) : (
                  profile.pincode
                )}
              </div>
            </div>

            <div className="info-item">
              <div className="info-label">
                <CreditCard size={16} />
                GST Number
              </div>
              <div className="info-value">
                {editing ? (
                  <>
                    <input
                      type="text"
                      value={profile.gstNumber || ''}
                      onChange={(e) => handleChange('gstNumber', e.target.value.toUpperCase())}
                      placeholder="22AAAAA0000A1Z5"
                      maxLength={15}
                      className={errors.gstNumber ? 'input-error' : ''}
                    />
                    {errors.gstNumber && <span className="error-text">{errors.gstNumber}</span>}
                  </>
                ) : (
                  profile.gstNumber || 'Not provided'
                )}
              </div>
            </div>

            <div className="info-item">
              <div className="info-label">PAN Number</div>
              <div className="info-value">
                {editing ? (
                  <>
                    <input
                      type="text"
                      value={profile.panNumber || ''}
                      onChange={(e) => handleChange('panNumber', e.target.value.toUpperCase())}
                      placeholder="ABCDE1234F"
                      maxLength={10}
                      className={errors.panNumber ? 'input-error' : ''}
                    />
                    {errors.panNumber && <span className="error-text">{errors.panNumber}</span>}
                  </>
                ) : (
                  profile.panNumber || 'Not provided'
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DualStoreProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const [swasthikEditing, setSwasthikEditing] = useState(false);
  const [laxmiEditing, setLaxmiEditing] = useState(false);

  if (authLoading) {
    return (
      <div className="store-container">
        <div className="loading-container">
          <Loader className="spinner" size={48} />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !['admin', 'main_admin'].includes(user.role)) {
    return (
      <div className="store-container">
        <div className="alert alert-danger">
          <AlertCircle size={32} />
          <div>
            <h3>Access Denied</h3>
            <p>Admin login required to view store profiles.</p>
          </div>
        </div>
      </div>
    );
  }

  // Determine breadcrumb text based on editing states
  let breadcrumbText = 'Store Profiles';
  if (swasthikEditing && laxmiEditing) {
    breadcrumbText = 'Edit Store Profiles';
  } else if (swasthikEditing) {
    breadcrumbText = 'Edit Swasthik Profile';
  } else if (laxmiEditing) {
    breadcrumbText = 'Edit Laxmi Profile';
  }

  return (
    <div className="store-container">
      <div className="store-page-header">
        <div className='store-header-content'>
          <div className='store-header-icon-title'>
            <Building2 size={32} />
            <h1>Store Profiles</h1>
          </div>
          <div className='store-header-breadcrumb'>
            <span>Profile</span>
            <span className='breadcrumb-separator'>&gt;</span>
            <span>{breadcrumbText}</span>
          </div>
        </div>
      </div>

      <div className="profiles-grid">
        <StoreProfileCard storeType="swasthik" onEditingChange={setSwasthikEditing} />
        <StoreProfileCard storeType="laxmi" onEditingChange={setLaxmiEditing} />
      </div>
    </div>
  );
};

export default DualStoreProfile;