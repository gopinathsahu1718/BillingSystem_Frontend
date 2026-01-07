// src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const BASE_URL = 'http://13.232.200.172/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Restore session on mount
    useEffect(() => {
        const storedToken = localStorage.getItem('authToken');
        const storedUser = localStorage.getItem('authUser');

        if (storedToken && storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);

                // Validate that the stored user has required fields
                if (parsedUser && parsedUser.id && parsedUser.role) {
                    setToken(storedToken);
                    setUser(parsedUser);
                } else {
                    throw new Error('Invalid user data in storage');
                }
            } catch (error) {
                console.error('Error restoring auth session:', error);
                localStorage.removeItem('authToken');
                localStorage.removeItem('authUser');
            }
        }
        setLoading(false);
    }, []);

    // === LOGIN ===
    const login = async (email, password) => {
        try {
            const response = await fetch(`${BASE_URL}/admin/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (data.success) {
                const adminUser = data.admin; // API returns user data under "admin"

                // Role check: only allow admin or main_admin
                if (adminUser.role === 'admin' || adminUser.role === 'main_admin') {
                    localStorage.setItem('authToken', data.token);
                    localStorage.setItem('authUser', JSON.stringify(adminUser));

                    setToken(data.token);
                    setUser(adminUser);

                    navigate('/dashboard');

                    console.log('logged in');

                    return { success: true };
                } else {
                    return {
                        success: false,
                        message: 'Access denied. Admin privileges required.',
                    };
                }
            } else {
                return {
                    success: false,
                    message: data.message || 'Login failed',
                };
            }
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                message: 'Network error. Please try again.',
            };
        }
    };

    // === LOGOUT ===
    const logout = async () => {
        try {
            // Call the backend logout endpoint if token exists
            if (token) {
                await fetch(`${BASE_URL}/admin/logout`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`, // Important: Send the token
                    },
                });
                // We don't need to check the response deeply — even if it fails, we clear local data
            }
        } catch (error) {
            console.error('Error during backend logout:', error);
            // Continue with local cleanup even if API call fails (network issue, etc.)
        } finally {
            // Always clear local state and storage, regardless of API success/failure
            console.log('logged out');
            localStorage.removeItem('authToken');
            localStorage.removeItem('authUser');
            setToken(null);
            setUser(null);
            navigate('/login');
        }
    };

    // === AUTH STATUS ===
    const isAuthenticated = () => {
        return !!token && !!user && (user.role === 'admin' || user.role === 'main_admin');
    };

    // === FORGOT PASSWORD ===
    const forgotPassword = async (email) => {
        try {
            const res = await fetch(`${BASE_URL}/admin/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();

            console.log('Forgot Password Response:', data);

            return {
                success: data.success,
                message: data.message,
                resetInitToken: data.resetInitToken || data.token || data.initToken,
            };
        } catch (e) {
            console.error('Forgot password error:', e);
            return { success: false, message: 'Network error' };
        }
    };

    // === RESEND RESET OTP ===
    const resendResetOtp = async (email) => {
    const result = await forgotPassword(email);
    if (result.success) {
        return { 
            success: true, 
            message: 'OTP resent successfully', 
            resetInitToken: result.resetInitToken 
        };
    }
    return { success: false, message: result.message };
};

    // === VERIFY OTP (Reset Password Flow) ===
const verifyResetOtp = async (resetInitToken, otp) => {
    try {
        const res = await fetch(`${BASE_URL}/admin/verify-reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ otp, resetInitToken }),
        });
        const data = await res.json();
        console.log('verifyreset-password response:', data);

        return {
            success: data.success,
            message: data.message,
            // Use the actual field name returned by your backend
            token: data.passwordResetToken || data.token || data.resetToken,
        };
    } catch (e) {
        console.error('Verify reset OTP error:', e);
        return { success: false, message: 'Network error' };
    }
};

    // === RESET PASSWORD ===
    const resetPassword = async (resetToken, newPassword, confirmPassword) => {
        try {
            const res = await fetch(`${BASE_URL}/admin/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    "passwordResetToken": resetToken,
                    "newPassword": newPassword,
                }),
            });
            const data = await res.json();
            console.log('Reset Password Response:', data);
            return { success: data.success, message: data.message };
        } catch (e) {
            console.error('Reset password error:', e);
            return { success: false, message: 'Network error' };
        }
    };

    // === CONTEXT VALUE ===
    const value = {
        user,
        token,
        login,
        logout,
        isAuthenticated,
        loading,
        // Password Reset Flow
        forgotPassword,
        resendResetOtp,
        verifyResetOtp,
        resetPassword,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};