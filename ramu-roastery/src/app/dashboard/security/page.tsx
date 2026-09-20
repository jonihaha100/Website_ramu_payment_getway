"use client";
import React, { useState } from 'react';
import { useLang } from '../../../context/LanguageContext';
import { useToast } from '../../../context/ToastContext';
import { t } from '../../../data/translations';

export default function SecurityPage() {
  const { lang } = useLang();
  const { addToast } = useToast();
  const tr = t[lang];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTimeout(() => {
      addToast(tr.dash_sec_msg_saved, "success");
    }, 500);
  };

  return (
    <div style={{ maxWidth: '600px' }}>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.5rem', color: '#111827' }}>{tr.dash_sec_title}</h1>
      <p style={{ color: '#4b5563', marginBottom: '2rem' }}>{tr.dash_sec_desc}</p>
      
      <form onSubmit={handleSubmit} style={{ backgroundColor: '#fafafa', padding: '2rem', borderRadius: '1rem', border: '1px solid rgba(0,0,0,0.1)' }}>
        <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontWeight: 600, fontSize: '0.95rem' }}>{tr.dash_sec_lbl_curr}</label>
          <input type="password" required style={{ padding: '0.75rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', outline: 'none' }} />
        </div>
        
        <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontWeight: 600, fontSize: '0.95rem' }}>{tr.dash_sec_lbl_new}</label>
          <input type="password" required style={{ padding: '0.75rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', outline: 'none' }} />
        </div>

        <div style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontWeight: 600, fontSize: '0.95rem' }}>{tr.dash_sec_lbl_conf}</label>
          <input type="password" required style={{ padding: '0.75rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', outline: 'none' }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <button type="submit" style={{ padding: '0.75rem 2rem', backgroundColor: '#78350F', color: 'white', border: 'none', borderRadius: '0.375rem', fontWeight: 600, cursor: 'pointer' }}>
            {tr.dash_sec_btn_save}
          </button>
        </div>
      </form>
    </div>
  );
}
