// frontend/src/AppRoutes.js
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import ProtectedRoute   from './components/ProtectedRoute';
import Authpage         from './pages/Authpage';  
import DashboardPage    from './pages/DashboardPage';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Project run hote hi register page open hoga */}
      <Route path="/" element={<Navigate to="/register" replace />} />

      {/* Public routes */}
      <Route path="/login"     element={<Authpage />}    />
      <Route path="/register"  element={<Authpage />}    />

      {/* Protected dashboard route */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      {/* Catch-all → redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;