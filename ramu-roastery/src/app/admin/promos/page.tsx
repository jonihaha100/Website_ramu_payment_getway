"use client";

import { useState, useEffect } from "react";

type Promo = {
  id: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  validUntil: string | null;
  maxUses: number | null;
  usedCount: number;
  isActive: boolean;
};

export default function PromosPage() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Partial<Promo>>({});
  const [isNew, setIsNew] = useState(true);

  useEffect(() => {
    fetchPromos();
  }, []);

  const fetchPromos = async () => {
    try {
      const res = await fetch('/api/promos');
      const data = await res.json();
      if (Array.isArray(data)) {
        setPromos(data);
      } else {
        console.error("API returned non-array data:", data);
        setPromos([]);
      }
    } catch (e) {
      console.error("Failed to fetch promos", e);
      setPromos([]);
    }
  };

  const handleAddNew = () => {
    setEditingPromo({
      code: "",
      discountType: "percentage",
      discountValue: 0,
      isActive: true
    });
    setIsNew(true);
    setIsModalOpen(true);
  };

  const handleEdit = (promo: Promo) => {
    setEditingPromo({ 
      ...promo, 
      validUntil: promo.validUntil ? new Date(promo.validUntil).toISOString().split('T')[0] : "" 
    });
    setIsNew(false);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this promo?")) {
      try {
        await fetch(`/api/promos?id=${id}`, { method: 'DELETE' });
        fetchPromos();
      } catch (e) {
        alert("Failed to delete promo");
      }
    }
  };

  const handleSave = async () => {
    if (!editingPromo.code || !editingPromo.discountValue) {
      alert("Code and Discount Value are required");
      return;
    }

    try {
      if (isNew) {
        const res = await fetch('/api/promos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editingPromo)
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
      } else {
        const res = await fetch('/api/promos', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editingPromo)
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
      }
      setIsModalOpen(false);
      fetchPromos();
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  const activePromo = promos.find(p => p.isActive);

  const handleToggleActive = async (promo: Promo) => {
    try {
      await fetch('/api/promos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: promo.id,
          isActive: !promo.isActive
        })
      });
      fetchPromos();
    } catch (e: any) {
      alert(`Failed to update status: ${e.message}`);
    }
  };

  return (
    <div>
      {/* Live Customer Pop-up & Ticker Status Card */}
      <div style={{
        background: 'linear-gradient(135deg, #18120c 0%, #2b1810 100%)',
        border: '1px solid rgba(217, 119, 6, 0.3)',
        borderRadius: '12px',
        padding: '1.25rem 1.5rem',
        marginBottom: '1.75rem',
        color: '#f5efe6',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{
              background: '#22c55e',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              display: 'inline-block',
              boxShadow: '0 0 8px #22c55e'
            }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.5px', color: '#fbbf24', textTransform: 'uppercase' }}>
              Live Customer Pop-up & Top Ticker Banner
            </span>
          </div>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '1.15rem', color: '#ffffff' }}>
            {activePromo ? (
              <>Kupon Aktif: <span style={{ color: '#fbbf24', fontFamily: 'monospace', fontSize: '1.3rem' }}>{activePromo.code}</span> ({activePromo.discountType === 'percentage' ? `${activePromo.discountValue}% OFF` : `Rp ${activePromo.discountValue.toLocaleString('id-ID')} OFF`})</>
            ) : (
              <span style={{ color: '#9ca3af' }}>Tidak ada promo aktif yang ditampilkan ke pengunjung</span>
            )}
          </h3>
          <p style={{ margin: 0, fontSize: '0.825rem', color: '#d1c7bc' }}>
            Kode kupon berstatus &quot;Active&quot; akan otomatis ditampilkan di Pop-up Voucher Pengunjung Baru &amp; Ticker Atas.
          </p>
        </div>

        <button 
          onClick={handleAddNew}
          style={{
            padding: '0.65rem 1.25rem',
            background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '0.875rem',
            boxShadow: '0 2px 8px rgba(217, 119, 6, 0.4)'
          }}
        >
          + Tambah Promo Baru
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ margin: 0, color: '#111827', fontSize: '1.25rem' }}>Daftar Promo &amp; Kupon</h2>
        <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>Total {promos.length} Kupon</span>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>No.</th>
              <th>Kode Promo</th>
              <th>Potongan</th>
              <th>Pemakaian</th>
              <th>Berlaku Sampai</th>
              <th>Status Pop-up</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {promos.map((promo, index) => (
              <tr key={promo.id}>
                <td>{index + 1}</td>
                <td>
                  <strong style={{ fontFamily: 'monospace', fontSize: '1.05rem', color: promo.isActive ? '#d97706' : '#4b5563' }}>
                    {promo.code}
                  </strong>
                </td>
                <td>
                  {promo.discountType === 'percentage' 
                    ? `${promo.discountValue}% OFF` 
                    : `Rp ${promo.discountValue.toLocaleString('id-ID')} OFF`}
                </td>
                <td>{promo.usedCount} / {promo.maxUses ? promo.maxUses : '∞'}</td>
                <td>{promo.validUntil ? new Date(promo.validUntil).toLocaleDateString('id-ID') : 'Selamanya'}</td>
                <td>
                  <button
                    onClick={() => handleToggleActive(promo)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '999px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: promo.isActive ? '#dcfce7' : '#f3f4f6',
                      color: promo.isActive ? '#15803d' : '#6b7280',
                      transition: 'all 0.2s'
                    }}
                    title="Klik untuk mengubah status aktif"
                  >
                    {promo.isActive ? '● Active (Pop-up)' : '○ Inactive'}
                  </button>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="admin-action-btn" onClick={() => handleEdit(promo)}>Edit</button>
                    <button className="admin-action-btn" style={{ color: '#ef4444' }} onClick={() => handleDelete(promo.id)}>Hapus</button>
                  </div>
                </td>
              </tr>
            ))}
            {promos.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>Belum ada kupon promo</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            padding: '2rem',
            borderRadius: '0.5rem',
            width: '500px',
            maxWidth: '90%'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.25rem' }}>
              {isNew ? 'Create Promo Code' : 'Edit Promo Code'}
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Promo Code</label>
                <input 
                  type="text" 
                  value={editingPromo.code}
                  onChange={(e) => setEditingPromo({...editingPromo, code: e.target.value.toUpperCase()})}
                  placeholder="e.g. RAMU20"
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem', textTransform: 'uppercase' }}
                />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Type</label>
                  <select 
                    value={editingPromo.discountType}
                    onChange={(e) => setEditingPromo({...editingPromo, discountType: e.target.value as any})}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem' }}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (Rp)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Discount Value</label>
                  <input 
                    type="number" 
                    value={editingPromo.discountValue}
                    onChange={(e) => setEditingPromo({...editingPromo, discountValue: Number(e.target.value)})}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Valid Until (Optional)</label>
                  <input 
                    type="date" 
                    value={editingPromo.validUntil || ""}
                    onChange={(e) => setEditingPromo({...editingPromo, validUntil: e.target.value || null})}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Max Uses (Optional)</label>
                  <input 
                    type="number" 
                    value={editingPromo.maxUses || ""}
                    onChange={(e) => setEditingPromo({...editingPromo, maxUses: e.target.value ? Number(e.target.value) : null})}
                    placeholder="e.g. 100"
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                <input 
                  type="checkbox" 
                  id="isActive"
                  checked={editingPromo.isActive}
                  onChange={(e) => setEditingPromo({...editingPromo, isActive: e.target.checked})}
                />
                <label htmlFor="isActive" style={{ fontSize: '0.875rem' }}>Active Status</label>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
              <button 
                onClick={() => setIsModalOpen(false)}
                style={{ padding: '0.5rem 1rem', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '0.25rem', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                style={{ padding: '0.5rem 1rem', backgroundColor: '#111827', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}
              >
                Save Promo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
