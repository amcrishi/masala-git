'use client';

import { useEffect, useState, useRef } from 'react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

interface AnalyticsData {
  summary: {
    totalProducts: number;
    totalOrders: number;
    totalUsers: number;
    totalRevenue: number;
    lowStockProducts: number;
    outOfStockProducts: number;
    newUsersLast30Days: number;
    newOrdersLast30Days: number;
  };
  breakdown: {
    ordersByStatus: Record<string, number>;
    ordersByPayment: Record<string, number>;
    usersByRole: Record<string, number>;
    productsByCategory: Array<{ _id: string; count: number; totalStock: number }>;
  };
  topProducts: Array<{
    _id: string;
    name?: string;
    category?: string;
    quantitySold: number;
    revenue: number;
  }>;
  recentOrders: Array<{
    _id: string;
    totalAmount: number;
    status: string;
    paymentStatus: string;
    createdAt: string;
    user?: { name?: string; email?: string };
  }>;
  timeline: {
    revenueLast7Days: Array<{ _id: string; revenue: number }>;
    ordersLast7Days: Array<{ _id: string; count: number }>;
  };
}

const categoryLabels: Record<string, string> = {
  'whole-spices': 'Whole Spices',
  'ground-spices': 'Ground Spices',
  'blended-masala': 'Blended Masala',
  herbs: 'Herbs',
  seasoning: 'Seasoning',
  organic: 'Organic',
  premium: 'Premium',
  'combo-packs': 'Combo Packs',
};

const statusColorMap: Record<string, string> = {
  pending: '#eab308',
  confirmed: '#3b82f6',
  shipped: '#a855f7',
  delivered: '#22c55e',
  cancelled: '#ef4444',
  paid: '#22c55e',
  failed: '#ef4444',
  refunded: '#6b7280',
};

