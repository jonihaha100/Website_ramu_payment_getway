"use client";

import { useState, useEffect } from "react";
import { User } from "../../../data/mockUsers";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/users');
        const data = await res.json();
        const mappedUsers = data.map((u: any) => ({
          ...u,
          joinedDate: u.createdAt || new Date().toISOString(),
          loginMethod: 'Email', // Default since Prisma schema doesn't track this yet
          status: 'Active',
          role: u.role || 'USER',
        }));
        setUsers(mappedUsers);
      } catch (e) {
        console.error("Failed to fetch users", e);
      }
    };
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, role: newRole })
      });
      if (res.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
        alert(`User role updated to ${newRole}`);
      } else {
        alert("Failed to update user role");
      }
    } catch (e) {
      alert("Error updating role");
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0, color: '#111827' }}>Registered Customers</h2>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>No.</th>
              <th>ID</th>
              <th>Name</th>
              <th>Email / Phone</th>
              <th>Login Method</th>
              <th>Date Joined</th>
              <th>Role</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => (
              <tr key={user.id}>
                <td>{index + 1}</td>
                <td><span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{user.id}</span></td>
                <td><strong>{user.name}</strong></td>
                <td>
                  <div>{user.email}</div>
                  {user.phone && <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{user.phone}</div>}
                </td>
                <td>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem',
                    backgroundColor: '#f3f4f6',
                    border: '1px solid #d1d5db',
                    color: '#374151',
                  }}>
                    {user.loginMethod === 'Google' ? '🌐 Google' : '✉️ Form/Email'}
                  </span>
                </td>
                <td>{new Date(user.joinedDate).toLocaleDateString('id-ID')}</td>
                <td>
                  <select 
                    value={user.role} 
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    style={{
                      padding: '0.2rem',
                      borderRadius: '0.25rem',
                      border: '1px solid #d1d5db',
                      fontSize: '0.75rem',
                      backgroundColor: user.role === 'ADMIN' ? '#f3e8ff' : user.role === 'B2B' ? '#fef3c7' : '#e0f2fe',
                      color: user.role === 'ADMIN' ? '#7e22ce' : user.role === 'B2B' ? '#b45309' : '#0369a1',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="USER">USER</option>
                    <option value="B2B">B2B (Wholesale)</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </td>
                <td>
                  <span className={`status-badge ${user.status === 'Active' ? 'delivered' : 'cancelled'}`}>
                    {user.status}
                  </span>
                </td>
                <td>
                  <button 
                    onClick={() => {
                      setSelectedUser(user);
                      setShowPassword(false);
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
                    🔍 View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#111827' }}>User Profile</h3>
                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>ID: {selectedUser.id}</span>
              </div>
              <button 
                onClick={() => setSelectedUser(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#9ca3af' }}
              >
                ✖
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 'bold' }}>FULL NAME</label>
                <div style={{ color: '#111827', fontWeight: '500' }}>{selectedUser.name}</div>
              </div>

              {selectedUser.companyName && (
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 'bold' }}>COMPANY / CAFE NAME</label>
                  <div style={{ color: '#111827' }}>{selectedUser.companyName}</div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 'bold' }}>EMAIL ADDRESS</label>
                  <div style={{ color: '#111827' }}>{selectedUser.email}</div>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 'bold' }}>PHONE NUMBER</label>
                  <div style={{ color: '#111827' }}>{selectedUser.phone || '-'}</div>
                </div>
              </div>

              {/* SECURITY / PASSWORD SECTION */}
              {selectedUser.loginMethod === 'Email' && (
                <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '0.375rem', padding: '0.75rem', marginTop: '0.5rem' }}>
                  <label style={{ fontSize: '0.7rem', color: '#b45309', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    ⚠️ ACCOUNT SECURITY
                  </label>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                    <div style={{ fontSize: '0.875rem', color: '#92400e', fontFamily: 'monospace' }}>
                      Password: {showPassword ? (selectedUser.password || 'N/A') : '••••••••••••'}
                    </div>
                    <button 
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', backgroundColor: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '0.25rem', cursor: 'pointer', color: '#b45309', fontWeight: 'bold' }}
                    >
                      {showPassword ? 'Hide' : 'Reveal'}
                    </button>
                  </div>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.7rem', color: '#d97706' }}>
                    * In a production environment, passwords are encrypted and cannot be viewed. If a user forgets their password, please instruct them to use the &quot;Forgot Password&quot; feature instead.
                  </p>
                </div>
              )}
              {selectedUser.loginMethod === 'Google' && (
                <div style={{ backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '0.375rem', padding: '0.75rem', marginTop: '0.5rem' }}>
                  <label style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 'bold' }}>ACCOUNT SECURITY</label>
                  <div style={{ fontSize: '0.875rem', color: '#4b5563', marginTop: '0.25rem' }}>
                    User authenticates via Google OAuth. Password management is handled by Google.
                  </div>
                </div>
              )}

              <div>
                <label style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 'bold' }}>FULL ADDRESS</label>
                <div style={{ color: '#111827' }}>{selectedUser.address || '-'}</div>
                {selectedUser.city && <div style={{ color: '#4b5563', fontSize: '0.875rem' }}>{selectedUser.city}</div>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderTop: '1px solid #f3f4f6', paddingTop: '1rem', marginTop: '0.5rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 'bold' }}>TOTAL ORDERS</label>
                  <div style={{ color: '#111827', fontSize: '1.25rem', fontWeight: 'bold' }}>{selectedUser.totalOrders || 0}</div>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 'bold' }}>REGISTRATION DATE</label>
                  <div style={{ color: '#111827' }}>{new Date(selectedUser.joinedDate).toLocaleDateString('id-ID')}</div>
                </div>
              </div>

              {/* COFFEE PREFERENCES SECTION */}
              {selectedUser.coffeePreferences && (
                <div style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '1rem', marginTop: '1rem' }}>
                  <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', color: '#374151', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    ☕ Coffee Character & Preferences
                  </h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    {selectedUser.coffeePreferences.favoriteDrink && (
                      <div>
                        <label style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 'bold' }}>FAVORITE DRINK</label>
                        <div style={{ color: '#111827', fontSize: '0.875rem' }}>{selectedUser.coffeePreferences.favoriteDrink}</div>
                      </div>
                    )}
                    {selectedUser.coffeePreferences.tastePreference && (
                      <div>
                        <label style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 'bold' }}>TASTE PREFERENCE</label>
                        <div style={{ color: '#111827', fontSize: '0.875rem' }}>{selectedUser.coffeePreferences.tastePreference}</div>
                      </div>
                    )}
                    {selectedUser.coffeePreferences.frequency && (
                      <div>
                        <label style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 'bold' }}>DAILY FREQUENCY</label>
                        <div style={{ color: '#111827', fontSize: '0.875rem' }}>{selectedUser.coffeePreferences.frequency}</div>
                      </div>
                    )}
                    {selectedUser.coffeePreferences.budget && (
                      <div>
                        <label style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 'bold' }}>MONTHLY BUDGET</label>
                        <div style={{ color: '#111827', fontSize: '0.875rem' }}>{selectedUser.coffeePreferences.budget}</div>
                      </div>
                    )}
                    {selectedUser.coffeePreferences.tools && selectedUser.coffeePreferences.tools.length > 0 && (
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 'bold' }}>BREWING TOOLS</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.25rem' }}>
                          {selectedUser.coffeePreferences.tools.map((tool: string) => (
                            <span key={tool} style={{ backgroundColor: '#e0f2fe', color: '#0369a1', padding: '0.1rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: '500' }}>
                              {tool}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedUser.coffeePreferences.grinder && (
                      <div>
                        <label style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 'bold' }}>GRINDER</label>
                        <div style={{ color: '#111827', fontSize: '0.875rem' }}>{selectedUser.coffeePreferences.grinder}</div>
                      </div>
                    )}
                    {selectedUser.coffeePreferences.machine && (
                      <div>
                        <label style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 'bold' }}>MACHINE</label>
                        <div style={{ color: '#111827', fontSize: '0.875rem' }}>{selectedUser.coffeePreferences.machine}</div>
                      </div>
                    )}
                    
                    {/* Fallback for old mock data */}
                    {selectedUser.coffeePreferences.roastLevel && !selectedUser.coffeePreferences.favoriteDrink && (
                      <div>
                        <label style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 'bold' }}>PREFERRED ROAST LEVEL</label>
                        <div style={{ color: '#111827', fontSize: '0.875rem' }}>{selectedUser.coffeePreferences.roastLevel}</div>
                      </div>
                    )}
                    {selectedUser.coffeePreferences.flavorProfile && !selectedUser.coffeePreferences.favoriteDrink && (
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 'bold' }}>FLAVOR PROFILE</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.25rem' }}>
                          {selectedUser.coffeePreferences.flavorProfile?.map((note: string) => (
                            <span key={note} style={{ backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', padding: '0.1rem 0.5rem', borderRadius: '1rem', fontSize: '0.75rem', color: '#374151' }}>
                              {note}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setSelectedUser(null)}
                style={{ padding: '0.5rem 1rem', backgroundColor: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
