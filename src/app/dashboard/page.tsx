'use client';

import { useAuth } from '@/context/AuthContext';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import UserDashboard from '@/components/dashboard/UserDashboard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function DashboardPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {user.role === 'admin' || user.role === 'technician' ? (
        <AdminDashboard />
      ) : (
        <UserDashboard />
      )}
    </div>
  );
}
