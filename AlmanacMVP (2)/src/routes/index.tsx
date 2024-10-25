import React, { lazy } from 'react';
import { useRoutes } from 'react-router-dom';
import Loadable from '../components/Loadable';
import MainLayout from '../layout/MainLayout';

const DashboardDefault = Loadable(lazy(() => import('../pages/Dashboard')));
const Users = Loadable(lazy(() => import('../pages/Users')));
const Campaigns = Loadable(lazy(() => import('../pages/Campaigns')));
const Rewards = Loadable(lazy(() => import('../pages/Rewards')));
const RoleManagement = Loadable(lazy(() => import('../pages/RoleManagement')));

const Login = Loadable(lazy(() => import('../pages/Login')));
const Register = Loadable(lazy(() => import('../pages/Register')));
const Unauthorized = Loadable(lazy(() => import('../pages/Unauthorized')));

const Routes = () => {
  return useRoutes([
    {
      path: '/',
      element: <MainLayout />,
      children: [
        { path: 'dashboard', element: <DashboardDefault /> },
        { path: 'users', element: <Users /> },
        { path: 'campaigns', element: <Campaigns /> },
        { path: 'rewards', element: <Rewards /> },
        { path: 'role-management', element: <RoleManagement /> }
      ]
    },
    { path: 'login', element: <Login /> },
    { path: 'register', element: <Register /> },
    { path: 'unauthorized', element: <Unauthorized /> }
  ]);
};

export default Routes;