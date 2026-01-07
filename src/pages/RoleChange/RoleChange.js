// src/pages/RoleChange.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import './RoleChange.css';

const API_BASE = 'https://api.hearingzen.in/api/admin';
const USER_API_BASE = 'https://api.hearingzen.in/api/user';
const PAGE_SIZE = 10;

function RoleChange() {
  const { token, user: authUser, loading: authLoading } = useAuth();

  // UI States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [verifyFilter, setVerifyFilter] = useState('all');
  const [showVerifyDropdown, setShowVerifyDropdown] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState('user');
  const [toasts, setToasts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  // Data States
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loggedInUserId, setLoggedInUserId] = useState(null);
  const [loggedInUser, setLoggedInUser] = useState(null);

  // === FIXED: Pagination logic moved here (before any early return) ===
  const processedUsers = useMemo(() => {
    let list = [...users];
    const q = searchQuery.toLowerCase();

    list = list.filter(user => {
      const matchesSearch =
        user.id.toLowerCase().includes(q) ||
        user.username.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q);

      const matchesRole =
        selectedFilter === 'all' ||
        (selectedFilter === 'admin' && (user.role === 'admin' || user.role === 'main_admin')) ||
        (selectedFilter === 'user' && user.role === 'user');

      const matchesVerify =
        verifyFilter === 'all' ||
        (verifyFilter === 'verified' && user.isVerified) ||
        (verifyFilter === 'unverified' && !user.isVerified);

      return matchesSearch && matchesRole && matchesVerify;
    });

    if (loggedInUser && loggedInUserId) {
      const ownIndex = list.findIndex(u => u.id === loggedInUserId);
      const ownShouldBeVisible =
        loggedInUser.username.toLowerCase().includes(q) &&
        (selectedFilter === 'all' ||
          (selectedFilter === 'admin' && (loggedInUser.role === 'admin' || loggedInUser.role === 'main_admin')) ||
          (selectedFilter === 'user' && loggedInUser.role === 'user')) &&
        (verifyFilter === 'all' ||
          (verifyFilter === 'verified' && loggedInUser.isVerified) ||
          (verifyFilter === 'unverified' && !loggedInUser.isVerified));

      if (ownIndex > -1) {
        list.splice(ownIndex, 1);
        list.unshift(loggedInUser);
      } else if (ownShouldBeVisible) {
        list.unshift(loggedInUser);
      }
    }

    return list;
  }, [users, searchQuery, selectedFilter, verifyFilter, loggedInUser, loggedInUserId]);

  const totalPages = Math.ceil(processedUsers.length / PAGE_SIZE);

  const goToPage = useCallback((page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  const startIdx = (currentPage - 1) * PAGE_SIZE;
  const paginatedUsers = processedUsers.slice(startIdx, startIdx + PAGE_SIZE);

  useEffect(() => setCurrentPage(1), [searchQuery, selectedFilter, verifyFilter]);
  // ====================================================================

  // API Helper
  const api = useCallback(
    async (path, opts = {}) => {
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
    },
    [token]
  );

  // Fetch Logged-in User Profile
  useEffect(() => {
    if (authLoading || !token) return;

    (async () => {
      try {
        const res = await fetch(`${USER_API_BASE}/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        const json = await res.json();
        if (json.success) {
          const me = json.data;
          setLoggedInUserId(me._id);
          setLoggedInUser({
            id: me._id,
            username: me.username,
            email: me.email,
            role: me.role,
            isVerified: me.isVerified,
            profilePhotoUrl: me.profilePhotoUrl || '',
          });
        }
      } catch (e) {
        console.error('Failed to fetch own profile:', e);
      }
    })();
  }, [authLoading, token]);

  // Fetch All Users
  useEffect(() => {
    if (authLoading || !token) return;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await api('/users');

        const normalised = data.map(u => ({
          id: u._id,
          username: u.username,
          email: u.email,
          role: u.role,
          isVerified: u.isVerified,
          profilePhotoUrl: u.profilePhotoUrl || '',
        }));
        setUsers(normalised);
      } catch (e) {
        setError(e.message);
        showToast(`Failed to load users: ${e.message}`);
      } finally {
        setLoading(false);
      }
    })();
  }, [api, authLoading, token]);

  // Role Change
  const changeRole = async (user, target) => {
    try {
      const endpoint = target === 'admin' ? `/promote/${user.id}` : `/demote/${user.id}`;
      const { data } = await api(endpoint, { method: 'PUT' });

      setUsers(prev =>
        prev.map(u => (u.id === user.id ? { ...u, role: data.role } : u))
      );
      showToast(`${user.username} is now ${data.role}`);
    } catch (e) {
      showToast(`Error: ${e.message}`);
    }
  };

  const handleRoleChange = user => {
    if (user.id === loggedInUserId) {
      showToast("You cannot change your own role.");
      return;
    }
    const target = user.role === 'admin' ? 'user' : 'admin';
    setSelectedUser(user);
    setNewRole(target);
    setShowConfirmModal(true);
  };

  const confirmRoleChange = async () => {
    if (!selectedUser) return;
    await changeRole(selectedUser, newRole);
    setShowConfirmModal(false);
    setSelectedUser(null);
    setNewRole('user');
  };

  const cancelRoleChange = () => {
    setShowConfirmModal(false);
    setSelectedUser(null);
    setNewRole('user');
  };

  // Toast
  const showToast = msg => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };

  // UI Helpers
  const getRoleBadgeClass = r => {
    if (r === 'main_admin') return 'role-badge-main-admin';
    if (r === 'admin') return 'role-badge-admin';
    return 'role-badge-user';
  };

  const getVerifiedBadgeClass = v => (v ? 'verified-badge-true' : 'verified-badge-false');

  const getBreadcrumbs = () => {
    let p = 'Role Management';
    if (selectedFilter === 'admin') p += ' > Admins';
    else if (selectedFilter === 'user') p += ' > Users';
    else p += ' > Total Users';
    if (verifyFilter === 'verified') p += ' > Verified';
    else if (verifyFilter === 'unverified') p += ' > Unverified';
    return p;
  };

  const getRoleStat = () => {
    let s = selectedFilter === 'admin' ? 'Admins' : selectedFilter === 'user' ? 'Users' : 'Total Users';
    if (verifyFilter === 'verified') s += ' (Verified)';
    else if (verifyFilter === 'unverified') s += ' (Unverified)';
    return s;
  };

  const verifyBtn = (() => {
    switch (verifyFilter) {
      case 'verified': return { label: 'Verified', icon: 'bi-check-circle-fill' };
      case 'unverified': return { label: 'Unverified', icon: 'bi-x-circle-fill' };
      default: return { label: 'All Users', icon: 'bi-people' };
    }
  })();

  // Early Returns
  if (authLoading || loading) {
    return (
      <div className="role-change-container d-flex align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!token || !authUser || !['admin', 'main_admin'].includes(authUser.role)) {
    return (
      <div className="role-change-container p-4">
        <div className="alert alert-danger">Access denied. Admin login required.</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="role-change-container p-4">
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  return (
    <div className="role-change-container">
      {/* HEADER */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-text">
            <h2 className="page-title">
              <i className="bi bi-shield-check me-2"></i>
              Role Management
            </h2>
            <div className="breadcrumbs page-subtitle">{getBreadcrumbs()}</div>
          </div>
          <div className="header-stats">
            <div className="stat-item">
              <span className="stat-number">{users.filter(u => u.role === 'admin' || u.role === 'main_admin').length}</span>
              <span className="stat-labelR">Admins</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-number">{users.filter(u => u.role === 'user').length}</span>
              <span className="stat-labelR">Users</span>
            </div>
          </div>
        </div>
      </div>

      {/* SEARCH + VERIFY */}
      <div className="search-verify-section">
        <div className="search-container">
          <i className="bi bi-search search-icon"></i>
          <input
            type="text"
            className="search-input"
            placeholder="Search by Name, or Email"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search-btn" onClick={() => setSearchQuery('')} aria-label="Clear">
              <i className="bi bi-x-circle"></i>
            </button>
          )}
        </div>

        <div className="verify-dropdown-wrapper">
          <button
            className={`filter-btn dropdown-toggle ${showVerifyDropdown ? 'show' : ''}`}
            onClick={() => setShowVerifyDropdown(p => !p)}
          >
            <i className={`bi ${verifyBtn.icon}`}></i>
            <span>{verifyBtn.label}</span>
            <i className="bi bi-chevron-down ms-auto"></i>
          </button>

          {showVerifyDropdown && (
            <div className="verify-dropdown-menu">
              {['all', 'verified', 'unverified'].map(v => (
                <button
                  key={v}
                  className="dropdown-item"
                  onClick={() => {
                    setVerifyFilter(v);
                    setShowVerifyDropdown(false);
                  }}
                >
                  <i className={`bi ${
                    v === 'all' ? 'bi-people' :
                    v === 'verified' ? 'bi-check-circle-fill' :
                    'bi-x-circle-fill'
                  }`}></i>{' '}
                  {v === 'all' ? 'All Users' : v === 'verified' ? 'Verified Users' : 'Unverified Users'}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ROLE FILTERS */}
      <div className="filters-wrapper">
        <div className="filters-content">
          <div className="filter-group">
            <div className="filter-and-clear-btn">
              <span className="filter-group-label">Role</span>
              {(selectedFilter !== 'all' || verifyFilter !== 'all' || searchQuery) && (
                <button
                  className="clear-filters-btn"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedFilter('all');
                    setVerifyFilter('all');
                  }}
                >
                  <i className="bi bi-x-circle"></i>
                  <span>Clear All Filters</span>
                </button>
              )}
            </div>
            <div className="filter-buttons-row">
              {['all', 'admin', 'user'].map(f => (
                <button
                  key={f}
                  className={`filter-btn ${selectedFilter === f ? 'active' : ''}`}
                  onClick={() => setSelectedFilter(f)}
                >
                  <i className={`bi ${
                    f === 'all' ? 'bi-people' :
                    f === 'admin' ? 'bi-shield-fill-check' :
                    'bi-person'
                  }`}></i>
                  <span>{f === 'all' ? 'All' : f === 'admin' ? 'Admins' : 'Users'}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* DESKTOP TABLE */}
      <div className="table-container desktop-table">
        <div className="table-card">
          <div className="table-header">
            <h5 className="table-title">
              {getRoleStat()}
              <span className="table-count">
                ({processedUsers.length} {processedUsers.length === 1 ? 'user' : 'users'})
              </span>
            </h5>
          </div>
          <div className="table-responsive">
            {paginatedUsers.length > 0 ? (
              <table className="users-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Current Role</th>
                    <th>Is Verified</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map((user, idx) => {
                    const serialNo = startIdx + idx + 1;
                    const isOwn = user.id === loggedInUserId;

                    return (
                      <tr key={user.id}>
                        <td>{serialNo}</td>
                        <td>
                          <div className="user-info">
                            <div className="user-avatar">
                              {user.username.split(' ').map(n => n[0]).join('')}
                            </div>
                            <span className="user-name">{user.username}</span>
                          </div>
                        </td>
                        <td><span className="user-email">{user.email}</span></td>
                        <td>
                          <span className={`role-badge ${getRoleBadgeClass(user.role)}`}>
                            <i className={`bi ${
                              user.role === 'main_admin' ? 'bi-star-fill' :
                              user.role === 'admin' ? 'bi-shield-fill-check' :
                              'bi-person'
                            } me-1`}></i>
                            {user.role === 'main_admin' ? 'Main Admin' : user.role}
                          </span>
                        </td>
                        <td>
                          <span className={`verified-badge ${getVerifiedBadgeClass(user.isVerified)}`}>
                            <span className="verified-dot"></span>
                            {user.isVerified ? 'True' : 'False'}
                          </span>
                        </td>
                        <td className="text-center">
                          {user.role === 'main_admin' ? (
                            <button className="action-btn" disabled title="Cannot change main_admin role">
                              <i className="bi bi-lock me-1"></i>
                              Locked
                            </button>
                          ) : isOwn ? (
                            <button className="action-btn" disabled title="Cannot change your own role">
                              <i className="bi bi-lock me-1"></i>
                              Own Account
                            </button>
                          ) : (
                            <button
                              className="action-btn"
                              onClick={() => handleRoleChange(user)}
                              title={`Change to ${user.role === 'admin' ? 'User' : 'Admin'}`}
                            >
                              <i className="bi bi-arrow-left-right me-1"></i>
                              Change Role
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="no-results">
                <i className="bi bi-search"></i>
                <p>No users found matching your search criteria</p>
                <button
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedFilter('all');
                    setVerifyFilter('all');
                  }}
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE CARDS */}
      <div className="mobile-cards">
        <div className="cards-header">
          <h5 className="table-title">
            {getRoleStat()}
            <span className="table-count">({processedUsers.length})</span>
          </h5>
        </div>
        {paginatedUsers.length > 0 ? (
          <div className="user-cards-grid">
            {paginatedUsers.map((user, idx) => {
              const serialNo = startIdx + idx + 1;
              const isOwn = user.id === loggedInUserId;

              return (
                <div key={user.id} className="user-card">
                  <div className="card-header-section">
                    <div className="user-info">
                      <div className="user-avatar">
                        {user.username.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="user-main-info">
                        <span className="user-name">{user.username}</span>
                        <small className="serial-no">#{serialNo}</small>
                      </div>
                    </div>
                    <span className={`role-badge ${getRoleBadgeClass(user.role)}`}>
                      <i className={`bi ${
                        user.role === 'main_admin' ? 'bi-star-fill' :
                        user.role === 'admin' ? 'bi-shield-fill-check' :
                        'bi-person'
                      } me-1`}></i>
                      {user.role === 'main_admin' ? 'Main Admin' : user.role}
                    </span>
                  </div>
                  <div className="card-details">
                    <div className="detail-item">
                      <i className="bi bi-envelope me-2"></i>
                      <span className="user-email">{user.email}</span>
                    </div>
                    <div className="detail-item">
                      <span className={`verified-badge ${getVerifiedBadgeClass(user.isVerified)}`}>
                        <span className="verified-dot"></span>
                        Is Verified: {user.isVerified ? 'True' : 'False'}
                      </span>
                    </div>
                  </div>
                  <button
                    className="action-btn-mobile"
                    onClick={() => handleRoleChange(user)}
                    disabled={user.role === 'main_admin' || isOwn}
                  >
                    <i className={`bi ${user.role === 'main_admin' || isOwn ? 'bi-lock' : 'bi-arrow-left-right'} me-2`}></i>
                    {user.role === 'main_admin' ? 'Locked' : isOwn ? 'Own Account' : 'Change Role'}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="no-results">
            <i className="bi bi-search"></i>
            <p>No users found matching your search criteria</p>
            <button
              className="btn btn-outline-primary btn-sm"
              onClick={() => {
                setSearchQuery('');
                setSelectedFilter('all');
                setVerifyFilter('all');
              }}
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination-wrapper">
          <button
            className="pagination-btn"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <i className="bi bi-chevron-left"></i> Previous
          </button>

          <div className="pagination-numbers">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                className={`pagination-number ${currentPage === page ? 'active' : ''}`}
                onClick={() => goToPage(page)}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            className="pagination-btn"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next <i className="bi bi-chevron-right"></i>
          </button>
        </div>
      )}

      {/* CONFIRM MODAL */}
      {showConfirmModal && selectedUser && (
        <div className="modal-overlay" onClick={cancelRoleChange}>
          <div className="confirmation-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={cancelRoleChange}>
              <i className="bi bi-x"></i>
            </button>
            <div className="modal-icon">
              <i className="bi bi-arrow-left-right"></i>
            </div>
            <h3 className="modal-title">Confirm Role Change</h3>
            <div className="modal-content">
              <p className="modal-message">You are about to change the role for:</p>
              <div className="user-details-box">
                <div className="detail-row">
                  <span className="detail-label">User ID:</span>
                  <span className="detail-value">{selectedUser.id}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Name:</span>
                  <span className="detail-value">{selectedUser.username}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Email:</span>
                  <span className="detail-value detail-email">{selectedUser.email}</span>
                </div>
                <div className="detail-row role-change-row">
                  <span className="detail-label">Role Change:</span>
                  <div className="role-change-display">
                    <span className={`role-badge ${getRoleBadgeClass(selectedUser.role)}`}>
                      {selectedUser.role === 'main_admin' ? 'Main Admin' : selectedUser.role}
                    </span>
                    <i className="bi bi-arrow-right mx-2"></i>
                    <span className={`role-badge ${getRoleBadgeClass(newRole)}`}>{newRole}</span>
                  </div>
                </div>
              </div>
              <p className="modal-warning">
                <i className="bi bi-exclamation-triangle me-2"></i>
                This action will immediately change the user's access permissions.
              </p>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary btn-cancel" onClick={cancelRoleChange}>
                Cancel
              </button>
              <button className="btn btn-primary btn-confirm" onClick={confirmRoleChange}>
                <i className="bi bi-check-circle me-2"></i>
                Confirm Change
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOASTS */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className="toast-notification">
            <div className="toast-content">
              <div className="toast-icon">
                <i className="bi bi-check-circle-fill"></i>
              </div>
              <div className="toast-body">
                <div className="toast-title">{t.msg}</div>
              </div>
              <button className="toast-close" onClick={() => setToasts(p => p.filter(x => x.id !== t.id))}>
                <i className="bi bi-x"></i>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RoleChange;