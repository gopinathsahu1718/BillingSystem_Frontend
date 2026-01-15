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
  const [toasts, setToasts] = useState([]);

  const storeName = storeType === 'swasthik' ? 'Swasthik' : 'Laxmi';

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

  const showToast = (type, title, description) => {
    const id = Date.now();
    setToasts([{ id, type, title, description }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
  };

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

  const capitalizeFirstLetter = (str) => {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const isIdentityNumber = (phone) => {
    if (!phone || phone.length !== 10) return false;
    const uniqueDigits = new Set(phone.split(''));
    if (uniqueDigits.size === 1) return true;
    
    let isSequential = true;
    for (let i = 1; i < phone.length; i++) {
      if (parseInt(phone[i]) !== parseInt(phone[i-1]) + 1) {
        isSequential = false;
        break;
      }
    }
    return isSequential;
  };

  const handleChange = (field, value) => {
    setProfile({ ...profile, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const handleStoreNameChange = (value) => {
    if (/^[a-zA-Z\s]*$/.test(value) && value.length <= 30) {
      const capitalizedValue = capitalizeFirstLetter(value);
      handleChange('storeName', capitalizedValue);
    }
  };

  const handleOwnerNameChange = (value) => {
    if (/^[a-zA-Z\s]*$/.test(value) && value.length <= 30) {
      const capitalizedValue = capitalizeFirstLetter(value);
      handleChange('ownerName', capitalizedValue);
    }
  };

  const handleAddressChange = (value) => {
    if (value.length <= 100) {
      const capitalizedValue = capitalizeFirstLetter(value);
      handleChange('address', capitalizedValue);
    }
  };

  const handleCityChange = (value) => {
    if (/^[a-zA-Z\s]*$/.test(value) && value.length <= 15) {
      handleChange('city', value);
    }
  };

  const handleStateChange = (value) => {
    if (/^[a-zA-Z\s]*$/.test(value) && value.length <= 15) {
      handleChange('state', value);
    }
  };

  const handlePincodeChange = (value) => {
    if (/^\d*$/.test(value) && value.length <= 6) {
      handleChange('pincode', value);
    }
  };

  const handleGstChange = (value) => {
    const alphanumeric = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (alphanumeric.length <= 15) {
      handleChange('gstNumber', alphanumeric);
    }
  };

  const handlePanChange = (value) => {
    const alphanumeric = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (alphanumeric.length <= 10) {
      handleChange('panNumber', alphanumeric);
    }
  };

  const validateProfile = () => {
    const newErrors = {};
    
    const trimmedStoreName = profile.storeName?.trim() || '';
    if (!trimmedStoreName) {
      newErrors.storeName = 'Store name is required';
    } else if (!/^[a-zA-Z\s]+$/.test(trimmedStoreName)) {
      newErrors.storeName = 'Store name can only contain letters and spaces';
    }
    
    const trimmedOwnerName = profile.ownerName?.trim() || '';
    if (!trimmedOwnerName) {
      newErrors.ownerName = 'Owner name is required';
    } else if (!/^[a-zA-Z\s]+$/.test(trimmedOwnerName)) {
      newErrors.ownerName = 'Owner name can only contain letters and spaces';
    }
    
    const emailRegex = /^[a-zA-Z][a-zA-Z0-9]*\.?[a-zA-Z0-9]*@[a-zA-Z]+\.[a-zA-Z]+$/;
    if (!profile.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(profile.email)) {
      newErrors.email = 'Invalid email format (e.g., abc@example.com or abc.xyz@example.com)';
    }
    
    if (!profile.phone) {
      newErrors.phone = 'Phone is required';
    } else if (!/^\d{10}$/.test(profile.phone)) {
      newErrors.phone = 'Phone must be 10 digits';
    } else if (!['9', '8', '7', '6'].includes(profile.phone[0])) {
      newErrors.phone = 'Phone must start with 9, 8, 7, or 6';
    } else if (isIdentityNumber(profile.phone)) {
      newErrors.phone = 'Invalid phone number (cannot be identity numbers like 9999999999)';
    }
    
    if (profile.alternatePhone) {
      if (!/^\d{10}$/.test(profile.alternatePhone)) {
        newErrors.alternatePhone = 'Alternate phone must be 10 digits';
      } else if (isIdentityNumber(profile.alternatePhone)) {
        newErrors.alternatePhone = 'Invalid phone number (cannot be identity numbers)';
      }
    }
    
    if (!profile.address?.trim()) {
      newErrors.address = 'Address is required';
    }
    
    const trimmedCity = profile.city?.trim() || '';
    if (!trimmedCity) {
      newErrors.city = 'City is required';
    } else if (!/^[a-zA-Z\s]+$/.test(trimmedCity)) {
      newErrors.city = 'City can only contain letters and spaces';
    }
    
    const trimmedState = profile.state?.trim() || '';
    if (!trimmedState) {
      newErrors.state = 'State is required';
    } else if (!/^[a-zA-Z\s]+$/.test(trimmedState)) {
      newErrors.state = 'State can only contain letters and spaces';
    }
    
    if (!profile.pincode) {
      newErrors.pincode = 'Pincode is required';
      showToast('error', 'Invalid Pincode', 'Pincode is required');
    } else if (!/^\d{6}$/.test(profile.pincode)) {
      newErrors.pincode = 'Pincode must be 6 digits';
      showToast('error', 'Invalid Pincode', 'Pincode must be 6 digits');
    }
    
    if (profile.gstNumber && profile.gstNumber.trim()) {
      if (!/^[A-Z0-9]{15}$/.test(profile.gstNumber)) {
        newErrors.gstNumber = 'Invalid GST Number (must be 15 alphanumeric characters)';
        showToast('error', 'Invalid GST Number', 'GST must be exactly 15 alphanumeric characters');
      }
    }
    
    if (profile.panNumber && profile.panNumber.trim()) {
      if (!/^[A-Z0-9]{10}$/.test(profile.panNumber)) {
        newErrors.panNumber = 'Invalid PAN Number (must be 10 alphanumeric characters)';
        showToast('error', 'Invalid PAN Number', 'PAN must be exactly 10 alphanumeric characters');
      }
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
        showToast('success', 'Success', 'Profile updated successfully!');
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(json.message || 'Failed to update profile');
        showToast('error', 'Error', json.message || 'Failed to update profile');
      }
    } catch (e) {
      console.error('Save profile error:', e);
      const errorMsg = `Failed to save: ${e.message}`;
      setError(errorMsg);
      showToast('error', 'Error', errorMsg);
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
    <>
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
              <p style={{ margin: '0.25rem 0' }}><strong>Bank:</strong> {profile.bankName || 'N/A'}</p>
              <p style={{ margin: '0.25rem 0' }}><strong>Account:</strong> {profile.accountNumber || 'N/A'}</p>
              <p style={{ margin: '0.25rem 0' }}><strong>IFSC:</strong> {profile.ifscCode || 'N/A'}</p>
              <p style={{ margin: '0.25rem 0' }}><strong>Branch:</strong> {profile.branchName || 'N/A'}</p>
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
                        onChange={(e) => handleStoreNameChange(e.target.value)}
                        className={errors.storeName ? 'input-error' : ''}
                      />
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                        {(profile.storeName || '').length}/30 characters
                      </div>
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
                        onChange={(e) => handleOwnerNameChange(e.target.value)}
                        className={errors.ownerName ? 'input-error' : ''}
                      />
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                        {(profile.ownerName || '').length}/30 characters
                      </div>
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
                        onChange={(e) => handleChange('email', e.target.value.toLowerCase())}
                        placeholder="abc@example.com"
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
                        placeholder="10 digits"
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
                    profile.alternatePhone || 'N/A'
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
                        onChange={(e) => handleAddressChange(e.target.value)}
                        className={errors.address ? 'input-error' : ''}
                      />
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                        {(profile.address || '').length}/100 characters
                      </div>
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
                        onChange={(e) => handleCityChange(e.target.value)}
                        className={errors.city ? 'input-error' : ''}
                      />
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                        {(profile.city || '').length}/15 characters
                      </div>
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
                        onChange={(e) => handleStateChange(e.target.value)}
                        className={errors.state ? 'input-error' : ''}
                      />
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                        {(profile.state || '').length}/15 characters
                      </div>
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
                        onChange={(e) => handlePincodeChange(e.target.value)}
                        placeholder="6 digits"
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
                        onChange={(e) => handleGstChange(e.target.value)}
                        placeholder="15 alphanumeric - Optional"
                        className={errors.gstNumber ? 'input-error' : ''}
                      />
                      {errors.gstNumber && <span className="error-text">{errors.gstNumber}</span>}
                    </>
                  ) : (
                    profile.gstNumber || 'N/A'
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
                        onChange={(e) => handlePanChange(e.target.value)}
                        placeholder="10 alphanumeric - Optional"
                        className={errors.panNumber ? 'input-error' : ''}
                      />
                      {errors.panNumber && <span className="error-text">{errors.panNumber}</span>}
                    </>
                  ) : (
                    profile.panNumber || 'N/A'
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast-notification ${toast.type}`}>
            <div className="toast-content">
              <span className="toast-icon"></span>
              <div className="toast-body">
                <div className="toast-title">{toast.title}</div>
                <div className="toast-description">{toast.description}</div>
              </div>
              <button
                className="toast-close"
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
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