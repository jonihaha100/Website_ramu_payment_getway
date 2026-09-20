"use client";

import { useState } from 'react';
import { useLang } from '../../context/LanguageContext';
import { t } from '../../data/translations';
import styles from './track.module.css';
import { Order } from '../../data/mockOrders';

export default function TrackPage() {
  const { lang } = useLang();
  const translations = t[lang as keyof typeof t];
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');
  const [trackingData, setTrackingData] = useState<Record<string, unknown>[]>([]);

  // Complaint / Return State
  const [showComplaintForm, setShowComplaintForm] = useState(false);
  const [complaintSuccess, setComplaintSuccess] = useState(false);
  const [complaintForm, setComplaintForm] = useState({ reason: 'Barang Rusak', description: '' });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError('');
    setOrder(null);
    setTrackingData([]);

    try {
      const res = await fetch(`/api/orders?search=${encodeURIComponent(searchQuery.trim())}`);
      const data = await res.json();
      
      const foundOrder = Array.isArray(data) && data.length > 0 ? data[0] : null;

      if (foundOrder) {
        setOrder(foundOrder);
        // Jika resi dan kurir ada, fetch simulator API Kurir
        if (foundOrder.trackingNumber && foundOrder.courier) {
          try {
            const trackRes = await fetch(`/api/track?resi=${foundOrder.trackingNumber}&courier=${foundOrder.courier}&date=${foundOrder.date}`);
            const trackResult = await trackRes.json();
            if (trackResult.status === 'success') {
              setTrackingData(trackResult.data.history);
            }
          } catch (_err) {
            console.error("Failed to fetch tracking API", _err);
          }
        }
      } else {
        setError(translations.track_err_notfound);
      }
    } catch (_err) {
      setError(translations.track_err_fetch);
    } finally {
      setLoading(false);
    }
  };

  const getTrackingHistory = (order: Order) => {
    const status = order.status;
    const orderDate = new Date(order.date);
    const addHours = (date: Date, hours: number) => new Date(date.getTime() + hours * 60 * 60 * 1000);
  
    let baseHistory = [
      {
        time: addHours(orderDate, 0),
        status: lang === 'ja' ? "注文受付" : (lang === 'en' ? "Order Placed" : "Pesanan Dibuat"),
        location: lang === 'ja' ? "ラム・ロースタリー注文システム" : (lang === 'en' ? "Ramu Roastery System" : "Sistem Ramu Roastery"),
        active: true
      },
      {
        time: addHours(orderDate, 1),
        status: lang === 'ja' ? "決済確認完了" : (lang === 'en' ? "Payment Confirmed" : "Pembayaran Dikonfirmasi"),
        location: lang === 'ja' ? "決済システム" : (lang === 'en' ? "Payment Gateway" : "Sistem Pembayaran"),
        active: status !== 'Pending'
      },
      {
        time: addHours(orderDate, 4),
        status: lang === 'ja' ? "焙煎・パッキング処理中" : (lang === 'en' ? "Order Processing (Roasting / Packing)" : "Pesanan Sedang Diproses (Roasting/Packing)"),
        location: lang === 'ja' ? "自社焙煎所（バンドン）" : (lang === 'en' ? "Roastery Facility" : "Fasilitas Roastery"),
        active: ['Processing', 'Shipped', 'Delivered'].includes(status)
      }
    ];
  
    if (status === 'Cancelled') {
      return [
        baseHistory[0],
        { time: addHours(orderDate, 2), status: lang === 'ja' ? "注文キャンセル" : (lang === 'en' ? "Order Cancelled" : "Pesanan Dibatalkan"), location: "-", active: true }
      ];
    }
  
    if (trackingData.length > 0) {
      const mapped = trackingData.map(h => ({
        status: h.status as string,
        location: h.location as string,
        active: h.active as boolean,
        time: new Date(h.time as string | number | Date)
      }));
      baseHistory = [...baseHistory, ...mapped];
    } else if (order.trackingNumber && order.courier) {
      baseHistory.push({
        time: addHours(orderDate, 24),
        status: lang === 'ja' ? "配送業者へ引き渡し完了" : (lang === 'en' ? "Handed to Courier" : "Paket Diserahkan ke Kurir"),
        location: lang === 'ja' ? `${order.courier} からの追跡情報更新待ち...` : (lang === 'en' ? `Awaiting update from ${order.courier}...` : `Menunggu update dari ${order.courier}...`),
        active: true
      });
    } else {
      if (['Shipped', 'Delivered'].includes(status)) {
        baseHistory.push({
          time: addHours(orderDate, 24),
          status: lang === 'ja' ? "配送ハブへ引き渡し完了" : (lang === 'en' ? "Handed to Carrier Hub" : "Paket Diserahkan ke Ekspedisi"),
          location: lang === 'ja' ? "配送ハブ" : (lang === 'en' ? "Carrier Hub" : "Hub Ekspedisi"),
          active: true
        });
      }
    }
  
    return baseHistory.filter(h => h.time.getTime() <= new Date().getTime() || h.active === true);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>{translations.track_title}</h1>
        <p className={styles.subtitle}>{translations.track_sub}</p>
      </div>

      <form className={styles.searchBox} onSubmit={handleSearch}>
        <div className={styles.inputGroup}>
          <input 
            type="text" 
            className={styles.input} 
            placeholder={translations.track_placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            required
          />
          <button type="submit" className={styles.btnSubmit} disabled={loading}>
            {loading ? translations.track_searching : translations.track_btn_search}
          </button>
        </div>
      </form>

      {error && <div className={styles.error}>{error}</div>}

      {order && (
        <div className={styles.resultContainer}>
          <div className={styles.trackingCard}>
            <div className={styles.orderInfo}>
              <div className={styles.infoBlock}>
                <span className={styles.infoLabel}>{translations.track_order_id}</span>
                <span className={styles.infoValue}>{order.id}</span>
              </div>
              <div className={styles.infoBlock}>
                <span className={styles.infoLabel}>{translations.track_courier}</span>
                <span className={styles.infoValue}>{order.courier || '-'}</span>
              </div>
              <div className={styles.infoBlock}>
                <span className={styles.infoLabel}>{translations.track_resi}</span>
                <span className={styles.infoValue}>{order.trackingNumber || '-'}</span>
              </div>
            </div>

            <h3 style={{ marginBottom: '0.5rem' }}>{translations.track_history}</h3>
            <div className={styles.timeline}>
              {getTrackingHistory(order).reverse().map((history: { time: Date, status: string, location: string, active: boolean }, idx: number) => (
                <div key={idx} className={styles.timelineItem}>
                  <div className={`${styles.timelineDot} ${history.active ? styles.timelineDotActive : ''}`}></div>
                  <div className={styles.timelineDate}>
                    {history.time.toLocaleString(lang === 'ja' ? 'ja-JP' : (lang === 'en' ? 'en-US' : 'id-ID'), {
                      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </div>
                  <div className={styles.timelineStatus} style={{ color: history.active ? '#111827' : '#9ca3af' }}>
                    {history.status as string}
                  </div>
                  <div className={styles.timelineLocation}>{history.location as string}</div>
                </div>
              ))}
            </div>

            {/* KOMPLAIN / RETUR SECTION */}
            {order.status === 'Delivered' && (
              <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid #e5e7eb', textAlign: 'center' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{translations.track_complaint_title}</h3>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                  {translations.track_complaint_sub}
                </p>
                <button 
                  onClick={() => setShowComplaintForm(true)}
                  style={{ padding: '0.75rem 1.5rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  {translations.track_complaint_btn}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL KOMPLAIN */}
      {showComplaintForm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem'
        }}>
          <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '1rem', width: '100%', maxWidth: '500px' }}>
            {complaintSuccess ? (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                <h2 style={{ marginBottom: '0.5rem' }}>{translations.track_modal_success_title}</h2>
                <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
                  {translations.track_modal_success_sub}
                </p>
                <button 
                  onClick={() => { setShowComplaintForm(false); setComplaintSuccess(false); }}
                  style={{ padding: '0.75rem 2rem', backgroundColor: '#111827', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  {translations.track_modal_close}
                </button>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{translations.track_modal_form_title}</h3>
                  <button onClick={() => setShowComplaintForm(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#9ca3af' }}>✖</button>
                </div>
                
                <form onSubmit={(e) => {
                  e.preventDefault();
                  // Simulate API call to backend
                  setTimeout(() => setComplaintSuccess(true), 1000);
                }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{translations.track_reason}</label>
                    <select 
                      required
                      value={complaintForm.reason}
                      onChange={(e) => setComplaintForm({...complaintForm, reason: e.target.value})}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db' }}
                    >
                      <option value="Barang Rusak">{translations.track_reason_1}</option>
                      <option value="Produk Tidak Sesuai">{translations.track_reason_2}</option>
                      <option value="Barang Kurang">{translations.track_reason_3}</option>
                      <option value="Kualitas Buruk">{translations.track_reason_4}</option>
                    </select>
                  </div>
                  
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{translations.track_desc}</label>
                    <textarea 
                      required
                      rows={4}
                      value={complaintForm.description}
                      onChange={(e) => setComplaintForm({...complaintForm, description: e.target.value})}
                      placeholder={translations.track_desc_ph}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db', resize: 'vertical' }}
                    />
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{translations.track_upload}</label>
                    <input type="file" accept="image/*" style={{ fontSize: '0.875rem', color: '#6b7280' }} />
                  </div>

                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button type="button" onClick={() => setShowComplaintForm(false)} style={{ flex: 1, padding: '0.75rem', backgroundColor: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '0.5rem', fontWeight: 'bold', cursor: 'pointer' }}>{translations.track_cancel}</button>
                    <button type="submit" style={{ flex: 1, padding: '0.75rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 'bold', cursor: 'pointer' }}>{translations.track_submit}</button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
