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

import Profile from './pages/Profile/Profile';
import ChangePassword from './pages/ChangePassword/ChangePassword';
import BillFormat from './components/BillingFormat/BillFormat';
import BillExample from './components/BillingFormat/BillExample';

import StoreManagement from './pages/StoreManagement/StoreManagement';
import ProductSelection from './pages/ProductSelection/ProductSelection';
import BillingReport from './pages/BillingReport/BillingReport';
import Cart from './pages/Cart/Cart';
import BillPage from './pages/BillPage/BillPage';
// import ImageToBase64Converter from './components/ImageToBase64Converter';


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
      <Route path="/bill-page" element={<BillPage />} />
      {/* <Route path="/image-converter" element={<ImageToBase64Converter />} /> */}

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
                    <Route path="/products" element={<ProductSelection />} />

                    <Route path="/profile" element={<Profile />} />
                    <Route path="/profile/change-password" element={<ChangePassword />} />
                    <Route path="/bill-page" element={<BillPage />} />
                    <Route path="/billing-report" element={<BillingReport />} />
                    <Route path="/cart" element={<Cart />} />

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