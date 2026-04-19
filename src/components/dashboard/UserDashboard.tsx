'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { IOrder } from '@/types';
import { useAuth } from '@/context/AuthContext';

export default function UserDashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await fetch('/api/orders?limit=5');
        const data = await res.json();
        if (data.success) {
          setOrders(data.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name}! 👋
        </h2>
        <p className="text-gray-500 mt-1">Here&apos;s an overview of your activity</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-amber-50 rounded-xl p-6">
          <div className="text-3xl mb-2">🛒</div>
          <div className="text-2xl font-bold text-amber-800">{orders.length}</div>
          <div className="text-sm text-amber-600">Recent Orders</div>
        </div>
        <Link href="/products" className="bg-green-50 rounded-xl p-6 hover:bg-green-100 transition-colors">
          <div className="text-3xl mb-2">🌶️</div>
          <div className="text-lg font-bold text-green-800">Browse Products</div>
          <div className="text-sm text-green-600">Explore our masala collection</div>
        </Link>
        <Link href="/products?category=premium" className="bg-purple-50 rounded-xl p-6 hover:bg-purple-100 transition-colors">
          <div className="text-3xl mb-2">✨</div>
          <div className="text-lg font-bold text-purple-800">Premium Collection</div>
          <div className="text-sm text-purple-600">Our finest blends</div>
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h3>
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : orders.length > 0 ? (
          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <span className="font-medium text-gray-900">
                    Order #{order._id.slice(-8)}
                  </span>
                  <span className="text-gray-500 text-sm ml-3">
                    {new Date(order.createdAt).toLocaleDateString('en-IN')}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="font-semibold text-amber-700">₹{order.totalAmount}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status] || 'bg-gray-100'}`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <span className="text-4xl block mb-2">📭</span>
            <p>No orders yet.</p>
            <Link href="/products" className="text-amber-600 hover:text-amber-500 font-medium">
              Start shopping →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
