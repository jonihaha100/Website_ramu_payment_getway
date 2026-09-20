"use client";

import { useState, useEffect } from "react";
import "../../app/admin/admin.css";

interface CustomSourcingRequest {
  id: string;
  name: string;
  businessName: string;
  phone: string;
  purposeText: string;
  flavorText: string;
  volumeText: string;
  status: string;
  date: string;
}

export default function CustomSourcingTable() {
  const [requests, setRequests] = useState<CustomSourcingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/custom-sourcing');
      if (!res.ok) throw new Error('Failed to fetch data');
      const data = await res.json();
      setRequests(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Pending': return { backgroundColor: '#fef3c7', color: '#92400e' };
      case 'Contacted': return { backgroundColor: '#dbeafe', color: '#1e40af' };
      case 'Completed': return { backgroundColor: '#d1fae5', color: '#065f46' };
      default: return { backgroundColor: '#f3f4f6', color: '#374151' };
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch('/api/custom-sourcing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      });
      
      if (res.ok) {
        setRequests(requests.map(req => 
          req.id === id ? { ...req, status: newStatus } : req
        ));
      } else {
        alert("Gagal mengupdate status");
      }
    } catch (error) {
      console.error("Failed to update status", error);
      alert("Gagal mengupdate status");
    }
  };

  const deleteRequest = async (id: string) => {
    if (!confirm("Yakin ingin menghapus permintaan Custom Sourcing ini?")) return;
    
    try {
      const res = await fetch(`/api/custom-sourcing?id=${id}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        setRequests(requests.filter(req => req.id !== id));
      } else {
        alert("Gagal menghapus permintaan");
      }
    } catch (error) {
      console.error("Failed to delete request", error);
      alert("Gagal menghapus permintaan");
    }
  };

  if (loading) return <div>Loading requests...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="admin-table-container">
      <div className="admin-table-header">
        <h2>Custom Sourcing Requests</h2>
      </div>

      {requests.length === 0 ? (
        <p style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
          Belum ada permintaan Custom Sourcing.
        </p>
      ) : (
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>No.</th>
                <th>Date</th>
                <th>Name / Business</th>
                <th>Phone (WA)</th>
                <th>Details</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req, index) => (
                <tr key={req.id}>
                  <td>{index + 1}</td>
                  <td>
                    {new Date(req.date).toLocaleDateString('id-ID', {
                      year: 'numeric', month: 'short', day: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </td>
                  <td>
                    <strong>{req.name}</strong>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      {req.businessName !== '-' ? req.businessName : 'Personal'}
                    </div>
                  </td>
                  <td>
                    <a href={`https://wa.me/${req.phone}`} target="_blank" rel="noreferrer" style={{ color: '#25D366', textDecoration: 'none', fontWeight: 'bold' }}>
                      {req.phone}
                    </a>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.875rem' }}>
                      <strong>Tujuan:</strong> {req.purposeText}<br/>
                      <strong>Rasa:</strong> {req.flavorText}<br/>
                      <strong>Volume:</strong> {req.volumeText}
                    </div>
                  </td>
                  <td>
                    <span style={{ 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '9999px', 
                      fontSize: '0.875rem', 
                      fontWeight: '500',
                      ...getStatusStyle(req.status)
                    }}>
                      {req.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <select 
                        value={req.status}
                        onChange={(e) => updateStatus(req.id, e.target.value)}
                        style={{ 
                          padding: '0.25rem', 
                          borderRadius: '0.25rem',
                          border: '1px solid #d1d5db',
                          fontSize: '0.875rem'
                        }}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Completed">Completed</option>
                      </select>
                      <button 
                        onClick={() => deleteRequest(req.id)}
                        style={{
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.25rem',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          fontWeight: 'bold'
                        }}
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
