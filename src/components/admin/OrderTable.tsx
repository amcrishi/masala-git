'use client';

import { useState } from 'react';
import type { IOrder } from '@/types';

interface OrderTableProps {
  orders: IOrder[];
  onStatusUpdate: (id: string, status: string) => void;
}

export default function OrderTable({ orders, onStatusUpdate }: OrderTableProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        onStatusUpdate(orderId, newStatus);
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setUpdatingId(null);
    }
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  const paymentColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    refunded: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-amber-50">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-semibold text-amber-900">Order ID</th>
              <th className="text-left px-6 py-3 text-sm font-semibold text-amber-900">Customer</th>
              <th className="text-left px-6 py-3 text-sm font-semibold text-amber-900">Amount</th>
              <th className="text-left px-6 py-3 text-sm font-semibold text-amber-900">Payment</th>
              <th className="text-left px-6 py-3 text-sm font-semibold text-amber-900">Status</th>
              <th className="text-left px-6 py-3 text-sm font-semibold text-amber-900">Date</th>
              <th className="text-right px-6 py-3 text-sm font-semibold text-amber-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.map((order) => (
              <tr key={order._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-mono text-sm text-gray-900">
                  #{order._id.slice(-8)}
                </td>
                <td className="px-6 py-4 text-gray-900">
                  {typeof order.user === 'object' && order.user !== null
                    ? (order.user as { name?: string }).name || 'Unknown'
                    : 'Unknown'}
                </td>
                <td className="px-6 py-4 font-semibold text-gray-900">₹{order.totalAmount}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${paymentColors[order.paymentStatus]}`}>
                    {order.paymentStatus}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(order.createdAt).toLocaleDateString('en-IN')}
                </td>
                <td className="px-6 py-4 text-right">
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order._id, e.target.value)}
                    disabled={updatingId === order._id}
                    className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {orders.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <span className="text-4xl block mb-2">📦</span>
          <p>No orders found</p>
        </div>
      )}
    </div>
  );
}
