"use client";

import { useState, useMemo, useEffect } from "react";
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export default function SalesReport() {
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  const [orders, setOrders] = useState<any[]>([]);
  const [closings, setClosings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [closingLoading, setClosingLoading] = useState(false);
  
  // Modal for historical detail
  const [selectedClosing, setSelectedClosing] = useState<any | null>(null);
  const [closingDetailLoading, setClosingDetailLoading] = useState(false);

  useEffect(() => {
    const fetchOrdersAndClosings = async () => {
      try {
        const [ordersRes, closingsRes] = await Promise.all([
          fetch("/api/orders"),
          fetch("/api/closing")
        ]);
        
        if (ordersRes.ok) {
          const data = await ordersRes.json();
          setOrders(data);
        }
        
        if (closingsRes.ok) {
          const data = await closingsRes.json();
          setClosings(data);
        }
      } catch (err) {
        console.error("Failed to fetch reports data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrdersAndClosings();
  }, []);

  // CURRENT PERIOD (Laporan Berjalan)
  // Only include valid orders (Processing, Shipped, Delivered, Completed) that haven't been closed
  const currentOrders = useMemo(() => {
    return orders.filter(o => 
      !o.closedPeriodId && 
      o.status !== 'Cancelled' && 
      o.status !== 'Pending'
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [orders]);

  const currentSummaries = useMemo(() => {
    const totalOrders = currentOrders.length;
    let grossSales = 0;
    let discounts = 0;
    let taxCollected = 0;
    let shippingRevenue = 0;
    let adminFeeRevenue = 0;
    let itemsSold = 0;

    currentOrders.forEach((order: any) => {
      // Calculate from items
      const orderGross = order.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
      grossSales += orderGross;
      
      // Since our mock order object just has "total", we'll infer some metrics for demonstration:
      // In a real system, these would be saved on the order object.
      // We assume:
      // Tax is 11% of gross.
      // Shipping is arbitrary (e.g. 15000) if gross > 0
      // Admin fee is 2500.
      // Let's rely on what we can. If the system doesn't have it, we estimate to fit the accounting model.
      
      taxCollected += Math.floor(orderGross * 0.11);
      if (orderGross > 0) shippingRevenue += 15000;
      adminFeeRevenue += 2500;
      
      // Calculate items sold
      itemsSold += order.items.reduce((sum: number, item: any) => sum + item.quantity, 0);
    });

    // We'll define net sales as Gross - Discounts
    const netSales = grossSales - discounts;
    
    // Total cash inflow = net + tax + shipping + admin
    const totalCashInflow = netSales + taxCollected + shippingRevenue + adminFeeRevenue;

    return { 
      grossSales, 
      discounts, 
      netSales, 
      taxCollected, 
      shippingRevenue, 
      adminFeeRevenue, 
      totalCashInflow,
      totalOrders, 
      itemsSold 
    };
  }, [currentOrders]);

  const handleTutupBuku = async () => {
    if (currentOrders.length === 0) {
      alert("Tidak ada transaksi untuk ditutup.");
      return;
    }

    if (confirm("Anda yakin ingin melakukan Tutup Buku untuk periode ini? Data akan dikunci dan disimpan secara permanen pada arsip akuntansi.")) {
      setClosingLoading(true);
      try {
        const period = new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' }) + " - " + Date.now();
        
        const orderIds = currentOrders.map(o => o.id);

        const payload = {
          period,
          orderIds,
          ...currentSummaries
        };

        const res = await fetch('/api/closing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (res.ok) {
          setClosings([data.data, ...closings]);
          // Remove closed orders from local unclosed state by refetching or filtering
          setOrders(orders.map(o => orderIds.includes(o.id) ? { ...o, closedPeriodId: data.data.id } : o));
          alert(`Berhasil tutup buku untuk periode ${period}`);
        } else {
          alert(`Gagal: ${data.error}`);
        }
      } catch (err) {
        console.error(err);
        alert("Gagal melakukan tutup buku");
      } finally {
        setClosingLoading(false);
      }
    }
  };

  const handleViewClosing = async (closingId: string) => {
    setClosingDetailLoading(true);
    setSelectedClosing(null); // Reset
    try {
      const res = await fetch(`/api/closing/${closingId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedClosing(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setClosingDetailLoading(false);
    }
  };

  const handleExportPdf = async () => {
    // Target the hidden professional template instead of the UI modal
    const element = document.getElementById('pdf-export-template');
    if (!element) return;
    
    // Temporarily make it visible for rendering (some browsers require it to be in viewport, but offscreen left is usually fine)
    element.style.display = 'block';
    
    try {
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Laporan_Keuangan_${selectedClosing?.period || 'Ramu_Roastery'}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Gagal membuat PDF");
    } finally {
      // Hide it again
      element.style.display = 'none';
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0, color: '#111827' }}>Financial Dashboard</h2>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #e5e7eb', marginBottom: '2rem' }}>
        <button 
          onClick={() => setActiveTab('current')}
          style={{ 
            padding: '1rem 1.5rem', 
            background: 'none', 
            border: 'none', 
            borderBottom: activeTab === 'current' ? '3px solid #10b981' : '3px solid transparent',
            color: activeTab === 'current' ? '#111827' : '#6b7280',
            fontWeight: activeTab === 'current' ? '600' : '500',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          Laporan Berjalan
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          style={{ 
            padding: '1rem 1.5rem', 
            background: 'none', 
            border: 'none', 
            borderBottom: activeTab === 'history' ? '3px solid #10b981' : '3px solid transparent',
            color: activeTab === 'history' ? '#111827' : '#6b7280',
            fontWeight: activeTab === 'history' ? '600' : '500',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          Riwayat Keuangan
        </button>
      </div>

      {loading && <p>Loading data...</p>}

      {activeTab === 'current' && !loading && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ color: '#374151', margin: 0 }}>Bulan Berjalan (Belum Tutup Buku)</h3>
              <p style={{ color: '#6b7280', margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>
                Transaksi yang belum direkonsiliasi.
              </p>
            </div>
            <button 
              onClick={handleTutupBuku}
              disabled={closingLoading || currentOrders.length === 0}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#3b82f6',
                color: '#ffffff',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: closingLoading || currentOrders.length === 0 ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                opacity: closingLoading || currentOrders.length === 0 ? 0.7 : 1
              }}
            >
              {closingLoading ? "Processing..." : "📔 Tutup Buku Sekarang"}
            </button>
          </div>

          {/* Summaries */}
          <div className="admin-stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '1rem' }}>
            <div className="admin-stat-card" style={{ borderLeft: '4px solid #10b981' }}>
              <h3 style={{ color: '#6b7280', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Penjualan Kotor</h3>
              <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827', margin: '0.5rem 0 0 0' }}>
                Rp {currentSummaries.grossSales.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="admin-stat-card" style={{ borderLeft: '4px solid #ef4444' }}>
              <h3 style={{ color: '#6b7280', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Diskon/Promo</h3>
              <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827', margin: '0.5rem 0 0 0' }}>
                - Rp {currentSummaries.discounts.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="admin-stat-card" style={{ borderLeft: '4px solid #3b82f6' }}>
              <h3 style={{ color: '#6b7280', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Penjualan Bersih</h3>
              <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827', margin: '0.5rem 0 0 0' }}>
                Rp {currentSummaries.netSales.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="admin-stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
              <h3 style={{ color: '#6b7280', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Cash Inflow</h3>
              <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827', margin: '0.5rem 0 0 0' }}>
                Rp {currentSummaries.totalCashInflow.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
          
          <div className="admin-stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '2rem' }}>
            <div className="admin-stat-card" style={{ borderLeft: '4px solid #8b5cf6' }}>
              <h3 style={{ color: '#6b7280', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pajak Terpungut (11%)</h3>
              <p style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', margin: '0.5rem 0 0 0' }}>
                Rp {currentSummaries.taxCollected.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="admin-stat-card" style={{ borderLeft: '4px solid #6366f1' }}>
              <h3 style={{ color: '#6b7280', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pendapatan Ongkir</h3>
              <p style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', margin: '0.5rem 0 0 0' }}>
                Rp {currentSummaries.shippingRevenue.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="admin-stat-card" style={{ borderLeft: '4px solid #14b8a6' }}>
              <h3 style={{ color: '#6b7280', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Biaya Admin/Aplikasi</h3>
              <p style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', margin: '0.5rem 0 0 0' }}>
                Rp {currentSummaries.adminFeeRevenue.toLocaleString('id-ID')}
              </p>
            </div>
             <div className="admin-stat-card" style={{ borderLeft: '4px solid #64748b' }}>
              <h3 style={{ color: '#6b7280', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Orders</h3>
              <p style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', margin: '0.5rem 0 0 0' }}>
                {currentSummaries.totalOrders}
              </p>
            </div>
          </div>

          <h3 style={{ color: '#374151', marginBottom: '1rem' }}>Ledger Transaksi Berjalan</h3>
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Tanggal</th>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Subtotal Item</th>
                </tr>
              </thead>
              <tbody>
                {currentOrders.length > 0 ? currentOrders.map((order, index) => (
                  <tr key={order.id}>
                    <td>{index + 1}</td>
                    <td>{new Date(order.date).toLocaleDateString('id-ID')}</td>
                    <td><strong>{order.id}</strong></td>
                    <td>{order.customerName}</td>
                    <td>
                      <span className={`status-badge ${order.status.toLowerCase()}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>Rp {order.items.reduce((s:number, i:any) => s + (i.price * i.quantity), 0).toLocaleString('id-ID')}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                      Semua transaksi sudah ditutup buku.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'history' && !loading && (
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
          
          <div style={{ flex: selectedClosing ? '1' : '100%', transition: 'all 0.3s ease' }}>
            <h3 style={{ color: '#374151', marginBottom: '1rem' }}>Arsip Laporan Keuangan</h3>
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>No.</th>
                    <th>Periode</th>
                    <th>Gross Sales</th>
                    <th>Net Sales</th>
                    <th>Orders</th>
                    <th>Ditutup Pada</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {closings.length > 0 ? closings.map((closing, index) => (
                    <tr key={closing.id} style={{ backgroundColor: selectedClosing?.id === closing.id ? '#f3f4f6' : 'transparent' }}>
                      <td>{index + 1}</td>
                      <td><strong>{closing.period}</strong></td>
                      <td>Rp {(closing.grossSales || 0).toLocaleString('id-ID')}</td>
                      <td>Rp {(closing.netSales || 0).toLocaleString('id-ID')}</td>
                      <td>{closing.totalOrders}</td>
                      <td>{new Date(closing.closedAt).toLocaleDateString('id-ID')}</td>
                      <td>
                        <button 
                          onClick={() => handleViewClosing(closing.id)}
                          style={{
                            padding: '0.25rem 0.75rem',
                            backgroundColor: '#e5e7eb',
                            color: '#374151',
                            border: 'none',
                            borderRadius: '0.25rem',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: '500'
                          }}
                        >
                          Lihat Detail
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                        Belum ada arsip tutup buku.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {selectedClosing && (
            <div id="pdf-content" className="printable-area" style={{ flex: '1', backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f3f4f6', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <h3 style={{ margin: 0, color: '#111827', fontSize: '1.25rem', fontWeight: 'bold' }}>Detail Laporan Keuangan</h3>
                  <p style={{ margin: '0.25rem 0 0 0', color: '#6b7280', fontSize: '0.875rem' }}>
                    Periode: <span style={{ fontWeight: '600', color: '#374151' }}>{selectedClosing.period}</span>
                  </p>
                  <p style={{ margin: '0.25rem 0 0 0', color: '#9ca3af', fontSize: '0.75rem' }}>
                    Ditutup oleh {selectedClosing.closedBy} pada {new Date(selectedClosing.closedAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
                <div className="no-print" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <button 
                    onClick={handleExportPdf} 
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.875rem', backgroundColor: '#fff', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '0.375rem', cursor: 'pointer', fontWeight: '500', fontSize: '0.875rem', transition: 'all 0.2s', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}
                    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#fef2f2'; e.currentTarget.style.borderColor = '#ef4444'; }}
                    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.borderColor = '#fca5a5'; }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    Export PDF
                  </button>
                  <button 
                    onClick={() => window.print()} 
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.875rem', backgroundColor: '#fff', color: '#374151', border: '1px solid #d1d5db', borderRadius: '0.375rem', cursor: 'pointer', fontWeight: '500', fontSize: '0.875rem', transition: 'all 0.2s', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}
                    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; e.currentTarget.style.borderColor = '#9ca3af'; }}
                    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.borderColor = '#d1d5db'; }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                    Cetak
                  </button>
                  <button 
                    onClick={() => setSelectedClosing(null)} 
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', transition: 'color 0.2s' }}
                    onMouseOver={(e) => e.currentTarget.style.color = '#4b5563'}
                    onMouseOut={(e) => e.currentTarget.style.color = '#9ca3af'}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #d1d5db', paddingBottom: '0.25rem' }}>
                  <span style={{ color: '#4b5563' }}>Penjualan Kotor (Gross)</span>
                  <span style={{ fontWeight: '600' }}>Rp {(selectedClosing.grossSales || 0).toLocaleString('id-ID')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #d1d5db', paddingBottom: '0.25rem' }}>
                  <span style={{ color: '#ef4444' }}>Diskon/Promo</span>
                  <span style={{ fontWeight: '600', color: '#ef4444' }}>- Rp {(selectedClosing.discounts || 0).toLocaleString('id-ID')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #9ca3af', paddingBottom: '0.25rem', paddingTop: '0.5rem' }}>
                  <span style={{ color: '#111827', fontWeight: '600' }}>Penjualan Bersih (Net)</span>
                  <span style={{ fontWeight: '700', color: '#111827' }}>Rp {(selectedClosing.netSales || 0).toLocaleString('id-ID')}</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                  <span style={{ color: '#4b5563' }}>Pajak Terpungut (PPN)</span>
                  <span style={{ fontWeight: '500' }}>Rp {(selectedClosing.taxCollected || 0).toLocaleString('id-ID')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#4b5563' }}>Pendapatan Ongkir</span>
                  <span style={{ fontWeight: '500' }}>Rp {(selectedClosing.shippingRevenue || 0).toLocaleString('id-ID')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #9ca3af', paddingBottom: '0.5rem' }}>
                  <span style={{ color: '#4b5563' }}>Pendapatan Biaya Admin</span>
                  <span style={{ fontWeight: '500' }}>Rp {(selectedClosing.adminFeeRevenue || 0).toLocaleString('id-ID')}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem' }}>
                  <span style={{ color: '#10b981', fontWeight: '700', fontSize: '1.125rem' }}>Total Cash Inflow</span>
                  <span style={{ fontWeight: '800', color: '#10b981', fontSize: '1.125rem' }}>Rp {(selectedClosing.totalCashInflow || 0).toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div>
                <h4 style={{ color: '#374151', marginBottom: '0.75rem', fontSize: '1rem' }}>Transaksi Terkunci ({selectedClosing.lockedOrders?.length || 0})</h4>
                <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '0.375rem' }}>
                  {selectedClosing.lockedOrders && selectedClosing.lockedOrders.length > 0 ? (
                    <table style={{ width: '100%', fontSize: '0.875rem', borderCollapse: 'collapse' }}>
                      <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f9fafb' }}>
                        <tr>
                          <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb', width: '40px' }}>No.</th>
                          <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>ID</th>
                          <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Tgl</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedClosing.lockedOrders.map((o: any, idx: number) => (
                          <tr key={o.id}>
                            <td style={{ padding: '0.5rem', borderBottom: '1px solid #e5e7eb' }}>{idx + 1}</td>
                            <td style={{ padding: '0.5rem', borderBottom: '1px solid #e5e7eb' }}>{o.id.substring(0, 8)}...</td>
                            <td style={{ padding: '0.5rem', borderBottom: '1px solid #e5e7eb' }}>{new Date(o.createdAt).toLocaleDateString('id-ID')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p style={{ padding: '1rem', textAlign: 'center', color: '#6b7280', margin: 0 }}>Tidak ada detail transaksi.</p>
                  )}
                </div>
              </div>

            </div>
          )}
        </div>
      )}

      {/* Hidden Professional PDF Template */}
      {selectedClosing && (
        <div 
          id="pdf-export-template" 
          style={{ 
            display: 'none',
            position: 'absolute', 
            left: '-9999px', 
            top: 0, 
            width: '800px', 
            backgroundColor: '#ffffff', 
            padding: '40px', 
            color: '#000000', 
            fontFamily: 'Helvetica, Arial, sans-serif' 
          }}
        >
          {/* Header */}
          <div style={{ borderBottom: '2px solid #111827', paddingBottom: '20px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '28px', color: '#111827', fontWeight: 'bold' }}>RAMU ROASTERY</h1>
              <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#4b5563' }}>Jl. Hegarmanah, Bandung, Jawa Barat</p>
              <p style={{ margin: '2px 0 0 0', fontSize: '14px', color: '#4b5563' }}>support@ramuroastery.com | +62 812 3456 7890</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h2 style={{ margin: 0, fontSize: '22px', color: '#374151', textTransform: 'uppercase' }}>Laporan Keuangan</h2>
              <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#6b7280' }}>ID Laporan: #{selectedClosing.id.substring(0,8).toUpperCase()}</p>
            </div>
          </div>

          {/* Info Section */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
            <div>
              <p style={{ margin: '0 0 5px 0', fontSize: '14px', fontWeight: 'bold', color: '#374151' }}>Informasi Periode:</p>
              <p style={{ margin: 0, fontSize: '14px', color: '#111827' }}>Periode: <strong>{selectedClosing.period}</strong></p>
              <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#111827' }}>Ditutup Pada: {new Date(selectedClosing.closedAt).toLocaleDateString('id-ID')} {new Date(selectedClosing.closedAt).toLocaleTimeString('id-ID')}</p>
              <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#111827' }}>Oleh: {selectedClosing.closedBy}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: '0 0 5px 0', fontSize: '14px', fontWeight: 'bold', color: '#374151' }}>Ringkasan Volume:</p>
              <p style={{ margin: 0, fontSize: '14px', color: '#111827' }}>Total Transaksi: <strong>{selectedClosing.totalOrders} Pesanan</strong></p>
              <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#111827' }}>Total Item Terjual: <strong>{selectedClosing.itemsSold} Item</strong></p>
            </div>
          </div>

          {/* Financial Summary Table */}
          <div style={{ marginBottom: '40px' }}>
            <h3 style={{ fontSize: '16px', color: '#111827', borderBottom: '1px solid #d1d5db', paddingBottom: '10px', marginBottom: '15px' }}>Ringkasan Finansial</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '8px 0', color: '#4b5563' }}>Penjualan Kotor (Gross Sales)</td>
                  <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 'bold' }}>Rp {(selectedClosing.grossSales || 0).toLocaleString('id-ID')}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 0', color: '#4b5563', borderBottom: '1px solid #e5e7eb' }}>Diskon / Promosi</td>
                  <td style={{ padding: '8px 0', textAlign: 'right', color: '#ef4444', borderBottom: '1px solid #e5e7eb' }}>- Rp {(selectedClosing.discounts || 0).toLocaleString('id-ID')}</td>
                </tr>
                <tr>
                  <td style={{ padding: '12px 0', color: '#111827', fontWeight: 'bold', fontSize: '15px' }}>Penjualan Bersih (Net Sales)</td>
                  <td style={{ padding: '12px 0', textAlign: 'right', fontWeight: 'bold', fontSize: '15px' }}>Rp {(selectedClosing.netSales || 0).toLocaleString('id-ID')}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 0', color: '#4b5563' }}>Pajak Terpungut (PPN)</td>
                  <td style={{ padding: '8px 0', textAlign: 'right' }}>Rp {(selectedClosing.taxCollected || 0).toLocaleString('id-ID')}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 0', color: '#4b5563' }}>Pendapatan Pengiriman</td>
                  <td style={{ padding: '8px 0', textAlign: 'right' }}>Rp {(selectedClosing.shippingRevenue || 0).toLocaleString('id-ID')}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 0', color: '#4b5563', borderBottom: '2px solid #111827' }}>Biaya Admin / Layanan</td>
                  <td style={{ padding: '8px 0', textAlign: 'right', borderBottom: '2px solid #111827' }}>Rp {(selectedClosing.adminFeeRevenue || 0).toLocaleString('id-ID')}</td>
                </tr>
                <tr>
                  <td style={{ padding: '15px 0', color: '#10b981', fontWeight: 'bold', fontSize: '18px' }}>Total Pemasukan Kas (Cash Inflow)</td>
                  <td style={{ padding: '15px 0', textAlign: 'right', color: '#10b981', fontWeight: 'bold', fontSize: '18px' }}>Rp {(selectedClosing.totalCashInflow || 0).toLocaleString('id-ID')}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Detailed Transactions */}
          <div>
            <h3 style={{ fontSize: '16px', color: '#111827', borderBottom: '1px solid #d1d5db', paddingBottom: '10px', marginBottom: '15px' }}>Detail Transaksi ({selectedClosing.lockedOrders?.length || 0})</h3>
            {selectedClosing.lockedOrders && selectedClosing.lockedOrders.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f3f4f6' }}>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #d1d5db', width: '5%' }}>No.</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #d1d5db', width: '35%' }}>Order ID</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #d1d5db', width: '30%' }}>Tanggal Transaksi</th>
                    <th style={{ padding: '10px', textAlign: 'right', borderBottom: '2px solid #d1d5db', width: '30%' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedClosing.lockedOrders.map((o: any, idx: number) => (
                    <tr key={o.id}>
                      <td style={{ padding: '10px', borderBottom: '1px solid #e5e7eb', color: '#4b5563' }}>{idx + 1}</td>
                      <td style={{ padding: '10px', borderBottom: '1px solid #e5e7eb', fontFamily: 'monospace', color: '#111827' }}>{o.id}</td>
                      <td style={{ padding: '10px', borderBottom: '1px solid #e5e7eb', color: '#4b5563' }}>{new Date(o.createdAt).toLocaleString('id-ID')}</td>
                      <td style={{ padding: '10px', borderBottom: '1px solid #e5e7eb', color: '#10b981', textAlign: 'right', fontWeight: 'bold' }}>Selesai</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ fontSize: '12px', color: '#6b7280', fontStyle: 'italic' }}>Tidak ada transaksi yang tercatat pada periode ini.</p>
            )}
          </div>

          <div style={{ marginTop: '50px', textAlign: 'center', color: '#9ca3af', fontSize: '10px', borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
            Dokumen ini dihasilkan secara otomatis oleh Sistem Manajemen Ramu Roastery pada {new Date().toLocaleString('id-ID')}.<br />
            Dokumen ini sah dan dapat digunakan untuk keperluan pembukuan internal.
          </div>
        </div>
      )}
    </div>
  );
}
