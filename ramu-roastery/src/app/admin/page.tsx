"use client";
import { useEffect, useState } from "react";
import SalesChart from "../../components/admin/SalesChart";
import Link from "next/link";
import Image from "next/image";

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then(res => res.json())
      .then(resData => {
        setData(resData);
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <p style={{ color: '#6b7280', fontWeight: '500' }}>Loading Command Center...</p>
      </div>
    );
  }

  if (!data) return <p>Failed to load dashboard data.</p>;

  // Helpers for KPI
  const calculateTrend = (current: number, last: number) => {
    if (last === 0) return current > 0 ? 100 : 0;
    return ((current - last) / last) * 100;
  };

  const renderTrend = (current: number, last: number) => {
    const trend = calculateTrend(current, last);
    const isPositive = trend >= 0;
    return (
      <span style={{ 
        color: isPositive ? '#10b981' : '#ef4444', 
        fontSize: '0.875rem', 
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem'
      }}>
        {isPositive ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}% vs Last Month
      </span>
    );
  };

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginTop: 0, marginBottom: '0.5rem', color: '#111827' }}>Admin Command Center</h2>
        <p style={{ margin: 0, color: '#6b7280' }}>Overview of your business performance for this month.</p>
      </div>
      
      {/* 1. Actionable Alerts */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2.5rem' }}>
        {data.alerts.pendingOrdersCount > 0 && (
          <Link href="/admin/orders" style={{ textDecoration: 'none' }}>
            <div className="alert-card" style={{ backgroundColor: '#fef2f2', borderLeft: '4px solid #ef4444', padding: '1rem', borderRadius: '0.375rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '1.5rem' }}>📦</span>
              <div>
                <h3 style={{ margin: 0, color: '#991b1b', fontSize: '1rem' }}>Action Required: Pending Orders</h3>
                <p style={{ margin: '0.25rem 0 0 0', color: '#b91c1c', fontSize: '0.875rem' }}>
                  You have <strong>{data.alerts.pendingOrdersCount}</strong> pending order(s) that need to be processed. Click to view.
                </p>
              </div>
            </div>
          </Link>
        )}
        
        {data.alerts.lowStockProducts.length > 0 && (
          <Link href="/admin/products" style={{ textDecoration: 'none' }}>
            <div className="alert-card" style={{ backgroundColor: '#fffbeb', borderLeft: '4px solid #f59e0b', padding: '1rem', borderRadius: '0.375rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '1.5rem' }}>⚠️</span>
              <div>
                <h3 style={{ margin: 0, color: '#b45309', fontSize: '1rem' }}>Low Stock Alert</h3>
                <p style={{ margin: '0.25rem 0 0 0', color: '#d97706', fontSize: '0.875rem' }}>
                  <strong>{data.alerts.lowStockProducts.length}</strong> product(s) are running low on stock (≤ 5 items left).
                </p>
              </div>
            </div>
          </Link>
        )}
      </div>

      {/* 2. KPIs */}
      <h3 style={{ color: '#374151', marginBottom: '1rem' }}>Bulan Ini (This Month)</h3>
      <div className="admin-stats-grid" style={{ marginBottom: '2.5rem' }}>
        <div className="admin-stat-card" style={{ borderLeft: '4px solid #10b981' }}>
          <h3 style={{ color: '#6b7280', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Revenue</h3>
          <p style={{ fontSize: '1.75rem', fontWeight: '700', color: '#111827', margin: '0.5rem 0' }}>
            Rp {data.kpi.revenue.current.toLocaleString('id-ID')}
          </p>
          {renderTrend(data.kpi.revenue.current, data.kpi.revenue.last)}
        </div>
        <div className="admin-stat-card" style={{ borderLeft: '4px solid #3b82f6' }}>
          <h3 style={{ color: '#6b7280', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Orders</h3>
          <p style={{ fontSize: '1.75rem', fontWeight: '700', color: '#111827', margin: '0.5rem 0' }}>
            {data.kpi.orders.current}
          </p>
          {renderTrend(data.kpi.orders.current, data.kpi.orders.last)}
        </div>
        <div className="admin-stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <h3 style={{ color: '#6b7280', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg Order Value</h3>
          <p style={{ fontSize: '1.75rem', fontWeight: '700', color: '#111827', margin: '0.5rem 0' }}>
            Rp {data.kpi.orders.current > 0 ? Math.round(data.kpi.revenue.current / data.kpi.orders.current).toLocaleString('id-ID') : 0}
          </p>
          {/* Trend for AOV */}
          {renderTrend(
            data.kpi.orders.current > 0 ? data.kpi.revenue.current / data.kpi.orders.current : 0, 
            data.kpi.orders.last > 0 ? data.kpi.revenue.last / data.kpi.orders.last : 0
          )}
        </div>
        <div className="admin-stat-card" style={{ borderLeft: '4px solid #8b5cf6' }}>
          <h3 style={{ color: '#6b7280', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Customers</h3>
          <p style={{ fontSize: '1.75rem', fontWeight: '700', color: '#111827', margin: '0.5rem 0' }}>
            {data.kpi.customers.current}
          </p>
          {renderTrend(data.kpi.customers.current, data.kpi.customers.last)}
        </div>
      </div>

      {/* Middle Section: Chart & Top Products */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginBottom: '2.5rem' }}>
        
        {/* 3. Visualisasi Penjualan */}
        <div>
          <SalesChart />
        </div>

        {/* 4. Top Products */}
        <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: '0 0 1.5rem 0', color: '#374151' }}>🔥 Produk Terlaris Bulan Ini</h3>
          
          {data.topProducts.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {data.topProducts.map((prod: any, idx: number) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.75rem' }}>
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem', color: '#111827' }}>{prod.name}</h4>
                    <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Terjual: {prod.quantity} pcs</span>
                  </div>
                  <div style={{ fontWeight: '600', color: '#10b981', fontSize: '0.9rem' }}>
                    Rp {prod.revenue.toLocaleString('id-ID')}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#6b7280', fontSize: '0.875rem', textAlign: 'center', padding: '2rem 0' }}>Belum ada data penjualan produk bulan ini.</p>
          )}
        </div>

      </div>

      {/* 5. Recent Activities */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        
        {/* Recent Orders */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, color: '#374151' }}>Pesanan Terbaru</h3>
            <Link href="/admin/orders" style={{ fontSize: '0.875rem', color: '#3b82f6', textDecoration: 'none' }}>View All &rarr;</Link>
          </div>
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrders.map((order: any, index: number) => (
                  <tr key={order.id}>
                    <td>{index + 1}</td>
                    <td><strong>{order.id.substring(0,8)}...</strong></td>
                    <td>{order.customerName}</td>
                    <td>
                      <span className={`status-badge ${order.status.toLowerCase()}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {data.recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', padding: '1rem', color: '#6b7280' }}>Belum ada pesanan.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Reviews */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, color: '#374151' }}>Ulasan Terbaru</h3>
            <Link href="/admin/reviews" style={{ fontSize: '0.875rem', color: '#3b82f6', textDecoration: 'none' }}>View All &rarr;</Link>
          </div>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {data.alerts.recentReviews.map((review: any) => (
              <div key={review.id} style={{ borderBottom: '1px solid #f3f4f6', paddingBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: '600', fontSize: '0.9rem', color: '#111827' }}>{review.customerName || 'Anonymous'}</span>
                  <span style={{ color: '#f59e0b', fontSize: '0.9rem' }}>{'★'.repeat(review.rating)}{'☆'.repeat(5-review.rating)}</span>
                </div>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#4b5563' }}>"{review.comment}"</p>
                <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Produk: {review.productName}</span>
              </div>
            ))}
            {data.alerts.recentReviews.length === 0 && (
              <p style={{ color: '#6b7280', fontSize: '0.875rem', textAlign: 'center', padding: '1rem 0' }}>Belum ada ulasan.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
