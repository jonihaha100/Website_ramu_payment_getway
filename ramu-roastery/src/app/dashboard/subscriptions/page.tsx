"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useLang } from "../../../context/LanguageContext";
import { t } from "../../../data/translations";
import styles from "../dashboard.module.css";
import Link from "next/link";

interface Subscription {
  id: string;
  productId: string;
  productName: string;
  variant: string;
  quantity: number;
  price: number;
  frequency: string;
  deliveriesTotal: number;
  deliveriesCompleted: number;
  status: string;
  nextDelivery: string;
  createdAt: string;
}

export default function SubscriptionsPage() {
  const { user } = useAuth();
  const { lang } = useLang();
  const tr = t[lang as keyof typeof t] || t.id;
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.email) {
      fetchSubscriptions();
    }
  }, [user]);

  const fetchSubscriptions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/subscriptions?userEmail=${user?.email}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setSubscriptions(data);
      }
    } catch (error) {
      console.error("Failed to fetch subscriptions", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getFreqLabel = (freq: string) => {
    if (freq === "1_WEEK") return `${tr.dash_subs_freq_every} ${tr.dash_subs_freq_1w}`;
    if (freq === "2_WEEKS") return `${tr.dash_subs_freq_every} ${tr.dash_subs_freq_2w}`;
    if (freq === "1_MONTH") return `${tr.dash_subs_freq_every} ${tr.dash_subs_freq_1m}`;
    return freq;
  };

  const getStatusLabel = (status: string) => {
    if (status === "Active") return tr.dash_subs_status_active;
    if (status === "Completed") return tr.dash_subs_status_completed;
    if (status === "Paused") return tr.dash_subs_status_paused;
    return tr.dash_subs_status_cancelled;
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch("/api/subscriptions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus })
      });
      if (res.ok) {
        setSubscriptions(subscriptions.map(s => s.id === id ? { ...s, status: newStatus } : s));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSkipNext = async (id: string) => {
    const confirmMsg = lang === 'ja'
      ? '次回のお届けをスキップして、その次の焙煎バッチまで配送を延期しますか？'
      : (lang === 'en'
        ? 'Skip this upcoming delivery cycle and postpone to the next batch?'
        : 'Lewati jadwal pengiriman terdekat ini dan tunda ke jadwal batch berikutnya?');
    if (!confirm(confirmMsg)) return;
    try {
      const res = await fetch("/api/subscriptions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "skip" })
      });
      if (res.ok) {
        fetchSubscriptions();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className={styles.sectionContainer}>
      <h2 className={styles.sectionTitle}>{tr.dash_subs_title}</h2>
      
      {isLoading ? (
        <p>{tr.dash_subs_loading}</p>
      ) : subscriptions.length === 0 ? (
        <div className={styles.emptyState}>
          <p>{tr.dash_subs_empty}</p>
          <Link href="/catalog" className="btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>
            {tr.dash_subs_btn_cat}
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {subscriptions.map(sub => (
            <div key={sub.id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1.5rem', background: 'var(--bg-primary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{sub.productName}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{sub.variant} • {sub.quantity} pcs</p>
                </div>
                <span style={{ 
                  padding: '0.25rem 0.75rem', 
                  borderRadius: '999px', 
                  fontSize: '0.75rem', 
                  fontWeight: 600,
                  backgroundColor: sub.status === 'Active' ? '#dcfce7' : sub.status === 'Completed' ? '#dbeafe' : sub.status === 'Paused' ? '#fef08a' : '#fee2e2',
                  color: sub.status === 'Active' ? '#166534' : sub.status === 'Completed' ? '#1e40af' : sub.status === 'Paused' ? '#854d0e' : '#991b1b'
                }}>
                  {getStatusLabel(sub.status)}
                </span>
              </div>
              
              {/* Progress Timeline */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{tr.dash_subs_progress}</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{sub.deliveriesCompleted} / {sub.deliveriesTotal} {tr.dash_subs_delivered}</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ 
                    height: '100%', 
                    backgroundColor: '#3b82f6', 
                    width: `${(sub.deliveriesCompleted / sub.deliveriesTotal) * 100}%`,
                    transition: 'width 0.5s ease'
                  }} />
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.25rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>{tr.dash_subs_schedule}</p>
                  <p style={{ fontWeight: 600 }}>{getFreqLabel(sub.frequency)}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>{tr.dash_subs_next_delivery}</p>
                  <p style={{ fontWeight: 600 }}>{new Date(sub.nextDelivery).toLocaleDateString(lang === 'ja' ? 'ja-JP' : (lang === 'en' ? 'en-US' : 'id-ID'), { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>{tr.dash_subs_total_price}</p>
                  <p style={{ fontWeight: 600, color: '#166534' }}>Rp {sub.price.toLocaleString('id-ID')}</p>
                </div>
              </div>

              {/* Self-service actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
                <div>
                  {sub.status === 'Active' ? (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                      {tr.dash_subs_info_active}
                    </p>
                  ) : sub.status === 'Paused' ? (
                    <p style={{ fontSize: '0.8rem', color: '#854d0e', margin: 0 }}>
                      {lang === 'ja' ? '⏸️ 定期便のお届けを一時停止しています。「再開」をクリックすればいつでもお届けを再開できます。' : (lang === 'en' ? '⏸️ Subscription delivery is paused. Click resume anytime.' : '⏸️ Pengiriman langganan sedang dijeda. Klik lanjutkan kapan saja.')}
                    </p>
                  ) : sub.status === 'Completed' ? (
                    <p style={{ fontSize: '0.8rem', color: '#1d4ed8', margin: 0, fontWeight: 500 }}>
                      {tr.dash_subs_info_completed}
                    </p>
                  ) : null}
                </div>

                {sub.status !== 'Completed' && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {sub.status === 'Active' ? (
                      <>
                        <button
                          onClick={() => handleSkipNext(sub.id)}
                          style={{
                            padding: '0.4rem 0.85rem',
                            border: '1px solid #cbd5e1',
                            background: '#ffffff',
                            borderRadius: '0.25rem',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            color: '#475569'
                          }}
                        >
                          {lang === 'ja' ? '⏭️ 次回配送をスキップ' : (lang === 'en' ? '⏭️ Skip Next Delivery' : '⏭️ Lewati Pengiriman Ini')}
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(sub.id, "Paused")}
                          style={{
                            padding: '0.4rem 0.85rem',
                            border: '1px solid #fde047',
                            background: '#fefce8',
                            borderRadius: '0.25rem',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            color: '#854d0e'
                          }}
                        >
                          {lang === 'ja' ? '⏸️ 配送を一時停止' : (lang === 'en' ? '⏸️ Pause Delivery' : '⏸️ Jeda Pengiriman')}
                        </button>
                      </>
                    ) : sub.status === 'Paused' ? (
                      <button
                        onClick={() => handleUpdateStatus(sub.id, "Active")}
                        style={{
                          padding: '0.4rem 0.85rem',
                          border: '1px solid #86efac',
                          background: '#f0fdf4',
                          borderRadius: '0.25rem',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          color: '#166534'
                        }}
                      >
                        {lang === 'ja' ? '▶️ 定期便を再開' : (lang === 'en' ? '▶️ Resume Subscription' : '▶️ Lanjutkan Langganan')}
                      </button>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
