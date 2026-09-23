import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Spinner } from './ui';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Spinner label="Memeriksa sesi admin..." />
      </div>
    );
  }
  if (!user) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}
