import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LoadingSkeleton } from '../common/LoadingSkeleton';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="w-full max-w-md p-8">
          <LoadingSkeleton count={3} />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If user is trying to access another role's dashboard, smoothly redirect them to their own dashboard
    if (location.pathname.startsWith('/dashboard')) {
      return <Navigate to={`/dashboard/${user.role}`} replace />;
    }
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};
