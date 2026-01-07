// src/pages/Feedbacks/Feedbacks.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import './Feedbacks.css';

function Feedbacks() {
    const { token } = useAuth();
    const [feedbacks, setFeedbacks] = useState([]);
    const [stats, setStats] = useState({ total: 0, averageRating: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedFilter, setSelectedFilter] = useState('all');

    useEffect(() => {
        if (token) {
            fetchFeedbacks();
        }
    }, [token]);

    const fetchFeedbacks = async () => {
        if (!token) {
            setError('Authentication required');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const response = await fetch('https://api.hearingzen.in/api/feedback/feedbacks', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                setFeedbacks(data.data.feedbacks);
                setStats(data.data.stats);
            } else {
                throw new Error(data.message || 'Failed to fetch feedbacks');
            }
        } catch (err) {
            setError('Failed to load feedbacks. Please try again later.');
            console.error('Error fetching feedbacks:', err);
        } finally {
            setLoading(false);
        }
    };

    const filterFeedbacks = () => {
        if (selectedFilter === 'all') return feedbacks;

        const filterValue = parseInt(selectedFilter);
        return feedbacks.filter(feedback => feedback.rating === filterValue);
    };

    const renderStars = (rating) => {
        return [...Array(5)].map((_, index) => (
            <i
                key={index}
                className={`bi bi-star${index < rating ? '-fill' : ''} feedback-star`}
            ></i>
        ));
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getRatingDistribution = () => {
        const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        feedbacks.forEach(feedback => {
            distribution[feedback.rating] = (distribution[feedback.rating] || 0) + 1;
        });
        return distribution;
    };

    const filteredFeedbacks = filterFeedbacks();
    const ratingDistribution = getRatingDistribution();

    if (loading) {
        return (
            <div className="feedbacks-container">
                <div className="feedbacks-loading">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3">Loading feedbacks...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="feedbacks-container">
                <div className="feedbacks-error">
                    <i className="bi bi-exclamation-triangle-fill"></i>
                    <p>{error}</p>
                    <button className="btn btn-primary" onClick={fetchFeedbacks}>
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="feedbacks-container">
            {/* Header */}
            <div className="feedbacks-header">
                <div className="feedbacks-header-content">
                    <div className="feedbacks-title-section">
                        <h1 className="feedbacks-title">
                            <i className="bi bi-chat-heart-fill"></i>
                            Feedbacks from App
                        </h1>
                        <p className="feedbacks-subtitle">
                            See what our customers are saying about their experience
                        </p>
                    </div>
                    <button className="btn-refresh" onClick={fetchFeedbacks}>
                        <i className="bi bi-arrow-clockwise"></i>
                        Refresh
                    </button>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="feedbacks-stats">
                <div className="stat-card stat-card-primary">
                    <div className="stat-icon">
                        <i className="bi bi-chat-dots-fill"></i>
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.total}</div>
                        <div className="stat-label">Total Feedbacks</div>
                    </div>
                </div>

                <div className="stat-card stat-card-success">
                    <div className="stat-icon">
                        <i className="bi bi-star-fill"></i>
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">
                            {stats.averageRating.toFixed(1)}
                            <span className="stat-value-small">/5</span>
                        </div>
                        <div className="stat-label">Average Rating</div>
                    </div>
                </div>

                <div className="stat-card stat-card-info">
                    <div className="stat-icon">
                        <i className="bi bi-trophy-fill"></i>
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{ratingDistribution[5] || 0}</div>
                        <div className="stat-label">5-Star Reviews</div>
                    </div>
                </div>

                <div className="stat-card stat-card-warning">
                    <div className="stat-icon">
                        <i className="bi bi-graph-up"></i>
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">
                            {stats.total > 0 ? Math.round((ratingDistribution[5] / stats.total) * 100) : 0}%
                        </div>
                        <div className="stat-label">Satisfaction Rate</div>
                    </div>
                </div>
            </div>

            {/* Rating Distribution */}
            <div className="rating-distribution-card">
                <h3 className="section-title">
                    <i className="bi bi-bar-chart-fill"></i>
                    Rating Distribution
                </h3>
                <div className="rating-bars">
                    {[5, 4, 3, 2, 1].map(rating => {
                        const count = ratingDistribution[rating] || 0;
                        const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;

                        return (
                            <div key={rating} className="rating-bar-row">
                                <div className="rating-bar-label">
                                    {rating} <i className="bi bi-star-fill"></i>
                                </div>
                                <div className="rating-bar-container">
                                    <div
                                        className="rating-bar-fill"
                                        style={{ width: `${percentage}%` }}
                                    ></div>
                                </div>
                                <div className="rating-bar-count">{count}</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Filter Section */}
            <div className="feedbacks-filter">
                <div className="filter-label">Filter by rating:</div>
                <div className="filter-buttons">
                    <button
                        className={`filter-btn ${selectedFilter === 'all' ? 'active' : ''}`}
                        onClick={() => setSelectedFilter('all')}
                    >
                        All ({feedbacks.length})
                    </button>
                    {[5, 4, 3, 2, 1].map(rating => (
                        <button
                            key={rating}
                            className={`filter-btn ${selectedFilter === String(rating) ? 'active' : ''}`}
                            onClick={() => setSelectedFilter(String(rating))}
                        >
                            {rating} <i className="bi bi-star-fill"></i> ({ratingDistribution[rating] || 0})
                        </button>
                    ))}
                </div>
            </div>

            {/* Feedbacks List */}
            <div className="feedbacks-list">
                {filteredFeedbacks.length === 0 ? (
                    <div className="no-feedbacks">
                        <i className="bi bi-inbox"></i>
                        <p>No feedbacks found</p>
                    </div>
                ) : (
                    filteredFeedbacks.map((feedback) => (
                        <div key={feedback._id} className="feedback-card">
                            <div className="feedback-header">
                                <div className="feedback-user">
                                    <div className="feedback-avatar">
                                        {feedback.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="feedback-user-info">
                                        <div className="feedback-name">{feedback.name}</div>
                                        <div className="feedback-date">{formatDate(feedback.createdAt)}</div>
                                    </div>
                                </div>
                                <div className="feedback-rating">
                                    {renderStars(feedback.rating)}
                                    <span className="rating-value">{feedback.rating}.0</span>
                                </div>
                            </div>
                            <div className="feedback-content">
                                <p className="feedback-text">{feedback.feedback}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default Feedbacks;