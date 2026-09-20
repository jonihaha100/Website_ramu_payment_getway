"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useLang } from '../../../context/LanguageContext';
import { t } from '../../../data/translations';
import { Order, OrderItem } from '../../../data/mockOrders';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { coffees } from '../../../data/coffees';

interface TrackingHistory {
  time: Date;
  status: string;
  location: string;
  active: boolean;
}
import styles from './orders.module.css';

// Simulasi data tracking pengiriman

export default function UserOrdersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { addToast } = useToast();
  const { lang } = useLang();
  const tr = t[lang];
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null);
  const [trackingData, setTrackingData] = useState<Record<string, TrackingHistory[]>>({});
  const [loadingTrack, setLoadingTrack] = useState(false);
  const [isNewOrder, setIsNewOrder] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get('newOrder') === 'true') {
        setIsNewOrder(true);
        // Clean URL so refresh doesn't show it again
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
  }, []);

  useEffect(() => {
    const fetchUserOrders = async () => {
      try {
        const res = await fetch(`/api/orders?customerEmail=${encodeURIComponent(user?.email || '')}`);
        if (!res.ok) {
          console.warn("Could not retrieve orders from server");
          setUserOrders([]);
          setLoading(false);
          return;
        }
        const data = await res.json();
        if (!Array.isArray(data)) {
          console.warn("Orders data format unexpected, using empty list");
          setUserOrders([]);
          setLoading(false);
          return;
        }
        
        let filteredOrders = data.filter((order: Order) => order.customerEmail === user?.email);
        
        // Cek logika otomatis (Auto-Delivered & Auto-Completed)
        filteredOrders = await Promise.all(filteredOrders.map(async (order: Order) => {
          let updatedOrder = { ...order };
          let needsUpdate = false;

          // Simulasi: Jika status "Shipped" sudah lewat 7 hari dari tanggal order, anggap sudah "Delivered"
          if (updatedOrder.status === 'Shipped') {
            const sevenDaysAfterOrder = new Date(updatedOrder.date).getTime() + (7 * 24 * 60 * 60 * 1000);
            if (new Date().getTime() > sevenDaysAfterOrder) {
              updatedOrder.status = 'Delivered';
              needsUpdate = true;
            }
          }

          // Simulasi: Jika status "Delivered" sudah lewat 3 hari, anggap "Completed" (Garansi habis)
          if (updatedOrder.status === 'Delivered') {
            // Karena kita pakai mock date, asumsikan pesanan sampai 2 hari setelah di-order (jika tidak ada data riil)
            const deliveredTime = new Date(updatedOrder.date).getTime() + (2 * 24 * 60 * 60 * 1000);
            const threeDaysAfterDelivery = deliveredTime + (3 * 24 * 60 * 60 * 1000);
            
            if (new Date().getTime() > threeDaysAfterDelivery) {
              updatedOrder.status = 'Completed';
              needsUpdate = true;
            }
          }

          if (needsUpdate) {
            try {
              await fetch('/api/orders', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedOrder)
              });
            } catch (e) {
              console.error("Gagal update status otomatis", e);
            }
          }
          
          return updatedOrder;
        }));

        filteredOrders.sort((a: Order, b: Order) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        setUserOrders(filteredOrders);
      } catch (_err) {
        console.warn("Notice: Fetching user orders deferred:", _err);
        setUserOrders([]);
      } finally {
        setLoading(false);
      }
    };

    if (user?.email) {
      fetchUserOrders();
    }
  }, [user]);

  const handleCompleteOrder = async (order: Order) => {
    const confirmPrompt = lang === 'ja'
      ? `注文 ${order.id} の受取と完了を確認しますか？（完了後の返品・交換は受付できません）`
      : lang === 'en'
      ? `Are you sure order ${order.id} is received and you want to complete it? (Returns/complaints cannot be accepted after completion)`
      : `Apakah Anda yakin pesanan ${order.id} sudah sesuai dan ingin menyelesaikannya? (Komplain tidak akan diterima setelah pesanan diselesaikan)`;

    if (confirm(confirmPrompt)) {
      try {
        const res = await fetch('/api/orders', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...order, status: 'Completed' })
        });
        if (res.ok) {
          addToast(
            lang === 'ja'
              ? '注文が完了しました。レビューをご投稿ください！'
              : (lang === 'en'
                ? 'Order completed successfully. Please leave your review!'
                : 'Pesanan berhasil diselesaikan. Silakan berikan ulasan Anda!'),
            'success'
          );
          setUserOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'Completed' } : o));
          // Redirect ke halaman ulasan
          router.push(`/dashboard/reviews?orderId=${order.id}`);
        }
      } catch (err) {
        addToast(
          lang === 'ja'
            ? '注文の完了処理中にエラーが発生しました。'
            : (lang === 'en'
              ? 'An error occurred while completing the order.'
              : 'Terjadi kesalahan saat menyelesaikan pesanan.'),
          'error'
        );
      }
    }
  };

  const handleComplain = (order: Order) => {
    // Arahkan ke halaman Pengembalian (Returns)
    router.push('/dashboard/returns');
  };

  const getTrackingHistory = (order: Order & { courier?: string; trackingNumber?: string }) => {
    const status = order.status;
    const orderDate = new Date(order.date);
    const addHours = (date: Date, hours: number) => new Date(date.getTime() + hours * 60 * 60 * 1000);

    let baseHistory = [
      {
        time: addHours(orderDate, 0),
        status: "Pesanan Dibuat",
        location: "Sistem Ramu Roastery",
        active: true
      },
      {
        time: addHours(orderDate, 1),
        status: "Pembayaran Dikonfirmasi",
        location: "Sistem Pembayaran",
        active: status !== 'Pending'
      },
      {
        time: addHours(orderDate, 4),
        status: "Pesanan Sedang Diproses (Roasting/Packing)",
        location: "Fasilitas Roastery",
        active: ['Processing', 'Shipped', 'Delivered'].includes(status)
      }
    ];

    if (status === 'Cancelled') {
      return [
        baseHistory[0],
        { time: addHours(orderDate, 2), status: "Pesanan Dibatalkan", location: "-", active: true }
      ];
    }

    const automatedHistory = trackingData[order.id];
    if (automatedHistory && automatedHistory.length > 0) {
      const mapped = automatedHistory.map(h => ({
        ...h,
        time: new Date(h.time)
      }));
      baseHistory = [...baseHistory, ...mapped];
    } else if (order.trackingNumber && order.courier) {
      // It has resi but no tracking fetched yet or fetched empty
      baseHistory.push({
        time: addHours(orderDate, 24),
        status: "Paket Diserahkan ke Kurir",
        location: `Menunggu update dari ${order.courier}...`,
        active: true
      });
    } else {
      // Fallback
      if (['Shipped', 'Delivered'].includes(status)) {
        baseHistory.push({
          time: addHours(orderDate, 24),
          status: "Paket Diserahkan ke Ekspedisi",
          location: "Hub Ekspedisi",
          active: true
        });
      }
    }

    return baseHistory.filter(h => h.time.getTime() <= new Date().getTime() || h.active === true);
  };

  const handlePayment = async (order: Order) => {
    const confirmPrompt = lang === 'ja'
      ? `注文 ${order.id} のお支払い（Rp ${order.total.toLocaleString('id-ID')}）に進みますか？`
      : lang === 'en'
      ? `Proceed to payment for order ${order.id} amounting to Rp ${order.total.toLocaleString('en-US')}?`
      : `Lanjutkan ke pembayaran untuk pesanan ${order.id} sebesar Rp ${order.total.toLocaleString('id-ID')}?`;

    if (confirm(confirmPrompt)) {
      try {
        const res = await fetch('/api/orders', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...order, status: 'Processing' })
        });
        if (res.ok) {
          addToast(
            lang === 'ja'
              ? '支払いが確認されました！注文の焙煎・発送準備を開始します。'
              : (lang === 'en'
                ? 'Payment confirmed! Your order is being processed.'
                : 'Pembayaran berhasil dikonfirmasi! Pesanan Anda sedang diproses.'),
            'success'
          );
          // Update status locally
          setUserOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'Processing' } : o));
        } else {
          addToast(
            lang === 'ja'
              ? '支払いの処理に失敗しました。もう一度お試しください。'
              : (lang === 'en'
                ? 'Failed to process payment. Please try again.'
                : 'Gagal memproses pembayaran. Silakan coba lagi.'),
            'error'
          );
        }
      } catch (err) {
        addToast(
          lang === 'ja'
            ? '支払い処理中にシステムエラーが発生しました。'
            : (lang === 'en'
              ? 'A system error occurred during payment.'
              : 'Terjadi kesalahan sistem saat pembayaran.'),
          'error'
        );
      }
    }
  };

  const handleOrderReceived = async (order: Order) => {
    const confirmPrompt = lang === 'ja'
      ? '商品が無事に到着したことを確認しますか？'
      : lang === 'en'
      ? 'Are you sure you have safely received this order?'
      : 'Apakah Anda yakin pesanan sudah tiba dengan selamat?';

    if (confirm(confirmPrompt)) {
      try {
        const res = await fetch('/api/orders', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...order, status: 'Delivered' })
        });
        
        if (res.ok) {
          // Update state local
          setUserOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'Delivered' } : o));
          addToast(
            lang === 'ja'
              ? '受取完了を確認しました！保証期間が開始されました。'
              : lang === 'en'
              ? 'Thank you! Order marked as Delivered. Warranty period starts now (3 days).'
              : 'Terima kasih! Pesanan telah ditandai Diterima. Masa garansi pengajuan retur dimulai dari sekarang (3 Hari).',
            'success'
          );
        } else {
          addToast(
            lang === 'ja' ? 'ステータスの更新に失敗しました。' : lang === 'en' ? 'Failed to update order status.' : 'Gagal memperbarui status.',
            'error'
          );
        }
      } catch (e) {
        console.error(e);
        addToast(
          lang === 'ja' ? 'システムエラーが発生しました。' : lang === 'en' ? 'A system error occurred.' : 'Terjadi kesalahan sistem.',
          'error'
        );
      }
    }
  };

  const handleTrackClick = async (order: Order & { courier?: string; trackingNumber?: string }) => {
    if (order.trackingNumber) {
      window.open(`https://cekresi.com/?noresi=${order.trackingNumber}`, '_blank');
    } else {
      addToast(
        lang === 'ja'
          ? '送り状番号（追跡番号）は準備中です。発送完了まで今しばらくお待ちください。'
          : lang === 'en'
          ? 'Tracking number not yet available. Please wait for the roastery to dispatch your order.'
          : 'Nomor resi belum tersedia. Silakan tunggu admin memperbarui pesanan Anda.',
        'info'
      );
    }
  };

  const getStatusClass = (status: Order['status']) => {
    switch (status) {
      case 'Pending': return styles.statusPending;
      case 'Processing': return styles.statusProcessing;
      case 'Shipped': return styles.statusShipped;
      case 'Delivered': return styles.statusDelivered;
      case 'Completed': return styles.statusDelivered; // Same color style for completed
      case 'Cancelled': return styles.statusCancelled;
      default: return '';
    }
  };

  const getStatusTranslation = (status: Order['status']) => {
    switch (status) {
      case 'Pending': return tr.dash_orders_status_pending;
      case 'Processing': return tr.dash_orders_status_proc;
      case 'Shipped': return tr.dash_orders_status_ship;
      case 'Delivered': return tr.dash_orders_status_deliv;
      case 'Completed': return tr.dash_orders_status_comp;
      case 'Cancelled': return tr.dash_orders_status_cancel;
      default: return status;
    }
  };  if (loading) return <div style={{ padding: '2rem' }}>{lang === 'ja' ? '注文履歴を読み込み中...' : (lang === 'en' ? 'Loading order history...' : 'Memuat riwayat pesanan...')}</div>;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{tr.dash_orders_title}</h1>
      
      {isNewOrder && (
        <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: 'var(--bg-color, #F5F2EB)', color: 'var(--accent-color)', border: '1px solid var(--accent-color)', borderRadius: 'var(--radius-sm, 0.5rem)', display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <strong>{lang === 'ja' ? 'お知らせ:' : (lang === 'en' ? 'Notice:' : 'Pemberitahuan:')}</strong> {lang === 'ja' ? '新しいご注文を受け付けました。お支払いを完了してください。' : (lang === 'en' ? 'Your new order has been created. Please complete payment.' : 'Pesanan baru Anda telah berhasil dibuat. Silakan segera selesaikan pembayaran.')}
          </div>
          <button onClick={() => setIsNewOrder(false)} style={{ background: 'transparent', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
        </div>
      )}

      <div className={styles.orderList}>
        {userOrders.length > 0 ? (
          userOrders.map((order) => (
            <div key={order.id} className={styles.orderCard}>
              
              {/* Header */}
              <div className={styles.cardHeader}>
                <div className={styles.headerLeft}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 8H5C3.89543 8 3 8.89543 3 10V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V10C21 8.89543 20.1046 8 19 8Z" stroke="var(--accent-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16 12C16 14.2091 14.2091 16 12 16C9.79086 16 8 14.2091 8 12" stroke="var(--accent-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8 8V6C8 3.79086 9.79086 2 12 2C14.2091 2 16 3.79086 16 6V8" stroke="var(--accent-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>{lang === 'ja' ? 'ご注文' : (lang === 'en' ? 'Shopping' : 'Belanja')}</span>
                  <span className={styles.headerDate}>
                    {new Date(order.date).toLocaleDateString(lang === 'ja' ? 'ja-JP' : (lang === 'en' ? 'en-US' : 'id-ID'), {
                      year: 'numeric', month: 'short', day: 'numeric'
                    })}
                  </span>
                </div>
                <div className={`${styles.statusBadge} ${getStatusClass(order.status)}`}>
                  {getStatusTranslation(order.status)}
                </div>
              </div>
              
              {/* Body (Clickable) */}
              <div className={styles.cardBody} onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}>
                <div className={styles.productImagePlaceholder} style={{ padding: 0, overflow: 'hidden', backgroundColor: '#f3f4f5' }}>
                  {(() => {
                    const productInfo = coffees.find(c => c.id === order.items[0]?.id || c.id === order.items[0]?.productId || c.name === order.items[0]?.name);
                    if (productInfo?.imageUrl) {
                      return <img src={productInfo.imageUrl} alt={order.items[0]?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
                    }
                    return <span style={{ padding: '16px' }}>☕</span>;
                  })()}
                </div>
                <div className={styles.productInfo}>
                  <div className={styles.productTitle}>{order.items[0].name}</div>
                  <div className={styles.productMeta}>
                    {order.items.length === 1 
                      ? (lang === 'ja' ? `${order.items[0].quantity} 点` : (lang === 'en' ? `${order.items[0].quantity} item` : `${order.items[0].quantity} barang`))
                      : (lang === 'ja' ? `${order.items[0].quantity} 点（他 ${order.items.length - 1} 商品）` : (lang === 'en' ? `${order.items[0].quantity} items (+${order.items.length - 1} other products)` : `${order.items[0].quantity} barang (+${order.items.length - 1} produk lainnya)`))}
                  </div>
                </div>
              </div>
              
              {/* Unboxing Alert */}
              {order.status === 'Delivered' && (
                <div style={{ backgroundColor: '#fffbeb', borderTop: '1px solid #fef3c7', borderBottom: '1px solid #fef3c7', padding: '12px 16px', color: '#92400e', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                  <span>
                    {lang === 'ja' ? (
                      <><strong>開封時のご注意:</strong> 万が一の破損や商品相違の確認のため、受取完了ボタンを押す前に開封時の写真撮影をおすすめいたします。</>
                    ) : lang === 'en' ? (
                      <><strong>Unboxing Notice:</strong> Please take a photo of the package/unboxing as evidence of condition before completing the order.</>
                    ) : (
                      <><strong>Wajib Foto Unboxing:</strong> Mohon fotokan paket/unboxing sebagai bukti kondisi produk sebelum mengklik tombol <strong>Selesai</strong>.</>
                    )}
                  </span>
                </div>
              )}
              
              {/* Expanded Details */}
              {expandedOrderId === order.id && (
                <div className={styles.detailSection}>
                  
                  <div className={styles.detailBox} style={{ borderBottom: '1px solid #f3f4f5', paddingBottom: '16px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <div>
                        <div style={{ fontSize: '14px', color: '#6d7588', marginBottom: '4px' }}>
                          {lang === 'ja' ? '注文番号' : (lang === 'en' ? 'Order ID' : 'No. Pesanan')}
                        </div>
                        <div style={{ fontWeight: '700', color: 'var(--accent-color)', fontSize: '14px' }}>{order.id}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '14px', color: '#6d7588', marginBottom: '4px' }}>
                          {lang === 'ja' ? '購入日時' : (lang === 'en' ? 'Purchase Date' : 'Tanggal Pembelian')}
                        </div>
                        <div style={{ fontSize: '14px', color: '#31353b' }}>
                          {new Date(order.date).toLocaleString(lang === 'ja' ? 'ja-JP' : (lang === 'en' ? 'en-US' : 'id-ID'), {
                            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.detailBox}>
                    <div className={styles.detailBoxTitle}>
                      {lang === 'ja' ? '商品明細' : (lang === 'en' ? 'Product Details' : 'Detail Produk')}
                    </div>
                    {order.items.map(item => (
                      <div className={styles.detailProductItem} key={item.id}>
                        <div className={styles.detailProductHeader}>
                           <div className={styles.productImagePlaceholder} style={{ width: '48px', height: '48px', fontSize: '16px', padding: 0, overflow: 'hidden', backgroundColor: '#f3f4f5' }}>
                             {(() => {
                               const productInfo = coffees.find(c => c.id === item.id || c.id === item.productId || c.name === item.name);
                               if (productInfo?.imageUrl) {
                                 return <img src={productInfo.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
                               }
                               return <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>☕</span>;
                             })()}
                           </div>
                           <div>
                              <div className={styles.detailProductName}>{item.name}</div>
                              <div className={styles.detailProductQty}>{item.quantity} x Rp {item.price.toLocaleString('id-ID')}</div>
                           </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f3f4f5', paddingTop: '12px', marginTop: '4px' }}>
                          <div style={{ fontSize: '14px', color: '#6d7588' }}>
                            {lang === 'ja' ? '小計' : (lang === 'en' ? 'Item Total' : 'Total harga')}
                          </div>
                          <div style={{ fontWeight: '700', color: '#31353b' }}>Rp {(item.price * item.quantity).toLocaleString('id-ID')}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className={styles.detailBox} style={{ borderTop: '4px solid #f3f4f5', paddingTop: '16px' }}>
                    <div className={styles.detailBoxTitle}>
                      {lang === 'ja' ? '配送情報' : (lang === 'en' ? 'Shipping Information' : 'Info Pengiriman')}
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ fontSize: '14px', color: '#6d7588' }}>
                        {lang === 'ja' ? '配送業者' : (lang === 'en' ? 'Courier' : 'Kurir')}
                      </div>
                      <div style={{ fontSize: '14px', color: '#31353b', fontWeight: '500' }}>{order.courier || 'Standard'}</div>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ fontSize: '14px', color: '#6d7588' }}>
                        {lang === 'ja' ? '追跡番号' : (lang === 'en' ? 'Tracking Number' : 'No Resi')}
                      </div>
                      <div style={{ fontSize: '14px', color: '#31353b', fontWeight: '500' }}>{order.trackingNumber || '-'}</div>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div style={{ fontSize: '14px', color: '#6d7588', minWidth: '80px' }}>
                        {lang === 'ja' ? 'お届け先住所' : (lang === 'en' ? 'Delivery Address' : 'Alamat')}
                      </div>
                      <div style={{ fontSize: '14px', color: '#31353b', fontWeight: '500', textAlign: 'right', lineHeight: '1.4', wordBreak: 'break-word', paddingLeft: '16px' }}>{order.shippingAddress}</div>
                    </div>
                  </div>
                  
                  <div className={styles.detailBox} style={{ borderTop: '4px solid #f3f4f5', paddingTop: '16px' }}>
                    <div className={styles.detailBoxTitle}>
                      {lang === 'ja' ? 'お支払い内訳' : (lang === 'en' ? 'Payment Breakdown' : 'Rincian Pembayaran')}
                    </div>
                    
                    {(() => {
                      const itemsTotal = order.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
                      const expectedTotalBeforeDiscount = itemsTotal + (order.tax || 0) + (order.adminFee || 0) + (order.shippingCost || 0);
                      const discountAmount = expectedTotalBeforeDiscount - order.total;
                      
                      return (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <div style={{ fontSize: '14px', color: '#6d7588' }}>
                              {lang === 'ja' ? '商品小計' : (lang === 'en' ? 'Products Subtotal' : 'Subtotal harga produk')}
                            </div>
                            <div style={{ fontSize: '14px', color: '#31353b', fontWeight: '500' }}>Rp {itemsTotal.toLocaleString('id-ID')}</div>
                          </div>
                          
                          {discountAmount > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <div style={{ fontSize: '14px', color: '#6d7588' }}>
                                {lang === 'ja' ? '割引' : (lang === 'en' ? 'Discount' : 'Diskon produk')}
                              </div>
                              <div style={{ fontSize: '14px', color: 'var(--accent-color)', fontWeight: '500' }}>-Rp {discountAmount.toLocaleString('id-ID')}</div>
                            </div>
                          )}
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <div style={{ fontSize: '14px', color: '#6d7588' }}>
                              {lang === 'ja' ? '配送料' : (lang === 'en' ? 'Shipping Cost' : 'Total ongkos kirim')}
                            </div>
                            <div style={{ fontSize: '14px', color: '#31353b', fontWeight: '500' }}>Rp {(order.shippingCost || 0).toLocaleString('id-ID')}</div>
                          </div>
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <div style={{ fontSize: '14px', color: '#6d7588' }}>
                              {lang === 'ja' ? '消費税' : (lang === 'en' ? 'Tax' : 'Pajak (Tax)')}
                            </div>
                            <div style={{ fontSize: '14px', color: '#31353b', fontWeight: '500' }}>Rp {(order.tax || 0).toLocaleString('id-ID')}</div>
                          </div>
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <div style={{ fontSize: '14px', color: '#6d7588' }}>
                              {lang === 'ja' ? 'システム利用料' : (lang === 'en' ? 'Service Fee' : 'Biaya jasa aplikasi')}
                            </div>
                            <div style={{ fontSize: '14px', color: '#31353b', fontWeight: '500' }}>Rp {(order.adminFee || 0).toLocaleString('id-ID')}</div>
                          </div>
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f3f4f5', paddingTop: '12px', marginTop: '12px' }}>
                            <div style={{ fontSize: '16px', fontWeight: '700', color: '#31353b' }}>
                              {lang === 'ja' ? '総合計' : (lang === 'en' ? 'Total Payment' : 'Total belanja')}
                            </div>
                            <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--accent-color)' }}>Rp {order.total.toLocaleString('id-ID')}</div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  
                  {trackingOrderId === order.id && (
                    <div className={styles.detailBox}>
                      <div className={styles.trackingTitle}>
                        {lang === 'ja' ? '配送状況の追跡' : (lang === 'en' ? 'Track Shipment' : 'Lacak Pengiriman')} {order.courier && order.trackingNumber ? `(${order.courier}: ${order.trackingNumber})` : ''}
                      </div>
                      {loadingTrack ? (
                        <div style={{ padding: '1rem', textAlign: 'center', color: '#6b7280' }}>
                          {lang === 'ja' ? '配送業者サーバーに接続中...' : (lang === 'en' ? 'Connecting to courier server...' : 'Menghubungi server kurir...')}
                        </div>
                      ) : (
                        <div className={styles.timeline}>
                          {getTrackingHistory(order).reverse().map((history, idx) => (
                            <div key={idx} className={styles.timelineItem}>
                              <div className={`${styles.timelineDot} ${history.active ? styles.timelineDotActive : ''}`} style={history.active ? { backgroundColor: 'var(--accent-color)' } : {}}></div>
                              <div className={styles.timelineDate}>
                                {history.time.toLocaleString('id-ID', {
                                  day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                })}
                              </div>
                              <div className={styles.timelineStatus} style={{ color: history.active ? '#111827' : '#9ca3af' }}>
                                {history.status}
                              </div>
                              <div className={styles.timelineLocation}>{history.location}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Footer */}
              <div className={styles.cardFooter} style={expandedOrderId === order.id ? { borderTop: '1px solid #f3f4f5' } : {}}>
                <div>
                  <div className={styles.totalLabel}>{lang === 'ja' ? '合計金額' : (lang === 'en' ? 'Total Order' : 'Total Belanja')}</div>
                  <div className={styles.totalAmount}>Rp {order.total.toLocaleString("id-ID")}</div>
                </div>
                <div className={styles.btnGroup}>
                  {/* Action Buttons */}
                  {order.status === 'Pending' && (
                    <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '14px' }} onClick={() => handlePayment(order)}>
                      {tr.dash_orders_pay_now}
                    </button>
                  )}
                  {order.status === 'Delivered' && (
                    <>
                      <button className="btn-outline" style={{ padding: '8px 16px', fontSize: '14px' }} onClick={() => handleComplain(order)}>
                        {lang === 'ja' ? '返品・補償申請' : (lang === 'en' ? 'Complain' : 'Komplain')}
                      </button>
                      <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '14px' }} onClick={() => handleCompleteOrder(order)}>
                        {lang === 'ja' ? '受取完了' : (lang === 'en' ? 'Complete' : 'Selesai')}
                      </button>
                    </>
                  )}
                  {(order.status === 'Processing' || order.status === 'Shipped') && (
                    <>
                      <button className="btn-outline" style={{ padding: '8px 16px', fontSize: '14px' }} onClick={() => handleTrackClick(order)}>
                        {trackingOrderId === order.id ? (lang === 'ja' ? '追跡を閉じる' : 'Tutup Lacak') : (lang === 'ja' ? '荷物を追跡' : (lang === 'en' ? 'Track' : 'Lacak'))}
                      </button>
                      {order.status === 'Shipped' && (
                        <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '14px' }} onClick={() => handleOrderReceived(order)}>
                          {lang === 'ja' ? '受取確認' : (lang === 'en' ? 'Received' : 'Diterima')}
                        </button>
                      )}
                    </>
                  )}
                  {order.status === 'Completed' && (
                    <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '14px' }} onClick={() => router.push(`/dashboard/reviews?orderId=${order.id}`)}>
                      {lang === 'ja' ? 'レビューを書く' : (lang === 'en' ? 'Leave Review' : 'Beri Ulasan')}
                    </button>
                  )}
                </div>
              </div>

            </div>
          ))
        ) : (
          <div className={styles.emptyState} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 1rem', textAlign: 'center', backgroundColor: '#f9fafb', borderRadius: '1rem', border: '1px dashed #d1d5db' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📦</div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#374151' }}>
              {tr.dash_orders_empty}
            </h3>
            <p style={{ color: '#6b7280', marginBottom: '2rem', maxWidth: '400px' }}>
              {lang === 'ja'
                ? '注文履歴がまだありません。厳選された新鮮な珈琲豆を探してみましょう！'
                : (lang === 'en'
                  ? 'You have no order history yet. Let\'s start exploring our best coffee collection!'
                  : 'Anda belum memiliki riwayat pesanan. Yuk, mulai jelajahi koleksi kopi terbaik kami!')}
            </p>
            <button 
              className="btn-primary"
              onClick={() => router.push('/catalog')}
            >
              {lang === 'ja' ? 'ショッピングを始める' : (lang === 'en' ? 'Start Shopping' : 'Mulai Belanja')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
