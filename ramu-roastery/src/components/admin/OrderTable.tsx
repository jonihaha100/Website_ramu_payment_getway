"use client";

import { useState, useEffect } from "react";
import { Order } from "../../data/mockOrders";

export default function OrderTable() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<string>("All");
  const [viewProofUrl, setViewProofUrl] = useState<string | null>(null);
  
  // Tracking Modal State
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);
  const [trackingForm, setTrackingForm] = useState({ courier: '', trackingNumber: '' });
  
  // Detail Modal State
  const [viewDetailOrder, setViewDetailOrder] = useState<Order | null>(null);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      setOrders(data);
    } catch (_err) {
      console.error(_err);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrders();
  }, []);

  const filteredOrders = filter === "All" ? orders : orders.filter(o => o.status === filter);

  const handleFilter = (status: string) => {
    setFilter(status);
  };

  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    const orderToUpdate = orders.find(o => o.id === orderId);
    if (!orderToUpdate) return;
    
    try {
      await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...orderToUpdate, status: newStatus })
      });
      fetchOrders();
      alert(`Order ${orderId} status updated to ${newStatus}`);
    } catch (_err) {
      alert("Failed to update status");
    }
  };

  const handleSaveTracking = async () => {
    if (!trackingOrder) return;
    
    // Hapus logic manual history, cukup simpan resi dan kurir
    const updatedOrder = {
      ...trackingOrder,
      courier: trackingForm.courier || trackingOrder.courier,
      trackingNumber: trackingForm.trackingNumber || trackingOrder.trackingNumber,
      // Hapus trackingHistory manual
      trackingHistory: [] 
    };

    try {
      await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedOrder)
      });
      setTrackingOrder(null);
      setTrackingForm({ courier: '', trackingNumber: '' });
      fetchOrders();
      alert("Tracking information updated successfully!");
    } catch (_err) {
      alert("Failed to update tracking");
    }
  };

  const getOrderBadges = (order: Order) => {
    const isVip = order.isVip || (order as any).customerRole === 'VIP' || order.notes?.toLowerCase().includes('vip') || order.items?.some(i => i.isSubscription || i.name?.toLowerCase().includes('sub'));
    const isTebeng = order.isTebeng || order.shippingMethod?.toLowerCase().includes('tebeng') || order.notes?.toLowerCase().includes('tebeng');
    const isB2b = order.isB2b || order.items?.some(i => (typeof i.weight === 'number' && i.weight >= 1000) || i.name?.includes('1000g') || i.name?.includes('1kg') || i.name?.toLowerCase().includes('b2b')) || order.total >= 1000000;
    const isRef = Boolean(order.referralCode || order.notes?.toLowerCase().includes('ref'));
    return { isVip, isTebeng, isB2b, isRef };
  };

  const getWhatsAppLink = (order: Order) => {
    const phone = (order.customerPhone || "").replace(/^0/, '62').replace(/\D/g, '');
    const resiInfo = (order as any).trackingNumber 
      ? `%0ANomor Resi: *${(order as any).trackingNumber}* (${(order as any).courier || 'Ekspedisi'})` 
      : '';
    const text = `Halo Kak ${order.customerName}, salam dari Ramu Roastery! ☕%0A%0AUpdate status pesanan Anda *#${order.id}*:%0AStatus: *${order.status}*${resiInfo}%0ATotal: Rp ${order.total.toLocaleString('id-ID')}%0A%0ATerima kasih sudah berbelanja kopi fresh di Ramu Roastery! Jika ada pertanyaan mengenai pesanan, silakan balas pesan ini.`;
    return `https://wa.me/${phone || '6281234567890'}?text=${text}`;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0, color: '#111827' }}>Order Monitoring</h2>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map(status => (
            <button
              key={status}
              onClick={() => handleFilter(status)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.25rem',
                border: '1px solid #d1d5db',
                backgroundColor: filter === status ? '#111827' : '#ffffff',
                color: filter === status ? '#ffffff' : '#374151',
                cursor: 'pointer',
                fontWeight: filter === status ? '600' : '400',
              }}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>No.</th>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Total Amount</th>
              <th>Status</th>
              <th>Action</th>
              <th>Proof</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length > 0 ? filteredOrders.map((order, index) => {
              const { isVip, isTebeng, isB2b, isRef } = getOrderBadges(order);
              return (
              <tr key={order.id}>
                <td>{index + 1}</td>
                <td>
                  <strong>{order.id}</strong>
                  {(order as Order & { trackingNumber?: string }).trackingNumber && (
                    <div style={{ fontSize: '0.7rem', color: '#3b82f6', marginTop: '0.2rem' }}>
                      Resi: {(order as Order & { trackingNumber?: string }).trackingNumber}
                    </div>
                  )}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginTop: '4px' }}>
                    {isVip && <span style={{ padding: '1px 5px', borderRadius: '3px', fontSize: '0.65rem', fontWeight: 700, background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>👑 VIP</span>}
                    {isTebeng && <span style={{ padding: '1px 5px', borderRadius: '3px', fontSize: '0.65rem', fontWeight: 700, background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' }}>📦 Tebeng</span>}
                    {isB2b && <span style={{ padding: '1px 5px', borderRadius: '3px', fontSize: '0.65rem', fontWeight: 700, background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe' }}>☕ B2B</span>}
                    {isRef && <span style={{ padding: '1px 5px', borderRadius: '3px', fontSize: '0.65rem', fontWeight: 700, background: '#fdf2f8', color: '#9d174d', border: '1px solid #fbcfe8' }}>👥 Ref</span>}
                  </div>
                </td>
                <td>
                  <div>{order.customerName}</div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{order.customerEmail}</div>
                </td>
                <td>{new Date(order.date).toLocaleString('id-ID')}</td>
                <td>Rp {order.total.toLocaleString('id-ID')}</td>
                <td>
                  <span className={`status-badge ${order.status.toLowerCase()}`}>
                    {order.status}
                  </span>
                </td>
                <td>
                  <select 
                    value={order.status} 
                    onChange={(e) => handleStatusChange(order.id, e.target.value as Order['status'])}
                    style={{
                      padding: '0.25rem',
                      borderRadius: '0.25rem',
                      border: '1px solid #d1d5db',
                      backgroundColor: '#f9fafb',
                      cursor: 'pointer',
                      marginBottom: '0.35rem',
                      width: '100%'
                    }}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Processing">Processing</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <button
                      onClick={() => setViewDetailOrder(order)}
                      style={{
                        padding: '0.25rem',
                        borderRadius: '0.25rem',
                        border: '1px solid #3b82f6',
                        backgroundColor: '#eff6ff',
                        color: '#2563eb',
                        cursor: 'pointer',
                        width: '100%',
                        fontSize: '0.72rem',
                        fontWeight: '600'
                      }}
                    >
                      👁️ View Detail
                    </button>
                    <a
                      href={getWhatsAppLink(order)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '3px',
                        padding: '0.25rem',
                        backgroundColor: '#25D366',
                        color: '#ffffff',
                        borderRadius: '0.25rem',
                        fontSize: '0.72rem',
                        fontWeight: '600',
                        textDecoration: 'none',
                        width: '100%'
                      }}
                    >
                      💬 WA Update
                    </a>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {order.paymentProofUrl ? (
                      <button
                        onClick={() => setViewProofUrl(order.paymentProofUrl!)}
                        style={{
                          padding: '0.25rem 0.5rem',
                          backgroundColor: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.25rem',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}
                      >
                        📄 View Proof
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>No Proof</span>
                    )}

                    {(order.status === 'Processing' || order.status === 'Shipped' || order.status === 'Delivered') && (
                      <button
                        onClick={() => {
                          setTrackingOrder(order);
                          setTrackingForm({
                            courier: order.courier || '',
                            trackingNumber: order.trackingNumber || '',
                          });
                        }}
                        style={{
                          padding: '0.25rem 0.5rem',
                          backgroundColor: '#f59e0b',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.25rem',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}
                      >
                        🚚 Update Resi
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          }) : (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>
                  No orders found for the selected filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Payment Proof Modal */}
      {viewProofUrl && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#fff',
            padding: '2rem',
            borderRadius: '0.5rem',
            width: '90%',
            maxWidth: '400px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#111827' }}>Bukti Pembayaran</h3>
              <button 
                onClick={() => setViewProofUrl(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#9ca3af' }}
              >
                ✖
              </button>
            </div>
            
            <div style={{ width: '100%', height: '400px', backgroundColor: '#f3f4f6', borderRadius: '0.5rem', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
               {/* eslint-disable-next-line @next/next/no-img-element */}
               <img src={viewProofUrl} alt="Bukti Transfer" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
              <button 
                onClick={() => setViewProofUrl(null)}
                style={{ width: '100%', padding: '0.75rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', fontWeight: '600' }}
              >
                Tutup & Lanjutkan Validasi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tracking Modal */}
      {trackingOrder && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#fff',
            padding: '2rem',
            borderRadius: '0.5rem',
            width: '90%',
            maxWidth: '500px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#111827' }}>Update Pengiriman (Resi)</h3>
                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Order ID: {trackingOrder.id}</span>
              </div>
              <button onClick={() => setTrackingOrder(null)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#9ca3af' }}>✖</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: '#374151', marginBottom: '0.25rem' }}>Kurir Ekspedisi</label>
                  <select 
                    value={trackingForm.courier}
                    onChange={(e) => setTrackingForm({...trackingForm, courier: e.target.value})}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #d1d5db' }}
                  >
                    <option value="">Pilih Kurir...</option>
                    <option value="JNE">JNE</option>
                    <option value="J&T">J&T Express</option>
                    <option value="Sicepat">Sicepat</option>
                    <option value="GoSend">GoSend</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: '#374151', marginBottom: '0.25rem' }}>Nomor Resi</label>
                  <input 
                    type="text" 
                    value={trackingForm.trackingNumber}
                    onChange={(e) => setTrackingForm({...trackingForm, trackingNumber: e.target.value})}
                    placeholder="Contoh: JNE123456"
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #d1d5db' }}
                  />
                </div>
              </div>




            </div>

            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
              <button 
                onClick={() => setTrackingOrder(null)}
                style={{ flex: 1, padding: '0.75rem', backgroundColor: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', fontWeight: '600' }}
              >
                Batal
              </button>
              <button 
                onClick={handleSaveTracking}
                style={{ flex: 1, padding: '0.75rem', backgroundColor: '#111827', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', fontWeight: '600' }}
              >
                Simpan Tracking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {viewDetailOrder && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#fff',
            padding: '2rem',
            borderRadius: '0.5rem',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#111827' }}>Detail Pesanan</h3>
                <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>Order ID: {viewDetailOrder.id}</span>
                {(() => {
                  const { isVip, isTebeng, isB2b, isRef } = getOrderBadges(viewDetailOrder);
                  return (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                      {isVip && <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>👑 VIP Subscriber</span>}
                      {isTebeng && <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' }}>📦 Tebeng Kirim (Gabung Jadwal)</span>}
                      {isB2b && <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe' }}>☕ B2B Wholesale</span>}
                      {isRef && <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, background: '#fdf2f8', color: '#9d174d', border: '1px solid #fbcfe8' }}>👥 Ref: {viewDetailOrder.referralCode || 'Community Ref'}</span>}
                    </div>
                  );
                })()}
              </div>
              <button onClick={() => setViewDetailOrder(null)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#9ca3af' }}>✖</button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.25rem' }}>
              <div>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#374151', fontSize: '0.9rem' }}>Informasi Pelanggan</h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#111827', fontWeight: 600 }}>{viewDetailOrder.customerName}</p>
                <p style={{ margin: '0.25rem 0', fontSize: '0.85rem', color: '#4b5563' }}>{viewDetailOrder.customerEmail}</p>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#4b5563' }}>{viewDetailOrder.customerPhone}</p>
              </div>
              <div>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#374151', fontSize: '0.9rem' }}>Alamat Pengiriman</h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#4b5563', lineHeight: 1.5 }}>
                  {viewDetailOrder.shippingAddress}
                </p>
              </div>
            </div>

            {/* Custom Grind / Order Notes Banner */}
            {(viewDetailOrder.grindNotes || viewDetailOrder.notes) && (
              <div style={{
                marginBottom: '1.25rem',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                background: '#fffbeb',
                border: '1px solid #fcd34d',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem'
              }}>
                <span style={{ fontSize: '1.2rem' }}>📝</span>
                <div>
                  <strong style={{ fontSize: '0.85rem', color: '#92400e', display: 'block' }}>Catatan Khusus Gilingan / Pesanan:</strong>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#78350f', lineHeight: 1.4 }}>
                    {viewDetailOrder.grindNotes || viewDetailOrder.notes}
                  </p>
                </div>
              </div>
            )}

            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ margin: '0 0 0.75rem 0', color: '#374151', fontSize: '0.9rem' }}>Daftar Item Dibeli (Spesifikasi Lengkap)</h4>
              <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.5rem', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ backgroundColor: '#f9fafb' }}>
                    <tr>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8rem', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Produk</th>
                      <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.8rem', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Ukuran</th>
                      <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.8rem', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Profil Gilingan</th>
                      <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.8rem', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Qty</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.8rem', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Harga</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewDetailOrder.items && viewDetailOrder.items.map((item, idx) => {
                      let itemName = item.name;
                      let itemWeight = item.weight ? `${item.weight}g` : '';
                      let itemGrind = item.grind || '';

                      const match = item.name.match(/^(.*?)\s*\((.*?)\s*•\s*(.*?)\)$/);
                      if (match) {
                        itemName = match[1];
                        itemWeight = match[2];
                        itemGrind = match[3];
                      }

                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <td style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#111827' }}>
                            <strong>{itemName}</strong>
                            {item.notes && <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '2px' }}>Note: {item.notes}</div>}
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                            {itemWeight ? (
                              <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, background: '#e0e7ff', color: '#3730a3' }}>
                                {itemWeight}
                              </span>
                            ) : '-'}
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                            {itemGrind ? (
                              <span style={{ 
                                padding: '2px 8px', 
                                borderRadius: '4px', 
                                fontSize: '0.75rem', 
                                fontWeight: 600, 
                                background: itemGrind.toLowerCase().includes('biji') || itemGrind.toLowerCase().includes('whole') ? '#fef3c7' : '#f3f4f6', 
                                color: itemGrind.toLowerCase().includes('biji') || itemGrind.toLowerCase().includes('whole') ? '#92400e' : '#374151' 
                              }}>
                                {itemGrind}
                              </span>
                            ) : '-'}
                          </td>
                          <td style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#111827', textAlign: 'center' }}>x{item.quantity}</td>
                          <td style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#111827', textAlign: 'right' }}>Rp {item.price.toLocaleString('id-ID')}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot style={{ backgroundColor: '#f9fafb' }}>
                    <tr>
                      <td colSpan={4} style={{ padding: '0.75rem', fontSize: '0.9rem', fontWeight: 600, textAlign: 'right', color: '#111827' }}>Total Amount:</td>
                      <td style={{ padding: '0.75rem', fontSize: '0.9rem', fontWeight: 700, color: '#d97706', textAlign: 'right' }}>Rp {viewDetailOrder.total.toLocaleString('id-ID')}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <a
                href={getWhatsAppLink(viewDetailOrder)}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '0.6rem 1.25rem',
                  backgroundColor: '#25D366',
                  color: '#ffffff',
                  borderRadius: '0.25rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                💬 Kirim Update via WhatsApp
              </a>

              <button 
                onClick={() => setViewDetailOrder(null)}
                style={{ padding: '0.6rem 1.5rem', backgroundColor: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', fontWeight: '600' }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
