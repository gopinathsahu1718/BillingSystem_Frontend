// src/pages/Users.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import './Users.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const API_BASE = 'https://api.hearingzen.in/api/analytics';
const PAGE_SIZE = 10;

function Users() {
  const { token, user: authUser, loading: authLoading } = useAuth();

  // UI state
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [expandedUser, setExpandedUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Data state
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // API helper
  const api = async (path, opts = {}) => {
    if (!token) throw new Error('No token');
    try {
      const res = await fetch(`${API_BASE}${path}`, {
        ...opts,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          ...opts.headers,
        },
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'API error');
      return json;
    } catch (err) {
      console.error('API Error:', err);
      throw new Error(`Failed to fetch: ${err.message}`);
    }
  };

  // Load users
  useEffect(() => {
    if (authLoading || !token) return;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await api('/users-registration-progress');

        setTotalUsers(data.totalUsers);
        
        const normalised = data.users.map(u => {
          let profilePhoto = u.user.profilePhoto;

          // Fix Google profile photo CORS issue by forcing a larger, embeddable size
          if (profilePhoto && profilePhoto.includes('googleusercontent.com')) {
            // Replace any =sXX-c or =sXX with =s384-c
            profilePhoto = profilePhoto.replace(/=s\d+-c?$/, '=s384-c');
            
            // Alternative (also works great): remove size parameter entirely
            // profilePhoto = profilePhoto.split('=')[0];
          }

          return {
            id: u.user.id,
            name: u.user.username,
            email: u.user.email,
            contact: u.user.contact || '-',
            role: u.user.role,
            isVerified: u.user.isVerified,
            joinDate: u.user.joinDate,
            profilePhoto, // Now CORS-safe
            gender: u.user.gender || '-',
            age: u.user.age || '-',
            totalCoursesEnrolled: u.statistics.totalCoursesEnrolled,
            completedCourses: u.statistics.completedCourses,
            inProgressCourses: u.statistics.inProgressCourses,
            notStartedCourses: u.statistics.notStartedCourses,
            overallCompletionRate: u.statistics.overallCompletionRate,
            courses: u.courses || []
          };
        });
        
        setUsers(normalised);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [token, authLoading]);

  // Filtering
  const filteredUsers = users.filter(user => {
    if (activeTab === 'verified' && !user.isVerified) return false;
    if (activeTab === 'unverified' && user.isVerified) return false;

    const q = search.toLowerCase();
    return (
      user.name.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q) ||
      user.role.toLowerCase().includes(q)
    );
  });

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE);
  const startIdx = (currentPage - 1) * PAGE_SIZE;
  const paginatedUsers = filteredUsers.slice(startIdx, startIdx + PAGE_SIZE);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setExpandedUser(null);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [search, activeTab]);

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  // Labels
  const activeLabels = { 
    all: 'All Users', 
    verified: 'Verified Users', 
    unverified: 'Unverified Users' 
  };
  const activeLabel = activeLabels[activeTab] || 'All Users';

  // Loading & Access Control
  if (authLoading || loading) {
    return (
      <div className="users-page d-flex align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading…</span>
        </div>
      </div>
    );
  }

  if (!token || !authUser || !['admin', 'main_admin'].includes(authUser.role)) {
    return (
      <div className="users-page p-4">
        <div className="alert alert-danger">Access denied. Admin login required.</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="users-page p-4">
        <div className="alert alert-danger">
          <h5>Error Loading Users</h5>
          <p>{error}</p>
          <small>Check console for more details. Verify the API endpoint is correct and accessible.</small>
        </div>
      </div>
    );
  }

  const verifiedCount = users.filter(u => u.isVerified).length;
  const unverifiedCount = users.filter(u => !u.isVerified).length;

  return (
    <div className="users-page">

      {/* HEADER */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-text">
            <h2 className="page-title">
              <i className="bi bi-people me-3"></i>
              Users Registration Progress
            </h2>
            <div className="breadcrumbs page-subtitle">
              <span className="breadcrumb-link">Users</span>
              <span className="breadcrumb-separator">{'>'}</span>
              <span className="breadcrumb-current">{activeLabel}</span>
            </div>
          </div>
          <div className="header-stats">
            <div className="stat-item">
              <span className="stat-number">{totalUsers}</span>
              <span className="stat-labelR">Total</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-number">{verifiedCount}</span>
              <span className="stat-labelR">Verified</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-number">{unverifiedCount}</span>
              <span className="stat-labelR">Unverified</span>
            </div>
          </div>
        </div>
      </div>

      {/* SEARCH + FILTERS */}
      <div className="search-filter-section">
        <div className="search-container">
          <div className="search-row">
            <div className="search-input-wrapper">
              <i className="bi bi-search search-icon"></i>
              <input
                type="text"
                className="search-input"
                placeholder="Search by name, email, or role..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button className="clear-search-btn" onClick={() => setSearch('')}>
                  <i className="bi bi-x-circle"></i>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="filter-buttons mt-3">
          <button 
            className={`filter-btn ${activeTab === 'all' ? 'active' : ''}`} 
            onClick={() => setActiveTab('all')}
          >
            <i className="bi bi-people me-2"></i>All Users
          </button>
          <button 
            className={`filter-btn ${activeTab === 'verified' ? 'active' : ''}`} 
            onClick={() => setActiveTab('verified')}
          >
            <i className="bi bi-patch-check-fill me-2"></i>Verified Users
          </button>
          <button 
            className={`filter-btn ${activeTab === 'unverified' ? 'active' : ''}`} 
            onClick={() => setActiveTab('unverified')}
          >
            <i className="bi bi-person-x-fill me-2"></i>Unverified Users
          </button>
        </div>
      </div>

      {/* USER LIST */}
      <div className="users-list-card">
        {paginatedUsers.length === 0 ? (
          <div className="users-no-users">No users found.</div>
        ) : (
          <>
            {paginatedUsers.map((user, idx) => {
              const serialNo = startIdx + idx + 1;
              const isExpanded = expandedUser === idx;
              
              return (
                <div
                  key={user.id}
                  className={`users-list-item ${isExpanded ? 'expanded' : ''}`}
                  onClick={() => setExpandedUser(isExpanded ? null : idx)}
                >
                  <div className="users-list-summary">
                    <div className="users-left-section">
                      <span className="users-list-serial">{serialNo}.</span>
                      <div className="users-avatar-placeholder">
                        {user.name.split(' ').map(word => word.charAt(0).toUpperCase()).join('').slice(0, 2)}
                      </div>
                      <div className="users-user-info">
                        <span className="users-list-name">{user.name}</span>
                        <span className="users-email">{user.email}</span>
                      </div>
                    </div>
                    
                    <div className="users-action-group">
                      <span className={`status-label ${user.isVerified ? 'verified' : 'unverified'}`}>
                        {user.isVerified ? 'Verified' : 'Unverified'}
                      </span>
                      <span className="role-badge">{user.role}</span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="users-list-details">
                      <div className="users-details-grid">
                        <div className="detail-item"><strong>Contact:</strong> {user.contact}</div>
                        <div className="detail-item"><strong>Gender:</strong> {user.gender}</div>
                        <div className="detail-item"><strong>Age:</strong> {user.age}</div>
                        <div className="detail-item"><strong>Joined:</strong> {formatDate(user.joinDate)}</div>
                      </div>

                      <div className="users-stats-section">
                        <h4 className="users-stats-title">
                          <i className="bi bi-bar-chart-fill me-2"></i>Course Statistics
                        </h4>
                        <div className="users-stats-grid">
                          <div className="users-stat-card">
                            <div className="users-stat-value">{user.totalCoursesEnrolled}</div>
                            <div className="users-stat-label">Total Enrolled</div>
                          </div>
                          <div className="users-stat-card">
                            <div className="users-stat-value">{user.completedCourses}</div>
                            <div className="users-stat-label">Completed</div>
                          </div>
                          <div className="users-stat-card">
                            <div className="users-stat-value">{user.inProgressCourses}</div>
                            <div className="users-stat-label">In Progress</div>
                          </div>
                          <div className="users-stat-card">
                            <div className="users-stat-value">{user.notStartedCourses}</div>
                            <div className="users-stat-label">Not Started</div>
                          </div>
                          <div className="users-stat-card highlight">
                            <div className="users-stat-value">{user.overallCompletionRate.toFixed(1)}%</div>
                            <div className="users-stat-label">Completion Rate</div>
                          </div>
                        </div>
                      </div>

                      {user.courses.length > 0 && (
                        <div className="users-courses-section">
                          <h4 className="users-courses-title">
                            <i className="bi bi-book-fill me-2"></i>Enrolled Courses ({user.courses.length})
                          </h4>
                          <div className="users-courses-list">
                            {user.courses.map((course, cIdx) => (
                              <div key={cIdx} className="users-course-card">
                                <div className="users-course-header">
                                  <span className="users-course-title">{course.course.title}</span>
                                  <span className={`users-course-status ${course.progress.status}`}>
                                    {course.progress.status.replace('_', ' ')}
                                  </span>
                                </div>
                                <div className="users-course-details">
                                  <span><strong>Author:</strong> {course.course.author_name}</span>
                                  <span><strong>Category:</strong> {course.course.category}</span>
                                </div>
                                <div className="users-course-progress">
                                  <div className="users-progress-bar">
                                    <div 
                                      className="users-progress-fill" 
                                      style={{ width: `${course.progress.completionRate}%` }}
                                    ></div>
                                  </div>
                                  <span className="users-progress-text">
                                    {course.progress.completedLessons}/{course.progress.totalLessons} lessons • {course.progress.completionRate}%
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* PAGINATION */}
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
    </div>
  );
}

export default Users;