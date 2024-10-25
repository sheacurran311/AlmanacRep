import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from '../components/admin/AdminLayout';
import Dashboard from '../components/admin/Dashboard';
import Users from '../components/admin/Users';
import RewardsManager from '../components/admin/RewardsManager';
import { useAuth } from '../hooks/useAuth';

const AdminRoutes: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AdminLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/users" element={<Users />} />
        <Route path="/rewards" element={<RewardsManager />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AdminLayout>
  );
};

export default AdminRoutes;
