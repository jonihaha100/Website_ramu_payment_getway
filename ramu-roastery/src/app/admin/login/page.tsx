"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setError("");
    
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (data.success) {
        document.cookie = `admin_token=${data.token}; path=/; max-age=86400;`;
        router.push("/admin");
      } else {
        setError(data.error || "Username atau Password salah.");
      }
    } catch (err) {
      setError("Terjadi kesalahan jaringan atau server saat login.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f3f4f6'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        padding: '2.5rem',
        borderRadius: '0.75rem',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ margin: 0, fontSize: '1.75rem', color: '#111827', fontWeight: 'bold' }}>Ramu Roastery</h1>
          <p style={{ margin: '0.5rem 0 0 0', color: '#6b7280', fontSize: '0.875rem' }}>Admin Dashboard Access</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {error && (
            <div style={{ padding: '0.75rem', backgroundColor: '#fee2e2', color: '#ef4444', borderRadius: '0.375rem', fontSize: '0.875rem', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
              Username
            </label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter admin username"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                outline: 'none',
                fontSize: '0.875rem',
                color: '#111827'
              }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
              Password
            </label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                outline: 'none',
                fontSize: '0.875rem',
                color: '#111827'
              }}
              required
            />
          </div>

          <button 
            type="submit"
            disabled={isProcessing}
            style={{
              width: '100%',
              padding: '0.875rem',
              backgroundColor: isProcessing ? '#374151' : '#111827',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.375rem',
              fontWeight: '600',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              marginTop: '0.5rem',
              transition: 'background-color 0.2s'
            }}
          >
            {isProcessing ? "Authenticating..." : "Sign In to Dashboard"}
          </button>
        </form>
      </div>
    </div>
  );
}
