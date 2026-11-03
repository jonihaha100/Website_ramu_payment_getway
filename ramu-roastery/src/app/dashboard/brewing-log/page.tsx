"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { useLang } from '../../../context/LanguageContext';
import { useToast } from '../../../context/ToastContext';
import { t } from '../../../data/translations';

interface BrewingLogItem {
  id: string;
  coffee: string;
  method: string;
  dose: string;
  grind: string;
  temperature: string;
  brewTime: string;
  tempTime?: string; // backwards compatibility
  notes: string;
  date: string;
}

export default function BrewingLogPage() {
  const { user } = useAuth();
  const { lang } = useLang();
  const { addToast } = useToast();
  const translations = t[lang as keyof typeof t];

  const [brewingLogs, setBrewingLogs] = useState<BrewingLogItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMethodFilter, setSelectedMethodFilter] = useState('ALL');

  // Dedicated separated fields for temperature and time
  const [newLog, setNewLog] = useState({
    coffee: "Fullwash Gn. Halu",
    method: "V60 Dripper",
    dose: "15g : 225ml (1:15)",
    grind: "Medium-Fine",
    temperature: "92",
    brewTime: "02:30",
    notes: "Sweet cane, clean green apple, floral aftertaste"
  });

  const [isFormExpanded, setIsFormExpanded] = useState(true);

  // Load from localStorage
  useEffect(() => {
    if (user?.email) {
      try {
        const savedLogs = localStorage.getItem(`ramu_brewing_logs_${user.email}`);
        if (savedLogs) {
          const parsed = JSON.parse(savedLogs);
          // Normalize backwards compatibility
          const normalized = parsed.map((item: any) => {
            if (!item.temperature && item.tempTime) {
              const parts = item.tempTime.split('•');
              return {
                ...item,
                temperature: parts[0]?.replace('°C', '').trim() || '92',
                brewTime: parts[1]?.trim() || '02:30'
              };
            }
            return item;
          });
          setBrewingLogs(normalized);
        }
      } catch (e) {
        console.error("Failed to load brewing logs", e);
      }
    }
  }, [user?.email]);

  const handleSaveBrewingLog = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newLog.coffee.trim()) {
      addToast(
        lang === 'ja' ? "コーヒー豆の名前を入力してください" : (lang === 'en' ? "Please enter coffee bean name" : "Silakan masukkan nama biji kopi"),
        "error"
      );
      return;
    }

    const dateFormatted = new Date().toLocaleDateString(
      lang === 'ja' ? 'ja-JP' : (lang === 'en' ? 'en-US' : 'id-ID'),
      { day: 'numeric', month: 'short', year: 'numeric' }
    );

    const newItem: BrewingLogItem = {
      id: Date.now().toString(),
      coffee: newLog.coffee.trim(),
      method: newLog.method,
      dose: newLog.dose.trim() || '15g : 225ml',
      grind: newLog.grind.trim() || 'Medium',
      temperature: newLog.temperature.trim() || '92',
      brewTime: newLog.brewTime.trim() || '02:30',
      notes: newLog.notes.trim(),
      date: dateFormatted
    };

    const updated = [newItem, ...brewingLogs];
    setBrewingLogs(updated);

    if (user?.email) {
      localStorage.setItem(`ramu_brewing_logs_${user.email}`, JSON.stringify(updated));
    }

    addToast(
      lang === 'ja' ? "抽出ログを保存しました！" : (lang === 'en' ? "Brewing log saved successfully!" : "Catatan seduh berhasil disimpan!"),
      "success"
    );

    // Reset notes
    setNewLog(prev => ({
      ...prev,
      notes: ""
    }));
  };

  const handleDeleteLog = (id: string) => {
    const updated = brewingLogs.filter(l => l.id !== id);
    setBrewingLogs(updated);
    if (user?.email) {
      localStorage.setItem(`ramu_brewing_logs_${user.email}`, JSON.stringify(updated));
    }
    addToast(
      lang === 'ja' ? "抽出ログを削除しました" : (lang === 'en' ? "Brew log deleted" : "Catatan seduh dihapus"),
      "info"
    );
  };

  const handleCopyRecipe = (log: BrewingLogItem) => {
    const text = `☕ ${log.coffee} (${log.method})\n⚖️ Rasio: ${log.dose}\n⚙️ Gilingan: ${log.grind}\n🌡️ Suhu Air: ${log.temperature}°C\n⏱️ Waktu Seduh: ${log.brewTime}\n📝 Catatan Rasa: ${log.notes || '-'}\n📅 Diseduh: ${log.date}\n— Kalibrasi Ramu Roastery Company`;
    navigator.clipboard.writeText(text);
    addToast(
      lang === 'ja' ? "レシピをクリップボードにコピーしました！" : (lang === 'en' ? "Brew recipe copied to clipboard!" : "Resep seduh berhasil disalin ke clipboard!"),
      "success"
    );
  };

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return brewingLogs.filter(log => {
      const matchSearch = log.coffee.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.method.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchMethod = selectedMethodFilter === 'ALL' || log.method.toLowerCase().includes(selectedMethodFilter.toLowerCase());

      return matchSearch && matchMethod;
    });
  }, [brewingLogs, searchQuery, selectedMethodFilter]);

  // Method presets
  const methodPresets = [
    "V60 Dripper",
    "Aeropress",
    "Kalita Wave",
    "Origami Dripper",
    "Espresso Machine",
    "French Press",
    "Clever Dripper",
    "Tubruk Tradisional",
    "Cold Brew"
  ];

  const coffeePresets = [
    "Fullwash Gn. Halu",
    "Natural Kamojang",
    "Honey Frinsa",
    "House Blend Senja",
    "Robusta Dampit"
  ];

  const tempPresets = ["88", "90", "92", "94", "96"];
  const timePresets = ["00:30", "02:00", "02:15", "02:30", "02:45", "03:00"];
  const ratioPresets = ["15g : 225ml (1:15)", "15g : 240ml (1:16)", "18g : 270ml (1:15)", "18g : 36g (Espresso)"];
  const grindPresets = ["Fine", "Medium-Fine", "Medium", "Medium-Coarse", "Coarse"];

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', color: '#111111' }}>
      {/* Breadcrumb & Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: '#666666', marginBottom: '1.25rem' }}>
        <Link href="/dashboard" style={{ color: '#666666', textDecoration: 'none' }}>
          {lang === 'ja' ? 'アカウント' : (lang === 'en' ? 'Dashboard' : 'Dasbor')}
        </Link>
        <span>/</span>
        <span style={{ color: '#111111', fontWeight: 600 }}>
          {lang === 'ja' ? '抽出ログ' : (lang === 'en' ? 'Brewing Log' : 'Catatan Seduh')}
        </span>
      </div>

      {/* Header Banner */}
      <div style={{
        background: '#FAF8F5',
        border: '1px solid #E8E4DC',
        borderRadius: '4px',
        padding: '1.75rem',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#FFFFFF', border: '1px solid #E8E4DC', padding: '0.25rem 0.75rem', borderRadius: '3px', fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9E8765', fontWeight: 700, marginBottom: '0.75rem' }}>
              <span>BARISTA CALIBRATION NOTEBOOK</span>
            </div>
            <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.75rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: '#111111', letterSpacing: '-0.01em' }}>
              {lang === 'ja' ? 'デイリー抽出ログ（Brewing Log）' : (lang === 'en' ? 'Daily Brewing Log & Calibration' : 'Catatan Seduh Harian (Brewing Log)')}
            </h1>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#666666', maxWidth: '640px', lineHeight: 1.5 }}>
              {lang === 'ja'
                ? '湯温、抽出時間、比率、挽き目を個別に記録し、お気に入りのラムコーヒー豆の最高の一杯をいつでも再現できます。'
                : (lang === 'en'
                  ? 'Record water temperature, brew time, ratio, and grind calibration separately to replicate your perfect cup every time.'
                  : 'Catat kalibrasi suhu air, waktu ekstraksi, rasio, dan tingkat gilingan secara terpisah untuk menyeduh secangkir kopi sempurna setiap saat.')}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ background: '#FFFFFF', border: '1px solid #E8E4DC', padding: '0.75rem 1.25rem', borderRadius: '3px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111111' }}>{brewingLogs.length}</div>
              <div style={{ fontSize: '0.7rem', color: '#666666', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {lang === 'ja' ? '記録レシピ' : (lang === 'en' ? 'Saved Recipes' : 'Resep Tersimpan')}
              </div>
            </div>
            <button
              onClick={() => setIsFormExpanded(!isFormExpanded)}
              style={{
                background: isFormExpanded ? '#FFFFFF' : '#111111',
                color: isFormExpanded ? '#111111' : '#FFFFFF',
                border: '1px solid #111111',
                borderRadius: '3px',
                padding: '0.75rem 1.25rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.15s ease'
              }}
            >
              <span>{isFormExpanded ? '−' : '+'}</span>
              <span>{isFormExpanded ? (lang === 'ja' ? 'フォームを閉じる' : (lang === 'en' ? 'Collapse Form' : 'Tutup Form')) : (lang === 'ja' ? '新規レシピ追加' : (lang === 'en' ? 'Add New Recipe' : 'Tambah Catatan Baru'))}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Form Input Section */}
      {isFormExpanded && (
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E8E4DC',
          borderRadius: '4px',
          padding: '1.75rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 16px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid #E8E4DC', paddingBottom: '0.75rem' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#111111', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
              {lang === 'ja' ? '新規抽出パラメータ入力' : (lang === 'en' ? 'Record New Brew Calibration' : 'Form Kalibrasi Seduh Baru')}
            </h2>
            <span style={{ fontSize: '0.75rem', color: '#9E8765', fontWeight: 600 }}>
              {lang === 'ja' ? '※ 湯温と時間は個別入力' : (lang === 'en' ? '※ Temp & Time Separated' : '✓ Suhu & Waktu Terpisah')}
            </span>
          </div>

          <form onSubmit={handleSaveBrewingLog}>
            {/* Row 1: Biji Kopi & Metode Seduh */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#111111', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {lang === 'ja' ? 'コーヒー豆 (Coffee Beans) *' : (lang === 'en' ? 'Coffee Beans *' : 'Biji Kopi *')}
                </label>
                <input
                  type="text"
                  value={newLog.coffee}
                  onChange={(e) => setNewLog({ ...newLog, coffee: e.target.value })}
                  required
                  placeholder={lang === 'ja' ? '例: Fullwash Gn. Halu' : 'Contoh: Fullwash Gn. Halu / Natural Kamojang'}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '3px',
                    fontSize: '0.9rem',
                    color: '#111111',
                    background: '#FFFFFF'
                  }}
                />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.4rem' }}>
                  {coffeePresets.slice(0, 4).map(c => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setNewLog({ ...newLog, coffee: c })}
                      style={{
                        background: newLog.coffee === c ? '#F3EFEA' : '#FAFAFA',
                        border: '1px solid #E5E7EB',
                        borderRadius: '2px',
                        fontSize: '0.72rem',
                        padding: '0.15rem 0.5rem',
                        color: newLog.coffee === c ? '#111111' : '#666666',
                        cursor: 'pointer'
                      }}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#111111', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {lang === 'ja' ? '抽出器具 (Brew Method)' : (lang === 'en' ? 'Brew Method' : 'Metode Seduh')}
                </label>
                <select
                  value={newLog.method}
                  onChange={(e) => setNewLog({ ...newLog, method: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '3px',
                    fontSize: '0.9rem',
                    color: '#111111',
                    background: '#FFFFFF'
                  }}
                >
                  {methodPresets.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2: Rasio & Gilingan */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#111111', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {lang === 'ja' ? '比率・粉量 (Ratio & Dose)' : (lang === 'en' ? 'Ratio & Dose' : 'Rasio & Dosis')}
                </label>
                <input
                  type="text"
                  value={newLog.dose}
                  onChange={(e) => setNewLog({ ...newLog, dose: e.target.value })}
                  placeholder="15g : 225ml (1:15)"
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '3px',
                    fontSize: '0.9rem',
                    color: '#111111',
                    background: '#FFFFFF'
                  }}
                />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.4rem' }}>
                  {ratioPresets.map(r => (
                    <button
                      type="button"
                      key={r}
                      onClick={() => setNewLog({ ...newLog, dose: r })}
                      style={{
                        background: newLog.dose === r ? '#F3EFEA' : '#FAFAFA',
                        border: '1px solid #E5E7EB',
                        borderRadius: '2px',
                        fontSize: '0.72rem',
                        padding: '0.15rem 0.5rem',
                        color: newLog.dose === r ? '#111111' : '#666666',
                        cursor: 'pointer'
                      }}
                    >
                      {r.split(' ')[0]} {r.split(' ')[2] || ''}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#111111', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {lang === 'ja' ? '挽き目 (Grind Size)' : (lang === 'en' ? 'Grind Size' : 'Tingkat Gilingan')}
                </label>
                <input
                  type="text"
                  value={newLog.grind}
                  onChange={(e) => setNewLog({ ...newLog, grind: e.target.value })}
                  placeholder="Medium-Fine"
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '3px',
                    fontSize: '0.9rem',
                    color: '#111111',
                    background: '#FFFFFF'
                  }}
                />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.4rem' }}>
                  {grindPresets.map(g => (
                    <button
                      type="button"
                      key={g}
                      onClick={() => setNewLog({ ...newLog, grind: g })}
                      style={{
                        background: newLog.grind === g ? '#F3EFEA' : '#FAFAFA',
                        border: '1px solid #E5E7EB',
                        borderRadius: '2px',
                        fontSize: '0.72rem',
                        padding: '0.15rem 0.5rem',
                        color: newLog.grind === g ? '#111111' : '#666666',
                        cursor: 'pointer'
                      }}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 3: SUHU & WAKTU TERPISAH (TERFOKUS SESUAI PERMINTAAN USER) */}
            <div style={{
              background: '#FAF8F5',
              border: '1px solid #E8E4DC',
              borderRadius: '4px',
              padding: '1.25rem',
              marginBottom: '1.25rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.9rem' }}>⏱️</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#111111', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {lang === 'ja' ? '温度と時間の個別設定 (Suhu Air & Waktu Terpisah)' : (lang === 'en' ? 'Water Temperature & Extraction Time (Separated)' : 'Kalibrasi Suhu Air & Waktu Seduh (Terpisah)')}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                {/* 1. SUHU AIR (°C) */}
                <div>
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', fontWeight: 700, color: '#111111', marginBottom: '0.35rem' }}>
                    <span>🌡️ {lang === 'ja' ? 'お湯の温度 (°C)' : (lang === 'en' ? 'Water Temperature (°C)' : 'Suhu Air (°C)')}</span>
                    <span style={{ fontSize: '0.72rem', color: '#9E8765', fontWeight: 600 }}>
                      Filter: 90° - 93°C
                    </span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      min="70"
                      max="100"
                      step="1"
                      value={newLog.temperature}
                      onChange={(e) => setNewLog({ ...newLog, temperature: e.target.value })}
                      placeholder="92"
                      style={{
                        width: '100%',
                        padding: '0.65rem 2.5rem 0.65rem 0.85rem',
                        border: '1px solid #D1D5DB',
                        borderRadius: '3px',
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: '#111111',
                        background: '#FFFFFF'
                      }}
                    />
                    <span style={{
                      position: 'absolute',
                      right: '0.85rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      color: '#666666',
                      pointerEvents: 'none'
                    }}>
                      °C
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.45rem' }}>
                    <span style={{ fontSize: '0.7rem', color: '#666666', alignSelf: 'center' }}>Pilihan:</span>
                    {tempPresets.map(tVal => (
                      <button
                        type="button"
                        key={tVal}
                        onClick={() => setNewLog({ ...newLog, temperature: tVal })}
                        style={{
                          background: newLog.temperature === tVal ? '#111111' : '#FFFFFF',
                          border: newLog.temperature === tVal ? '1px solid #111111' : '1px solid #E5E7EB',
                          borderRadius: '2px',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          padding: '0.15rem 0.45rem',
                          color: newLog.temperature === tVal ? '#FFFFFF' : '#374151',
                          cursor: 'pointer'
                        }}
                      >
                        {tVal}°C
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. WAKTU SEDUH / EKSTRAKSI */}
                <div>
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', fontWeight: 700, color: '#111111', marginBottom: '0.35rem' }}>
                    <span>⏱️ {lang === 'ja' ? '抽出時間 (Menit : Detik)' : (lang === 'en' ? 'Brew Time (Min : Sec)' : 'Waktu Seduh (Menit : Detik)')}</span>
                    <span style={{ fontSize: '0.72rem', color: '#666666' }}>
                      Contoh: 02:30
                    </span>
                  </label>
                  <input
                    type="text"
                    value={newLog.brewTime}
                    onChange={(e) => setNewLog({ ...newLog, brewTime: e.target.value })}
                    placeholder="02:30 (atau 2m 30s)"
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      border: '1px solid #D1D5DB',
                      borderRadius: '3px',
                      fontSize: '1rem',
                      fontWeight: 600,
                      color: '#111111',
                      background: '#FFFFFF'
                    }}
                  />
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.45rem' }}>
                    <span style={{ fontSize: '0.7rem', color: '#666666', alignSelf: 'center' }}>Pilihan:</span>
                    {timePresets.map(tTime => (
                      <button
                        type="button"
                        key={tTime}
                        onClick={() => setNewLog({ ...newLog, brewTime: tTime })}
                        style={{
                          background: newLog.brewTime === tTime ? '#111111' : '#FFFFFF',
                          border: newLog.brewTime === tTime ? '1px solid #111111' : '1px solid #E5E7EB',
                          borderRadius: '2px',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          padding: '0.15rem 0.45rem',
                          color: newLog.brewTime === tTime ? '#FFFFFF' : '#374151',
                          cursor: 'pointer'
                        }}
                      >
                        {tTime}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Row 4: Catatan Rasa & Aftertaste */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#111111', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {lang === 'ja' ? 'フレーバーノート・余韻 (Tasting Notes)' : (lang === 'en' ? 'Tasting Notes & Aftertaste' : 'Catatan Rasa & Aftertaste')}
              </label>
              <input
                type="text"
                value={newLog.notes}
                onChange={(e) => setNewLog({ ...newLog, notes: e.target.value })}
                placeholder={lang === 'ja' ? '例: 甘いサトウキビ感、華やかなジャスミンのアロマ、心地よい余韻' : 'Contoh: Sweet cane, aroma floral melati kuat, acidity menyegarkan, aftertaste bersih'}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  border: '1px solid #D1D5DB',
                  borderRadius: '3px',
                  fontSize: '0.9rem',
                  color: '#111111',
                  background: '#FFFFFF'
                }}
              />
            </div>

            {/* Submit Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setNewLog({
                  coffee: "Fullwash Gn. Halu",
                  method: "V60 Dripper",
                  dose: "15g : 225ml (1:15)",
                  grind: "Medium-Fine",
                  temperature: "92",
                  brewTime: "02:30",
                  notes: ""
                })}
                style={{
                  background: 'none',
                  border: '1px solid #E5E7EB',
                  borderRadius: '3px',
                  padding: '0.65rem 1.25rem',
                  fontSize: '0.85rem',
                  color: '#666666',
                  cursor: 'pointer'
                }}
              >
                {lang === 'ja' ? 'リセット' : (lang === 'en' ? 'Reset' : 'Atur Ulang')}
              </button>
              <button
                type="submit"
                style={{
                  background: '#111111',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '3px',
                  padding: '0.65rem 1.75rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  letterSpacing: '0.02em',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
                <span>💾</span>
                <span>{lang === 'ja' ? '抽出ログを保存' : (lang === 'en' ? 'Save Brewing Log' : 'Simpan Catatan Seduh')}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* History & Filter Section */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E8E4DC',
        borderRadius: '4px',
        padding: '1.75rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem', borderBottom: '1px solid #E8E4DC', paddingBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.25rem 0', color: '#111111' }}>
              {lang === 'ja' ? '抽出ログ一覧' : (lang === 'en' ? 'Saved Brewing Logs' : 'Daftar Resep & Riwayat Seduh')}
            </h3>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#666666' }}>
              {lang === 'ja'
                ? `全 ${brewingLogs.length} 件中 ${filteredLogs.length} 件を表示`
                : (lang === 'en'
                  ? `Showing ${filteredLogs.length} of ${brewingLogs.length} recorded recipes`
                  : `Menampilkan ${filteredLogs.length} dari total ${brewingLogs.length} resep tersimpan`)}
            </p>
          </div>

          {/* Search bar */}
          <div style={{ minWidth: '240px' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'ja' ? '豆名やノートで検索...' : (lang === 'en' ? 'Search beans or notes...' : 'Cari biji kopi atau rasa...')}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: '1px solid #D1D5DB',
                borderRadius: '3px',
                fontSize: '0.82rem',
                color: '#111111'
              }}
            />
          </div>
        </div>

        {/* Method filter chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {['ALL', 'V60', 'Aeropress', 'Espresso', 'Cold Brew', 'Tubruk'].map(filter => (
            <button
              key={filter}
              onClick={() => setSelectedMethodFilter(filter)}
              style={{
                background: selectedMethodFilter === filter ? '#111111' : '#F9F8F6',
                color: selectedMethodFilter === filter ? '#FFFFFF' : '#666666',
                border: selectedMethodFilter === filter ? '1px solid #111111' : '1px solid #E8E4DC',
                borderRadius: '3px',
                padding: '0.35rem 0.75rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {filter === 'ALL' ? (lang === 'ja' ? 'すべて' : (lang === 'en' ? 'All Methods' : 'Semua Metode')) : filter}
            </button>
          ))}
        </div>

        {/* List of cards */}
        {filteredLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem', background: '#FAF8F5', borderRadius: '4px', border: '1px dashed #E8E4DC' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>☕</div>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: '#111111' }}>
              {lang === 'ja' ? '抽出ログがありません' : (lang === 'en' ? 'No brew logs recorded yet' : 'Belum Ada Catatan Seduh')}
            </h4>
            <p style={{ fontSize: '0.85rem', color: '#666666', margin: '0 auto 1.25rem auto', maxWidth: '420px' }}>
              {lang === 'ja'
                ? 'お気に入りのコーヒー豆と抽出器具を使って、最初のレシピを上部のフォームから記録してみましょう。'
                : (lang === 'en'
                  ? 'Start by recording your first recipe calibration in the form above to track taste evolution.'
                  : 'Mulai dengan mencatat kalibrasi resep pertama Anda pada form di atas untuk melacak perkembangan rasa seduhan Anda.')}
            </p>
            {!isFormExpanded && (
              <button
                onClick={() => setIsFormExpanded(true)}
                style={{
                  background: '#111111',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '3px',
                  padding: '0.6rem 1.25rem',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                + {lang === 'ja' ? '最初のレシピを記録する' : (lang === 'en' ? 'Record First Recipe' : 'Catat Resep Pertama')}
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredLogs.map(log => {
              const tempDisplay = log.temperature ? `${log.temperature}°C` : (log.tempTime?.split('•')[0]?.trim() || '-');
              const timeDisplay = log.brewTime ? log.brewTime : (log.tempTime?.split('•')[1]?.trim() || '-');

              return (
                <div
                  key={log.id}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E8E4DC',
                    borderRadius: '4px',
                    padding: '1.25rem',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.85rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#111111' }}>
                          {log.coffee}
                        </span>
                        <span style={{
                          background: '#F3EFEA',
                          color: '#111111',
                          border: '1px solid #E8E4DC',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '2px',
                          textTransform: 'uppercase'
                        }}>
                          {log.method}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#9E8765' }}>
                        📅 {log.date}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleCopyRecipe(log)}
                        style={{
                          background: '#FAF8F5',
                          border: '1px solid #E8E4DC',
                          borderRadius: '3px',
                          padding: '0.35rem 0.65rem',
                          fontSize: '0.75rem',
                          color: '#111111',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                        title="Salin resep untuk dibagikan"
                      >
                        📋 {lang === 'ja' ? 'コピー' : (lang === 'en' ? 'Copy' : 'Salin')}
                      </button>
                      <button
                        onClick={() => handleDeleteLog(log.id)}
                        style={{
                          background: 'none',
                          border: '1px solid #FEE2E2',
                          borderRadius: '3px',
                          padding: '0.35rem 0.65rem',
                          fontSize: '0.75rem',
                          color: '#DC2626',
                          cursor: 'pointer'
                        }}
                      >
                        {lang === 'ja' ? '削除' : (lang === 'en' ? 'Delete' : 'Hapus')}
                      </button>
                    </div>
                  </div>

                  {/* Measurement Grid with Distinct Suhu and Waktu Badges */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                    gap: '0.6rem',
                    marginBottom: '0.85rem'
                  }}>
                    <div style={{ background: '#FAF8F5', border: '1px solid #E8E4DC', padding: '0.5rem 0.75rem', borderRadius: '3px' }}>
                      <div style={{ fontSize: '0.68rem', color: '#666666', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        ⚖️ Rasio & Dosis
                      </div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#111111', marginTop: '0.15rem' }}>
                        {log.dose}
                      </div>
                    </div>

                    <div style={{ background: '#FAF8F5', border: '1px solid #E8E4DC', padding: '0.5rem 0.75rem', borderRadius: '3px' }}>
                      <div style={{ fontSize: '0.68rem', color: '#666666', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        ⚙️ Gilingan
                      </div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#111111', marginTop: '0.15rem' }}>
                        {log.grind}
                      </div>
                    </div>

                    {/* SUHU AIR BADGE */}
                    <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', padding: '0.5rem 0.75rem', borderRadius: '3px' }}>
                      <div style={{ fontSize: '0.68rem', color: '#92400E', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        🌡️ Suhu Air
                      </div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#78350F', marginTop: '0.15rem' }}>
                        {tempDisplay}
                      </div>
                    </div>

                    {/* WAKTU SEDUH BADGE */}
                    <div style={{ background: '#EFF6FF', border: '1px solid #DBEAFE', padding: '0.5rem 0.75rem', borderRadius: '3px' }}>
                      <div style={{ fontSize: '0.68rem', color: '#1E40AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        ⏱️ Waktu Ekstraksi
                      </div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1E3A8A', marginTop: '0.15rem' }}>
                        {timeDisplay}
                      </div>
                    </div>
                  </div>

                  {/* Tasting Notes */}
                  {log.notes && (
                    <div style={{
                      background: '#FDFBF7',
                      borderLeft: '3px solid #9E8765',
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.83rem',
                      color: '#4B5563',
                      fontStyle: 'italic',
                      lineHeight: 1.4
                    }}>
                      "{log.notes}"
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cross link to Coffee Taste Profile & Shop Fresh Beans */}
      <div style={{
        marginTop: '2rem',
        padding: '1.25rem 1.5rem',
        background: '#FAF8F5',
        border: '1px solid #E8E4DC',
        borderRadius: '4px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <strong style={{ fontSize: '0.9rem', color: '#111111', display: 'block', marginBottom: '0.2rem' }}>
            {lang === 'ja' ? '☕ ラムの焙煎豆を購入する' : (lang === 'en' ? '☕ Explore Fresh Ramu Roasted Beans' : '☕ Butuh Stok Biji Kopi Sangrai Segar?')}
          </strong>
          <span style={{ fontSize: '0.8rem', color: '#666666' }}>
            {lang === 'ja'
              ? '毎週月曜・木曜に焙煎。淹れたての美味しさをお届けします。'
              : (lang === 'en'
                ? 'Freshly roasted every Monday & Thursday directly from Bandung.'
                : 'Disangrai segar setiap Senin & Kamis langsung dari Bandung untuk hasil seduh maksimal.')}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link
            href="/dashboard/coffee-profile"
            style={{
              padding: '0.5rem 1rem',
              background: '#FFFFFF',
              border: '1px solid #E8E4DC',
              color: '#111111',
              borderRadius: '3px',
              fontSize: '0.8rem',
              fontWeight: 600,
              textDecoration: 'none'
            }}
          >
            {lang === 'ja' ? '診断を見る' : (lang === 'en' ? 'Taste Profile' : 'Profil Kopi')}
          </Link>
          <Link
            href="/products"
            style={{
              padding: '0.5rem 1rem',
              background: '#111111',
              color: '#FFFFFF',
              borderRadius: '3px',
              fontSize: '0.8rem',
              fontWeight: 600,
              textDecoration: 'none'
            }}
          >
            {lang === 'ja' ? '商品一覧へ' : (lang === 'en' ? 'Shop Beans' : 'Beli Biji Kopi')}
          </Link>
        </div>
      </div>
    </div>
  );
}
