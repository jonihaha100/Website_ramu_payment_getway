"use client";

import { useState, useEffect } from "react";

type StoreSetting = {
  flatShippingRate: number;
  isFreeShippingEnabled: boolean;
  freeShippingThreshold: number;
  taxRate: number;
  adminFee: number;
  activeCouriers: string;
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<StoreSetting>({
    flatShippingRate: 0,
    isFreeShippingEnabled: false,
    freeShippingThreshold: 0,
    taxRate: 10,
    adminFee: 2500,
    activeCouriers: 'JNE,Sicepat,J&T'
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (!data.error) setSettings(data);
      });
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      alert("Settings saved successfully!");
    } catch (e: any) {
      alert("Failed to save settings: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <h2 style={{ margin: '0 0 2rem 0', color: '#111827' }}>Store & Shipping Settings</h2>

      <div style={{
        backgroundColor: '#ffffff',
        padding: '2rem',
        borderRadius: '0.5rem',
        border: '1px solid #e5e7eb',
        maxWidth: '800px'
      }}>
        
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>Shipping Rates</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Flat Shipping Rate (Rp)</label>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 0.5rem 0' }}>Fallback standard shipping rate if dynamic API fails.</p>
              <input 
                type="number" 
                value={settings.flatShippingRate}
                onChange={(e) => setSettings({...settings, flatShippingRate: Number(e.target.value)})}
                style={{ width: '100%', maxWidth: '300px', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input 
                type="checkbox" 
                id="freeShipping"
                checked={settings.isFreeShippingEnabled}
                onChange={(e) => setSettings({...settings, isFreeShippingEnabled: e.target.checked})}
                style={{ width: '16px', height: '16px' }}
              />
              <label htmlFor="freeShipping" style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>Enable Free Shipping Promotion</label>
            </div>

            {settings.isFreeShippingEnabled && (
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Free Shipping Threshold (Minimum Order Rp)</label>
                <input 
                  type="number" 
                  value={settings.freeShippingThreshold}
                  onChange={(e) => setSettings({...settings, freeShippingThreshold: Number(e.target.value)})}
                  style={{ width: '100%', maxWidth: '300px', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem' }}
                />
              </div>
            )}
          </div>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>Taxes & Fees</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Tax Rate (%)</label>
              <input 
                type="number" 
                value={settings.taxRate}
                onChange={(e) => setSettings({...settings, taxRate: Number(e.target.value)})}
                style={{ width: '100%', maxWidth: '300px', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Admin Fee (Rp)</label>
              <input 
                type="number" 
                value={settings.adminFee}
                onChange={(e) => setSettings({...settings, adminFee: Number(e.target.value)})}
                style={{ width: '100%', maxWidth: '300px', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem' }}
              />
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>Active Couriers</h3>
          <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 1rem 0' }}>Comma-separated list of couriers to display at checkout.</p>
          <input 
            type="text" 
            value={settings.activeCouriers}
            onChange={(e) => setSettings({...settings, activeCouriers: e.target.value})}
            placeholder="e.g. JNE,Sicepat,GoSend"
            style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem' }}
          />
        </div>

        <button 
          onClick={handleSave}
          disabled={isSaving}
          style={{
            padding: '0.75rem 2rem',
            backgroundColor: '#111827',
            color: 'white',
            border: 'none',
            borderRadius: '0.25rem',
            cursor: isSaving ? 'not-allowed' : 'pointer',
            fontWeight: '600'
          }}
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>

      </div>
    </div>
  );
}
