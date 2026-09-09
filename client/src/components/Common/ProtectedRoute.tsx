import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-paper)] text-[var(--color-ink)] font-bold text-lg">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[var(--color-volt)] border-t-transparent rounded-full animate-spin"></div>
          <span>Verifying Host Session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/host/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
