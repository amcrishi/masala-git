'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Stats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/analytics');
        const json = await res.json();
        if (json.success) {
          setStats({
            totalProducts: json.data.summary.totalProducts || 0,
            totalOrders: json.data.summary.totalOrders || 0,
            totalRevenue: json.data.summary.totalRevenue || 0,
            pendingOrders: json.data.breakdown.ordersByStatus?.pending || 0,
          });
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const statCards = [
    { label: 'Total Products', value: stats.totalProducts, icon: '📦', color: 'bg-blue-50 text-blue-700' },
    { label: 'Total Orders', value: stats.totalOrders, icon: '🛒', color: 'bg-green-50 text-green-700' },
    { label: 'Revenue', value: `₹${stats.totalRevenue.toLocaleString('en-IN')}`, icon: '💰', color: 'bg-amber-50 text-amber-700' },
    { label: 'Pending Orders', value: stats.pendingOrders, icon: '⏳', color: 'bg-red-50 text-red-700' },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h2>
      
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-xl h-32 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat) => (
            <div key={stat.label} className={`${stat.color} rounded-xl p-6`}>
              <div className="text-3xl mb-2">{stat.icon}</div>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-sm opacity-75">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/admin/products/new" className="block">
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-amber-500">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">➕ Add New Product</h3>
            <p className="text-gray-500 text-sm">Add a new masala product to your catalog</p>
          </div>
        </Link>
        <Link href="/admin/products" className="block">
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-blue-500">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">📋 Manage Products</h3>
            <p className="text-gray-500 text-sm">View, edit, and delete products</p>
          </div>
        </Link>
        <Link href="/admin/orders" className="block">
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-green-500">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">📦 Manage Orders</h3>
            <p className="text-gray-500 text-sm">View and update order statuses</p>
          </div>
        </Link>
        <Link href="/products" className="block">
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-purple-500">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">🏪 View Store</h3>
            <p className="text-gray-500 text-sm">See how your store looks to customers</p>
          </div>
        </Link>
        <Link href="/admin/users" className="block">
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-red-500">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">👥 Manage Users</h3>
            <p className="text-gray-500 text-sm">Add, edit, and remove user accounts</p>
          </div>
        </Link>
        <Link href="/admin/analytics" className="block">
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-indigo-500">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">📈 Analytics</h3>
            <p className="text-gray-500 text-sm">View sales, revenue, and product insights</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