const statusBadge: Record<string, string> = {
  pending: 'bg-yellow-500',
  confirmed: 'bg-blue-500',
  shipped: 'bg-purple-500',
  delivered: 'bg-green-500',
  cancelled: 'bg-red-500',
  paid: 'bg-green-500',
  failed: 'bg-red-500',
  refunded: 'bg-gray-500',
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const revenueChartRef = useRef<HighchartsReact.RefObject>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch('/api/analytics');
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        } else {
          setError(json.error || 'Failed to load analytics');
        }
      } catch {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (loading) return <div className="py-20"><LoadingSpinner size="lg" /></div>;
  if (error) return <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">{error}</div>;
  if (!data) return null;

  const { summary, breakdown, topProducts, recentOrders, timeline } = data;

  // Revenue area chart
  const revenueChartOptions: Highcharts.Options = {
    chart: { type: 'areaspline', height: 320, backgroundColor: 'transparent' },
    title: { text: 'Revenue (Last 7 Days)', style: { fontSize: '16px', fontWeight: '700', color: '#1f2937' } },
    xAxis: {
      categories: timeline.revenueLast7Days.map((d) =>
        new Date(d._id).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
      ),
      labels: { style: { color: '#6b7280', fontSize: '11px' } },
    },
    yAxis: { title: { text: '' }, labels: { format: '₹{value}', style: { color: '#6b7280' } }, gridLineColor: '#f3f4f6' },
    tooltip: { pointFormat: '<b>₹{point.y:,.0f}</b>', headerFormat: '<span style="font-size:12px">{point.key}</span><br/>' },
    series: [{
      type: 'areaspline',
      name: 'Revenue',
      data: timeline.revenueLast7Days.map((d) => d.revenue),
      color: '#d97706',
      fillColor: { linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 }, stops: [[0, 'rgba(217,119,6,0.4)'], [1, 'rgba(217,119,6,0.02)']] },
      marker: { fillColor: '#d97706', lineWidth: 2, lineColor: '#fff', radius: 5 },
    }],
    legend: { enabled: false },
    credits: { enabled: false },
  };

  // Orders column chart
  const ordersChartOptions: Highcharts.Options = {
    chart: { type: 'column', height: 320, backgroundColor: 'transparent' },
    title: { text: 'Orders (Last 7 Days)', style: { fontSize: '16px', fontWeight: '700', color: '#1f2937' } },
    xAxis: {
      categories: timeline.ordersLast7Days.map((d) =>
        new Date(d._id).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
      ),
      labels: { style: { color: '#6b7280', fontSize: '11px' } },
    },
    yAxis: { title: { text: '' }, allowDecimals: false, gridLineColor: '#f3f4f6' },
    tooltip: { pointFormat: '<b>{point.y} orders</b>' },
    plotOptions: { column: { borderRadius: 6, color: { linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 }, stops: [[0, '#3b82f6'], [1, '#6366f1']] } } },
    series: [{ type: 'column', name: 'Orders', data: timeline.ordersLast7Days.map((d) => d.count) }],
    legend: { enabled: false },
    credits: { enabled: false },
  };

  // Order status pie
  const orderStatusPie: Highcharts.Options = {
    chart: { type: 'pie', height: 300, backgroundColor: 'transparent' },
    title: { text: 'Order Status', style: { fontSize: '16px', fontWeight: '700', color: '#1f2937' } },
    tooltip: { pointFormat: '<b>{point.y}</b> ({point.percentage:.1f}%)' },
    plotOptions: { pie: { allowPointSelect: true, cursor: 'pointer', dataLabels: { enabled: true, format: '<b>{point.name}</b>: {point.y}', style: { fontSize: '11px' } }, borderRadius: 4 } },
    series: [{
      type: 'pie',
      data: Object.entries(breakdown.ordersByStatus).map(([name, y]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        y,
        color: statusColorMap[name] || '#9ca3af',
      })),
    }],
    credits: { enabled: false },
  };

  // Payment status donut
  const paymentPie: Highcharts.Options = {
    chart: { type: 'pie', height: 300, backgroundColor: 'transparent' },
    title: { text: 'Payment Status', style: { fontSize: '16px', fontWeight: '700', color: '#1f2937' } },
    tooltip: { pointFormat: '<b>{point.y}</b> ({point.percentage:.1f}%)' },
    plotOptions: { pie: { innerSize: '55%', allowPointSelect: true, cursor: 'pointer', dataLabels: { enabled: true, format: '<b>{point.name}</b>: {point.y}', style: { fontSize: '11px' } }, borderRadius: 4 } },
    series: [{
      type: 'pie',
      data: Object.entries(breakdown.ordersByPayment).map(([name, y]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        y,
        color: statusColorMap[name] || '#9ca3af',
      })),
    }],
    credits: { enabled: false },
  };

  // Top products bar chart
  const topProductsChart: Highcharts.Options = {
    chart: { type: 'bar', height: 280, backgroundColor: 'transparent' },
    title: { text: 'Top Selling Products', style: { fontSize: '16px', fontWeight: '700', color: '#1f2937' } },
    xAxis: {
      categories: topProducts.map((p) => p.name || 'Unknown'),
      labels: { style: { color: '#374151', fontSize: '12px' } },
    },
    yAxis: { title: { text: '' }, gridLineColor: '#f3f4f6' },
    tooltip: { pointFormat: '{series.name}: <b>{point.y}</b>' },
    plotOptions: { bar: { borderRadius: 4 } },
    series: [
      { type: 'bar', name: 'Qty Sold', data: topProducts.map((p) => p.quantitySold), color: '#d97706' },
      { type: 'bar', name: 'Revenue (₹)', data: topProducts.map((p) => p.revenue), color: '#22c55e' },
    ],
    credits: { enabled: false },
  };

  // Category column chart
  const categoryChart: Highcharts.Options = {
    chart: { type: 'column', height: 300, backgroundColor: 'transparent' },
    title: { text: 'Products by Category', style: { fontSize: '16px', fontWeight: '700', color: '#1f2937' } },
    xAxis: {
      categories: breakdown.productsByCategory.map((c) => categoryLabels[c._id] || c._id),
      labels: { style: { color: '#374151', fontSize: '11px' }, rotation: -30 },
    },
    yAxis: [
      { title: { text: 'Products' }, allowDecimals: false },
      { title: { text: 'Stock' }, opposite: true, allowDecimals: false },
    ],
    tooltip: { shared: true },
    plotOptions: { column: { borderRadius: 4 } },
    series: [
      { type: 'column', name: 'Products', data: breakdown.productsByCategory.map((c) => c.count), color: '#d97706', yAxis: 0 },
      { type: 'column', name: 'Total Stock', data: breakdown.productsByCategory.map((c) => c.totalStock), color: '#6366f1', yAxis: 1 },
    ],
    credits: { enabled: false },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-amber-900">Analytics Dashboard</h1>
        <p className="text-gray-500 mt-1">Real-time insights into your business performance</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="💰" label="Total Revenue" value={`₹${summary.totalRevenue.toLocaleString('en-IN')}`} sublabel="All-time paid" color="from-green-500 to-emerald-600" />
        <StatCard icon="🛒" label="Total Orders" value={summary.totalOrders.toString()} sublabel={`+${summary.newOrdersLast30Days} last 30 days`} color="from-blue-500 to-indigo-600" />
        <StatCard icon="📦" label="Products" value={summary.totalProducts.toString()} sublabel={`${summary.lowStockProducts} low stock`} color="from-amber-500 to-orange-600" />
        <StatCard icon="👥" label="Total Users" value={summary.totalUsers.toString()} sublabel={`+${summary.newUsersLast30Days} last 30 days`} color="from-purple-500 to-pink-600" />
      </div>

      {/* Alerts */}
      {(summary.outOfStockProducts > 0 || summary.lowStockProducts > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {summary.outOfStockProducts > 0 && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
              <div className="flex items-center">
                <span className="text-2xl mr-3">⚠️</span>
                <div>
                  <h3 className="font-semibold text-red-900">Out of Stock</h3>
                  <p className="text-sm text-red-700">{summary.outOfStockProducts} products are out of stock</p>
                </div>
              </div>
            </div>
          )}
          {summary.lowStockProducts > 0 && (
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg">
              <div className="flex items-center">
                <span className="text-2xl mr-3">📉</span>
                <div>
                  <h3 className="font-semibold text-yellow-900">Low Stock</h3>
                  <p className="text-sm text-yellow-700">{summary.lowStockProducts} products have ≤ 10 units</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Revenue + Orders Charts (Highcharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-4">
          {timeline.revenueLast7Days.length === 0 ? (
            <div className="py-20 text-center text-gray-400">No revenue data yet</div>
          ) : (
            <HighchartsReact highcharts={Highcharts} options={revenueChartOptions} ref={revenueChartRef} />
          )}
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          {timeline.ordersLast7Days.length === 0 ? (
            <div className="py-20 text-center text-gray-400">No orders yet</div>
          ) : (
            <HighchartsReact highcharts={Highcharts} options={ordersChartOptions} />
          )}
        </div>
      </div>

      {/* Order Status + Payment Status (Pie Charts) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-4">
          {Object.keys(breakdown.ordersByStatus).length === 0 ? (
            <div className="py-20 text-center text-gray-400">No orders yet</div>
          ) : (
            <HighchartsReact highcharts={Highcharts} options={orderStatusPie} />
          )}
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          {Object.keys(breakdown.ordersByPayment).length === 0 ? (
            <div className="py-20 text-center text-gray-400">No payments yet</div>
          ) : (
            <HighchartsReact highcharts={Highcharts} options={paymentPie} />
          )}
        </div>
      </div>

      {/* Top Products (Bar Chart) */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        {topProducts.length === 0 ? (
          <div className="py-12 text-center text-gray-400">No sales data yet</div>
        ) : (
          <HighchartsReact highcharts={Highcharts} options={topProductsChart} />
        )}
      </div>

      {/* Category + Users by Role */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-4">
          {breakdown.productsByCategory.length === 0 ? (
            <div className="py-12 text-center text-gray-400">No products yet</div>
          ) : (
            <HighchartsReact highcharts={Highcharts} options={categoryChart} />
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Users by Role</h2>
          <div className="space-y-3">
            {Object.entries(breakdown.usersByRole).map(([role, count]) => {
              const colors: Record<string, string> = {
                admin: 'bg-red-100 text-red-700',
                technician: 'bg-blue-100 text-blue-700',
                user: 'bg-gray-100 text-gray-700',
              };
              return (
                <div key={role} className={`flex items-center justify-between p-4 rounded-lg ${colors[role] || colors.user}`}>
                  <span className="font-medium capitalize">{role}</span>
                  <span className="text-2xl font-bold">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Orders</h2>
        {recentOrders.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No recent orders</p>
        ) : (
          <div className="space-y-2">
            {recentOrders.map((o) => (
              <div key={o._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-mono text-sm text-gray-700">#{o._id.slice(-8)}</div>
                  <div className="text-xs text-gray-500">{o.user?.name || 'Unknown'} · {new Date(o.createdAt).toLocaleString('en-IN')}</div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 rounded-full text-xs text-white ${statusBadge[o.status] || 'bg-gray-400'} capitalize`}>{o.status}</span>
                  <span className="font-semibold text-amber-700">₹{o.totalAmount}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sublabel, color }: { icon: string; label: string; value: string; sublabel: string; color: string }) {
  return (
    <div className={`bg-gradient-to-br ${color} rounded-xl p-6 text-white shadow-lg`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-3xl mb-2">{icon}</div>
          <div className="text-3xl font-bold">{value}</div>
          <div className="text-sm opacity-90 mt-1">{label}</div>
        </div>
      </div>
      <div className="text-xs opacity-75 mt-3">{sublabel}</div>
    </div>
  );
}
