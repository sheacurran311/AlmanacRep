
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminRoutes from './routes/adminRoutes';
import Login from './components/auth/Login';

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/admin/*" element={<AdminRoutes />} />
      <Route path="/" element={<Login />} />
    </Routes>
  );
};

export default App;
