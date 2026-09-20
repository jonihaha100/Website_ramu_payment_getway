"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import SubscriptionCalendar from "../../../components/admin/SubscriptionCalendar";

interface Subscription {
  id: string;
  userEmail: string;
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

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    setIsLoading(true);
    try {
      // Create a new API route for Admin to fetch ALL subscriptions
      const res = await fetch(`/api/admin/subscriptions`);
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
    if (freq === "1_WEEK") return "1 Minggu";
    if (freq === "2_WEEKS") return "2 Minggu";
    if (freq === "1_MONTH") return "1 Bulan";
    return freq;
  };

  const handleRenew = async (id: string, isLast: boolean) => {
    if (!confirm(isLast ? "Ini adalah pengiriman TERAKHIR. Tandai dikirim dan selesaikan langganan ini?" : "Tandai kopi sudah dikirim, dan majukan jadwal ke siklus berikutnya?")) return;
    
    try {
      const res = await fetch(`/api/admin/subscriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'renew' })
      });
      if (res.ok) {
        fetchSubscriptions();
        alert("Status pengiriman berhasil diperbarui!");
      } else {
        alert("Gagal memperpanjang jadwal.");
      }
    } catch (e) {
      console.error(e);
      alert("Terjadi kesalahan.");
    }
  };

  const handleEditDate = async (id: string, currentDate: string) => {
    const rawDate = new Date(currentDate).toISOString().split('T')[0];
    const newDateStr = prompt("Masukkan tanggal baru (Format: YYYY-MM-DD):", rawDate);
    if (!newDateStr || newDateStr === rawDate) return;

    const parsedDate = new Date(newDateStr);
    if (isNaN(parsedDate.getTime())) {
      alert("Format tanggal tidak valid!");
      return;
    }

    try {
      const res = await fetch(`/api/admin/subscriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'edit_date', nextDelivery: parsedDate.toISOString() })
      });
      if (res.ok) {
        fetchSubscriptions();
        alert("Jadwal pengiriman berhasil diubah!");
      } else {
        alert("Gagal mengubah jadwal.");
      }
    } catch (e) {
      console.error(e);
      alert("Terjadi kesalahan.");
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Manajemen Langganan</h1>
      </div>
      
      {isLoading ? (
        <p>Memuat data langganan...</p>
      ) : subscriptions.length === 0 ? (
        <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
          <p>Belum ada pelanggan yang berlangganan.</p>
        </div>
      ) : (
        <>
          <SubscriptionCalendar subscriptions={subscriptions} />

          <div style={{ backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <tr>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>No.</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Tanggal Order</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Pelanggan</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Produk</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Jadwal</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Pengiriman Berikutnya</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Progres</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((sub, index) => (
                <tr key={sub.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '1rem', fontSize: '0.875rem' }}>{index + 1}</td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem' }}>{new Date(sub.createdAt).toLocaleDateString('id-ID')}</td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem' }}>{sub.userEmail}</td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                    <strong>{sub.productName}</strong>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{sub.variant} x {sub.quantity}</div>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem' }}>{getFreqLabel(sub.frequency)}</td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem' }}>{new Date(sub.nextDelivery).toLocaleDateString('id-ID')}</td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem', fontWeight: 'bold' }}>{sub.deliveriesCompleted} / {sub.deliveriesTotal}</td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '4px', 
                      fontSize: '0.75rem', 
                      fontWeight: 600,
                      backgroundColor: sub.status === 'Active' ? '#dcfce7' : sub.status === 'Paused' ? '#fef08a' : '#fee2e2',
                      color: sub.status === 'Active' ? '#166534' : sub.status === 'Paused' ? '#854d0e' : '#991b1b'
                    }}>
                      {sub.status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                    {sub.status === 'Active' && (
                      <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                        <button 
                          onClick={() => handleRenew(sub.id, sub.deliveriesCompleted === sub.deliveriesTotal - 1)}
                          style={{ fontSize: '0.75rem', padding: '0.5rem 1rem', border: 'none', borderRadius: '4px', background: '#3b82f6', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                          Proses Pengiriman
                        </button>
                        <button 
                          onClick={() => handleEditDate(sub.id, sub.nextDelivery)}
                          style={{ fontSize: '0.75rem', padding: '0.5rem 1rem', border: '1px solid #d1d5db', borderRadius: '4px', background: '#f9fafb', color: '#374151', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                          Edit Jadwal
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
    </div>
  );
}
