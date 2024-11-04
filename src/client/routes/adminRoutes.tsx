import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import {
  AdminLayout,
  Dashboard,
  Users,
  RewardsManager,
  Analytics
} from '@client/components/admin';

const AdminRoutes: React.FC = () => {
  return (
    <AdminLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/users" element={<Users />} />
        <Route path="/rewards" element={<RewardsManager />} />
        <Route path="/analytics" element={<Analytics />} />
      </Routes>
    </AdminLayout>
  );
};

export default AdminRoutes;