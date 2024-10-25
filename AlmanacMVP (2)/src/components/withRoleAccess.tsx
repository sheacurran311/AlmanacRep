import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const withRoleAccess = (allowedRoles: string[]) => (WrappedComponent: React.ComponentType<any>) => {
  return (props: any) => {
    const { client } = useAuth();

    if (!client || !allowedRoles.includes(client.role)) {
      return <Navigate to="/unauthorized" replace />;
    }

    return <WrappedComponent {...props} />;
  };
};

export default withRoleAccess;