// src/App.js
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import Sidebar from './components/Sidebar/Sidebar';
import MobileHeader from './components/MobileHeader/MobileHeader';
import LogoutModal from './pages/LogoutModal/LogoutModal';
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import LMSManagement from './pages/StoreManagement/StoreManagement';
import Users from './pages/Users/Users';
import RoleChange from './pages/RoleChange/RoleChange';
import Feedbacks from './pages/Feedbacks/Feedbacks';
import Profile from './pages/Profile/Profile';
import ChangePassword from './pages/ChangePassword/ChangePassword';
import BillFormat from './components/BillingFormat/BillFormat';
import BillExample from './components/BillingFormat/BillExample';
import BillPage from './pages/BillPage/BillPage';
import StoreManagement from './pages/StoreManagement/StoreManagement';
import CartBilling from './pages/CartBilling/CartBilling';

// Password Reset Pages
import ForgotPassword from './pages/PasswordReset/ForgotPassword';
import ResetOtp from './pages/PasswordReset/ResetOtp';
import ResetPassword from './pages/PasswordReset/ResetPassword';

import './App.css';

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
    setSidebarOpen(false);
  };

  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
  };

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-otp" element={<ResetOtp />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Protected Routes */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <div className="d-flex">
              <Sidebar
                handleLogout={handleLogoutClick}
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
              />

              {sidebarOpen && (
                <div
                  className="sidebar-overlay d-lg-none"
                  onClick={() => setSidebarOpen(false)}
                ></div>
              )}

              <div className="main-content flex-grow-1">
                <MobileHeader
                  sidebarOpen={sidebarOpen}
                  setSidebarOpen={setSidebarOpen}
                />

                <main className="content-area p-3 p-md-4">
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/store-management" element={<StoreManagement />} />
                    <Route path="/Cart-Billing" element={<CartBilling />} />
                    <Route path="/user-registration-progress" element={<Users />} />
                    <Route path="/role-change" element={<RoleChange />} />
                    <Route path="/feedbacks" element={<Feedbacks />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/profile/change-password" element={<ChangePassword />} />
                  </Routes>
                </main>
              </div>

              <LogoutModal
                show={showLogoutModal}
                onCancel={handleLogoutCancel}
              />
            </div>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
    // <BillExample/>
    // <BillPage/>
    // <StoreManagement/>
  );
}

export default App;