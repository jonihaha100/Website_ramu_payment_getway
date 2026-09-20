/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";

interface ReturnTicket {
  id: string;
  orderId?: string;
  customerName?: string;
  customerEmail?: string;
  dateRequested: string;
  itemName: string;
  reason: string;
  description: string;
  status: string;
  adminNotes?: string;
  proofImageUrl?: string;
  returnTrackingNumber?: string;
}

export default function AdminReturnsPage() {
  const [returns, setReturns] = useState<ReturnTicket[]>([]);
  const [selectedReturn, setSelectedReturn] = useState<ReturnTicket | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [viewProofUrl, setViewProofUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchReturns = async () => {
      try {
        const res = await fetch('/api/returns');
        const data = await res.json();
        setReturns(data);
      } catch (err) {
        console.error("Failed to fetch returns", err);
      }
    };
    fetchReturns();
  }, []);

  const handleAction = async (id: string, newStatus: string) => {
    try {
      const res = await fetch('/api/returns', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus, adminNotes })
      });
      
      if (res.ok) {
        setReturns(returns.map(r => 
          r.id === id ? { ...r, status: newStatus, adminNotes: adminNotes || r.adminNotes } : r
        ));
        setSelectedReturn(null);
        setAdminNotes("");
        alert(`Return request ${id} marked as ${newStatus}`);
      } else {
        alert("Gagal memproses request");
      }
    } catch (e) {
      console.error(e);
      alert("Gagal memproses request");
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0, color: '#111827' }}>Returns & Complaints</h2>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>No.</th>
              <th>ID</th>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Reason</th>
              <th>Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {returns.map((req, index) => (
              <tr key={req.id}>
                <td>{index + 1}</td>
                <td><span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{req.id}</span></td>
                <td><strong>{req.orderId}</strong></td>
                <td>{req.customerName}</td>
                <td>
                  <span style={{ backgroundColor: '#fef2f2', color: '#ef4444', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: 'bold' }}>
                    {req.reason}
                  </span>
                </td>
                <td>{new Date(req.dateRequested).toLocaleDateString('id-ID')}</td>
                <td>
                  <span className={`status-badge ${
                    req.status === 'Approved' ? 'delivered' : 
                    req.status === 'In Transit' ? 'pending' : 
                    req.status === 'Rejected' ? 'cancelled' : 
                    req.status === 'Resolved' ? 'delivered' : 'pending'
                  }`}>
                    {req.status}
                  </span>
                </td>
                <td>
                  <button 
                    onClick={() => {
                      setSelectedReturn(req);
                      setAdminNotes(req.adminNotes || "");
                    }}
                    style={{
                      padding: '0.25rem 0.5rem',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.25rem',
                      cursor: 'pointer',
                      fontSize: '0.75rem'
                    }}
                  >
                    🔍 Mitigasi
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mitigation Modal */}
      {selectedReturn && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#fff', padding: '2rem', borderRadius: '0.5rem', width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: 0 }}>Detail Komplain (Mitigasi)</h3>
                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{selectedReturn.id} | {selectedReturn.orderId}</span>
              </div>
              <button onClick={() => setSelectedReturn(null)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}>✖</button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 'bold' }}>PELANGGAN</label>
                <div style={{ fontWeight: 'bold' }}>{selectedReturn.customerName}</div>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 'bold' }}>ALASAN KOMPLAIN</label>
                <div style={{ color: '#ef4444', fontWeight: 'bold' }}>{selectedReturn.reason}</div>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 'bold' }}>KETERANGAN PELANGGAN</label>
              <p style={{ margin: '0.25rem 0 0 0', padding: '0.75rem', backgroundColor: '#f9fafb', borderRadius: '0.25rem', fontSize: '0.875rem' }}>
                {selectedReturn.description}
              </p>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 'bold', marginBottom: '0.5rem', display: 'block' }}>FOTO BUKTI KENDALA</label>
              {selectedReturn.proofImageUrl ? (
                <div 
                  onClick={() => setViewProofUrl(selectedReturn.proofImageUrl || null)}
                  style={{ 
                    width: '100px', height: '100px', borderRadius: '0.5rem', overflow: 'hidden', cursor: 'zoom-in', border: '2px dashed #d1d5db' 
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selectedReturn.proofImageUrl} alt="Bukti" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ) : (
                <div style={{ fontSize: '0.8rem', color: '#9ca3af', fontStyle: 'italic' }}>Tidak ada foto bukti dilampirkan</div>
              )}
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 'bold' }}>CATATAN ADMIN (INTERNAL)</label>
              <textarea 
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Tulis hasil investigasi / mitigasi Anda di sini..."
                style={{ width: '100%', height: '80px', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #d1d5db', resize: 'vertical', marginTop: '0.25rem' }}
              />
            </div>
            
            {(selectedReturn.status === 'Approved' || selectedReturn.status === 'In Transit') && selectedReturn.returnTrackingNumber && (
              <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#eff6ff', borderRadius: '0.5rem', border: '1px solid #bfdbfe' }}>
                <label style={{ fontSize: '0.75rem', color: '#1d4ed8', fontWeight: 'bold' }}>RESI PENGIRIMAN PELANGGAN</label>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e3a8a', marginTop: '0.25rem' }}>
                  {selectedReturn.returnTrackingNumber}
                </div>
              </div>
            )}

            {selectedReturn.status === 'Pending' ? (
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  onClick={() => handleAction(selectedReturn.id, 'Rejected')}
                  style={{ flex: 1, padding: '0.75rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Tolak Pengajuan
                </button>
                <button 
                  onClick={() => handleAction(selectedReturn.id, 'Approved')}
                  style={{ flex: 1, padding: '0.75rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Approve Refund / Retur
                </button>
              </div>
            ) : selectedReturn.status === 'Approved' || selectedReturn.status === 'In Transit' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ padding: '1rem', backgroundColor: '#e5e7eb', textAlign: 'center', borderRadius: '0.25rem', fontWeight: 'bold', color: '#374151' }}>
                  Status Saat Ini: {selectedReturn.status}
                </div>
                <button 
                  onClick={() => handleAction(selectedReturn.id, 'Resolved')}
                  style={{ width: '100%', padding: '1rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}
                >
                  ✅ Tandai Selesai (Barang Diterima & Refund Diproses)
                </button>
              </div>
            ) : (
              <div style={{ padding: '1rem', backgroundColor: '#e5e7eb', textAlign: 'center', borderRadius: '0.25rem', fontWeight: 'bold', color: '#374151' }}>
                Status Saat Ini: {selectedReturn.status}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Image Proof Viewer Modal */}
      {viewProofUrl && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100
        }}>
          <button 
            onClick={() => setViewProofUrl(null)}
            style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', fontSize: '2rem', color: 'white', cursor: 'pointer' }}
          >
            ✖
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={viewProofUrl} alt="Bukti Full" style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }} />
        </div>
      )}
    </div>
  );
}
