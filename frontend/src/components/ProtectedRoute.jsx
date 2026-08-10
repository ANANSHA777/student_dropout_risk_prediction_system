import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();

  // 1. Wait for AuthContext session verification on app mount/refresh
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
        <div className="flex items-center space-x-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
          <span className="text-sm font-medium text-slate-400">Verifying session...</span>
        </div>
      </div>
    );
  }

  // 2. Redirect to /login if user is not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // 3. Case-insensitive Role Checking
  if (allowedRoles && allowedRoles.length > 0) {
    const userRoleNormalized = user.role?.trim().toLowerCase();
    
    const hasAccess = allowedRoles.some(
      (role) => role.trim().toLowerCase() === userRoleNormalized
    );

    if (!hasAccess) {
      // Map lowercase normalized roles to redirect paths
      const roleRoutes = {
        admin: '/admin',
        counselor: '/counselor',
        teacher: '/teacher',
        student: '/student',
      };

      const fallbackRoute = roleRoutes[userRoleNormalized] || '/login';
      return <Navigate to={fallbackRoute} replace />;
    }
  }

  // 4. Render protected child routes via Outlet
  return <Outlet />;
};

export default ProtectedRoute;