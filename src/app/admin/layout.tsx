'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useState } from 'react';

const navItems = [
  { label: 'Dashboard', href: '/admin', icon: '📊', adminOnly: false },
  { label: 'Analytics', href: '/admin/analytics', icon: '📈', adminOnly: false },
  { label: 'Products', href: '/admin/products', icon: '📦', adminOnly: true },
  { label: 'Add Product', href: '/admin/products/new', icon: '➕', adminOnly: true },
  { label: 'Orders', href: '/admin/orders', icon: '🛒', adminOnly: false },
  { label: 'Users', href: '/admin/users', icon: '👥', adminOnly: true },
  { label: 'Settings', href: '/admin/settings', icon: '⚙️', adminOnly: true },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user || (user.role !== 'admin' && user.role !== 'technician')) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <span className="text-6xl block mb-4">🔒</span>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-500">You don&apos;t have permission to view this page.</p>
      </div>
    );
  }

  const isActive = (href: string, match?: string) => {
    if (match) return pathname.startsWith(match);
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-amber-50/30 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-16 left-0 z-40 w-64 h-[calc(100vh-4rem)] bg-white border-r border-amber-100 shadow-lg lg:shadow-none transform transition-transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-6 border-b border-amber-100">
          <h2 className="text-lg font-bold text-amber-900">Admin Panel</h2>
          <p className="text-sm text-gray-500 mt-1 capitalize">{user.role} access</p>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.href, undefined);
            // Hide admin-only tabs for technicians
            if (item.adminOnly && user.role !== 'admin') return null;
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                  active
                    ? 'bg-amber-700 text-white'
                    : 'text-gray-700 hover:bg-amber-100 hover:text-amber-900'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Mobile menu toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden m-4 p-2 rounded-lg bg-white shadow-md"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="p-4 lg:p-8">{children}</div>
      </div>
    </div>
  );
}
