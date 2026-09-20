"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { useLang } from "../../context/LanguageContext";
import { useToast } from "../../context/ToastContext";
import { t } from "../../data/translations";
import styles from "./dashboard.module.css";

export default function DashboardPage() {
  const { user, isLoading, logout, updateProfile } = useAuth();
  const { lang } = useLang();
  const { addToast } = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local state for form
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "",
    dob: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Ramu Points
  const [totalPoints, setTotalPoints] = useState(0);

  // Authentication Guard and form init
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login?callbackUrl=/dashboard");
      } else {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFormData({
          name: user.name || "",
          email: user.email || "",
          phone: user.phone || "",
          gender: user.gender || "",
          dob: user.dob || "",
        });
        // Load avatar from localStorage specific to user email
        const savedAvatar = localStorage.getItem(`ramu_user_avatar_${user.email}`);
        if (savedAvatar) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setAvatarPreview(savedAvatar);
        }
      }
    }
  }, [user, isLoading, router]);

  // Fetch points
  useEffect(() => {
    if (user?.email) {
      fetch(`/api/points?email=${encodeURIComponent(user.email)}`)
        .then(res => res.json())
        .then(data => {
          if (data.balance !== undefined) setTotalPoints(data.balance);
        })
        .catch(() => {});
    }
  }, [user?.email]);

  if (isLoading || !user) {
    return <div style={{ padding: "4rem", textAlign: "center" }}>{t[lang].dash_loading}</div>;
  }

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile(formData);
      addToast(t[lang].dash_success, "success");
    } catch (_error) {
      addToast(t[lang].dash_fail, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 1MB)
    if (file.size > 1024 * 1024) {
      addToast(
        lang === 'ja' ? "画像サイズは最大1MBまでです" : (lang === 'en' ? "Max photo size is 1MB" : "Ukuran foto maksimal 1MB"),
        "error"
      );
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      addToast(
        lang === 'ja' ? "画像ファイルを選択してください" : (lang === 'en' ? "File must be an image" : "File harus berupa gambar"),
        "error"
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      setAvatarPreview(dataUrl);
      if (user?.email) {
        localStorage.setItem(`ramu_user_avatar_${user.email}`, dataUrl);
      }
      
      try {
        await updateProfile({ avatarUrl: dataUrl });
        addToast(
          lang === 'ja' ? "プロフィール画像が更新されました！" : (lang === 'en' ? "Profile picture updated successfully!" : "Foto profil berhasil diperbarui!"),
          "success"
        );
      } catch (err) {
        addToast(
          lang === 'ja' ? "サーバーへの画像保存に失敗しました" : (lang === 'en' ? "Failed to save photo to server" : "Gagal menyimpan foto ke server"),
          "error"
        );
      }
    };
    reader.readAsDataURL(file);
  };

  // Referral code logic
  const referralCode = `RAMU-${(user.name.split(' ')[0] || 'KOPI').toUpperCase()}-${(user.email.slice(0, 3) || '888').toUpperCase()}`;
  const referralShareText = lang === 'ja'
    ? `こんにちは！ラム・ロースタリーの新鮮な焙煎豆の割引コードです: *${referralCode}*。焼きたての本格スペシャルティコーヒーをお楽しみください: https://ramuroastery.com`
    : (lang === 'en'
      ? `Hello! Get a special discount on fresh roasted beans at Ramu Roastery with my referral code: *${referralCode}*. Enjoy freshly roasted coffee at https://ramuroastery.com`
      : `Halo! Dapatkan potongan belanja kopi segar di Ramu Roastery dengan kode referralku: *${referralCode}*. Nikmati biji kopi fresh roast sangrai Bandung di https://ramuroastery.com`);
  const referralWaLink = `https://wa.me/?text=${encodeURIComponent(referralShareText)}`;

  // Brewing Log State
  const [brewingLogs, setBrewingLogs] = useState<any[]>([]);
  const [newLog, setNewLog] = useState({
    coffee: "Fullwash Gn. Halu",
    method: "V60 Dripper",
    dose: "15g : 225ml (1:15)",
    grind: "Medium-Fine",
    tempTime: "92°C • 2m 30s",
    notes: "Sweet cane, clean green apple, floral aftertaste",
    date: new Date().toLocaleDateString(lang === 'ja' ? 'ja-JP' : (lang === 'en' ? 'en-US' : 'id-ID'), { day: 'numeric', month: 'short', year: 'numeric' })
  });

  useEffect(() => {
    if (user?.email) {
      try {
        const savedLogs = localStorage.getItem(`ramu_brewing_logs_${user.email}`);
        if (savedLogs) setBrewingLogs(JSON.parse(savedLogs));
      } catch (e) {}
    }
  }, [user?.email]);

  const handleSaveBrewingLog = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = [
      { id: Date.now().toString(), ...newLog, date: new Date().toLocaleDateString(lang === 'ja' ? 'ja-JP' : (lang === 'en' ? 'en-US' : 'id-ID'), { day: 'numeric', month: 'short', year: 'numeric' }) },
      ...brewingLogs
    ];
    setBrewingLogs(updated);
    if (user?.email) {
      localStorage.setItem(`ramu_brewing_logs_${user.email}`, JSON.stringify(updated));
    }
    addToast(
      lang === 'ja' ? "ドリップログを保存しました！" : (lang === 'en' ? "Brewing log saved!" : "Catatan seduh berhasil disimpan!"),
      "success"
    );
    setNewLog(prev => ({ ...prev, notes: "" }));
  };

  const handleDeleteLog = (id: string) => {
    const updated = brewingLogs.filter(l => l.id !== id);
    setBrewingLogs(updated);
    if (user?.email) {
      localStorage.setItem(`ramu_brewing_logs_${user.email}`, JSON.stringify(updated));
    }
    addToast(
      lang === 'ja' ? "ドリップログを削除しました" : (lang === 'en' ? "Brewing log deleted" : "Catatan seduh dihapus"),
      "info"
    );
  };

  const isVip = Boolean(user.isVip || (user.role as string)?.toUpperCase() === 'VIP');

  return (
    <div className={styles.mainContent}>
      {/* Ramu Points Panel */}
      <div className={styles.pointsPanel}>
        <div className={styles.pointsIcon}>🏆</div>
        <div className={styles.pointsInfo}>
          <span className={styles.pointsLabel}>
            {lang === 'ja' ? '保有ラムポイント' : (lang === 'en' ? 'Your Ramu Points' : 'Ramu Points Anda')}
          </span>
          <span className={styles.pointsValue}>
            {totalPoints.toLocaleString(lang === 'ja' ? 'ja-JP' : (lang === 'en' ? 'en-US' : 'id-ID'))} {lang === 'ja' ? 'ポイント' : (lang === 'en' ? 'Points' : 'Poin')}
          </span>
        </div>
        <div className={styles.pointsHint}>
          {lang === 'ja'
            ? 'Rp 10.000 のお買い物ごとに 1 ポイント獲得。チェックアウト時に割引として使えます！'
            : (lang === 'en'
              ? 'Earn 1 Point for every Rp 10,000 spent. Redeem points at checkout!'
              : 'Setiap belanja Rp 10.000 = 1 Poin. Tukarkan poin saat checkout!')}
        </div>
      </div>

      {/* VIP Subscriber Card if applicable */}
      {isVip && (
        <div style={{
          marginBottom: '2rem',
          padding: '1.25rem 1.5rem',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
          border: '1px solid #6366f1',
          color: '#ffffff',
          boxShadow: '0 8px 20px rgba(99, 102, 241, 0.25)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>👑</span>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#fde047' }}>
                  RAMU CLUB • SUBSCRIBER PRIVILEGE
                </h3>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#c7d2fe' }}>
                  {lang === 'ja'
                    ? 'VIP会員アクティブ：ラム・ロースタリーの全プレミアム特典をご利用いただけます。'
                    : (lang === 'en'
                      ? 'VIP Account Active: You enjoy all Ramu Roastery premium customer privileges.'
                      : 'Akun VIP Aktif: Anda menikmati seluruh fasilitas pelanggan premium Ramu Roastery.')}
                </p>
              </div>
            </div>
            <span style={{ padding: '4px 12px', borderRadius: '9999px', background: 'rgba(253, 224, 71, 0.2)', border: '1px solid #fde047', color: '#fde047', fontSize: '0.75rem', fontWeight: 700 }}>
              ✨ VIP ACTIVE
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', fontSize: '0.8rem', color: '#e0e7ff', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <div>
              {lang === 'ja' ? (
                <>✅ <strong>手数料無料:</strong> 全注文のサービス料 Rp 0</>
              ) : lang === 'en' ? (
                <>✅ <strong>Free Admin Fee:</strong> Rp 0 service fee on every order</>
              ) : (
                <>✅ <strong>Free Admin Fee:</strong> Biaya layanan Rp 0 di setiap pesanan</>
              )}
            </div>
            <div>
              {lang === 'ja' ? (
                <>📦 <strong>共同配送:</strong> バンドン市内同一焙煎バッチ送料無料</>
              ) : lang === 'en' ? (
                <>📦 <strong>Shared Delivery:</strong> Free shipping within Bandung roast batch</>
              ) : (
                <>📦 <strong>Tebeng Kirim:</strong> Free ongkir sesama Bandung batch sangrai</>
              )}
            </div>
            <div>
              {lang === 'ja' ? (
                <>🔥 <strong>優先焙煎:</strong> 最新ロースト豆への先行アクセス</>
              ) : lang === 'en' ? (
                <>🔥 <strong>Priority Roast:</strong> Early access to latest roasted beans</>
              ) : (
                <>🔥 <strong>Priority Roast:</strong> Akses biji kopi roasting teranyar</>
              )}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 className={styles.title} style={{ margin: 0 }}>{t[lang].dash_title}</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>{t[lang].dash_sub}</p>
        </div>
        {isVip && (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: '9999px',
            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
            border: '1px solid #f59e0b',
            color: '#92400e',
            fontWeight: 800,
            fontSize: '0.8rem'
          }}>
            <span>👑</span> RAMU CLUB MEMBER
          </span>
        )}
      </div>
      
      <div className={styles.profileSection}>
        <div className={styles.profileDetails}>
          <div className={styles.formGroup}>
            <label>{t[lang].dash_name}</label>
            <input 
              type="text" 
              name="name"
              value={formData.name} 
              onChange={handleInputChange}
              className={styles.inputField} 
            />
          </div>
          <div className={styles.formGroup}>
            <label>{t[lang].dash_email}</label>
            <input 
              type="email" 
              name="email"
              value={formData.email} 
              onChange={handleInputChange}
              className={styles.inputField} 
              disabled
              style={{ opacity: 0.6, cursor: 'not-allowed' }}
            />
          </div>
          <div className={styles.formGroup}>
            <label>{t[lang].dash_phone}</label>
            <input 
              type="text" 
              name="phone"
              value={formData.phone} 
              onChange={handleInputChange}
              className={styles.inputField} 
            />
          </div>
          <div className={styles.formGroup}>
            <label>{t[lang].dash_gender}</label>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel} style={{ whiteSpace: 'nowrap' }}>
                <input 
                  type="radio" 
                  name="gender" 
                  value="Laki-laki" 
                  checked={formData.gender === "Laki-laki" || formData.gender === "male"}
                  onChange={handleInputChange}
                />
                <span>{t[lang].dash_male}</span>
              </label>
              <label className={styles.radioLabel} style={{ whiteSpace: 'nowrap' }}>
                <input 
                  type="radio" 
                  name="gender" 
                  value="Perempuan" 
                  checked={formData.gender === "Perempuan" || formData.gender === "female"}
                  onChange={handleInputChange}
                />
                <span>{t[lang].dash_female}</span>
              </label>
              <label className={styles.radioLabel} style={{ whiteSpace: 'nowrap' }}>
                <input 
                  type="radio" 
                  name="gender" 
                  value="Lainnya" 
                  checked={formData.gender === "Lainnya"}
                  onChange={handleInputChange}
                />
                <span>{t[lang].dash_other}</span>
              </label>
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>{t[lang].dash_dob}</label>
            <input 
              type="date" 
              name="dob"
              value={formData.dob} 
              onChange={handleInputChange}
              className={styles.inputField} 
            />
          </div>
          
          <div className={styles.actionButtons}>
            <button 
              className={styles.saveBtn} 
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? t[lang].dash_saving : t[lang].dash_save}
            </button>
            <button 
              onClick={handleLogout} 
              className={styles.logoutBtn}
            >
              {t[lang].dash_logout}
            </button>
          </div>
        </div>

        <div style={{ padding: '0 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', borderLeft: '1px solid rgba(0,0,0,0.1)' }}>
          {avatarPreview ? (
            <div 
              className={styles.avatarLarge} 
              style={{ 
                backgroundImage: `url(${avatarPreview})`, 
                backgroundSize: 'cover', 
                backgroundPosition: 'center',
                cursor: 'pointer',
                fontSize: 0,
                boxShadow: isVip ? '0 0 0 4px #f59e0b, 0 0 20px rgba(245, 158, 11, 0.6)' : '0 4px 10px rgba(0,0,0,0.1)'
              }}
              onClick={handleAvatarClick}
            >
              &nbsp;
            </div>
          ) : (
            <div 
              className={styles.avatarLarge} 
              onClick={handleAvatarClick} 
              style={{ 
                cursor: 'pointer',
                boxShadow: isVip ? '0 0 0 4px #f59e0b, 0 0 20px rgba(245, 158, 11, 0.6)' : '0 4px 10px rgba(0,0,0,0.1)'
              }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            style={{ display: 'none' }}
          />
          <button 
            onClick={handleAvatarClick}
            style={{ marginTop: '1rem', padding: '0.5rem 1rem', border: '1px solid #ccc', background: 'white', borderRadius: '4px', cursor: 'pointer' }}
          >
            {t[lang].dash_choose_img}
          </button>
          <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '0.5rem', textAlign: 'center', whiteSpace: 'pre-line' }}>
            {t[lang].dash_img_req}
          </p>
        </div>
      </div>

      {/* Community Referral Card */}
      <div style={{
        marginTop: '3rem',
        padding: '1.75rem',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, #fdfbf7 0%, #faecd8 100%)',
        border: '1px solid #fcd34d',
        boxShadow: '0 6px 16px rgba(217, 119, 6, 0.08)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '1.4rem' }}>👥</span>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#78350f' }}>
                {lang === 'ja' ? 'ラム・コミュニティ＆お友達紹介プログラム' : (lang === 'en' ? 'Ramu Community & Referral Program' : 'Program Komunitas & Referral Ramu')}
              </h3>
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#92400e', maxWidth: '560px', lineHeight: 1.4 }}>
              {lang === 'ja' ? (
                <>コーヒー好きのお友達にラム・ロースタリーの新鮮な焙煎豆を紹介しましょう！お友達の初回チェックアウト時に <strong>Rp 15.000 割引</strong>、あなたには成約ごとに <strong>50 ラムポイント</strong> が付与されます。</>
              ) : lang === 'en' ? (
                <>Invite fellow coffee lovers to enjoy Ramu Roastery fresh roasts. Your friend gets <strong>Rp 15,000 off</strong> on their first checkout, and you earn <strong>50 Ramu Points</strong> per successful purchase!</>
              ) : (
                <>Ajak teman sesama pecinta kopi untuk menikmati fresh roast Ramu Roastery. Teman Anda mendapat potongan <strong>Rp 15.000</strong> saat pertama kali checkout, dan Anda mendapatkan <strong>50 Ramu Points</strong> per transaksi sukses!</>
              )}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              padding: '0.5rem 1rem',
              background: '#ffffff',
              border: '2px dashed #d97706',
              borderRadius: '8px',
              fontWeight: 800,
              fontSize: '1.1rem',
              color: '#92400e',
              letterSpacing: '0.05em'
            }}>
              {referralCode}
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(referralCode);
                addToast(
                  lang === 'ja'
                    ? "紹介コードをクリップボードにコピーしました！"
                    : (lang === 'en'
                      ? "Referral code copied to clipboard!"
                      : "Kode referral disalin ke clipboard!"),
                  "success"
                );
              }}
              style={{
                padding: '0.55rem 1rem',
                backgroundColor: '#78350f',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              {lang === 'ja' ? '📋 コピー' : (lang === 'en' ? '📋 Copy' : '📋 Salin')}
            </button>
            <a
              href={referralWaLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '0.55rem 1rem',
                backgroundColor: '#25D366',
                color: '#ffffff',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.85rem',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              💬 WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* Daily Brewing Log Section */}
      <div style={{
        marginTop: '3rem',
        padding: '1.75rem',
        borderRadius: '16px',
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        boxShadow: '0 4px 12px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #f3f4f6', paddingBottom: '1rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#111827', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>☕</span> {lang === 'ja' ? 'デイリー抽出ログ（Brewing Log）' : (lang === 'en' ? 'Daily Brewing Log' : 'Catatan Seduh Harian (Brewing Log)')}
            </h3>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#6b7280' }}>
              {lang === 'ja'
                ? 'お気に入りのラムコーヒー豆の抽出比率、器具、フレーバープロファイルを記録できます。'
                : (lang === 'en'
                  ? 'Record brewing ratio, gear calibration, and tasting notes from your favorite Ramu beans.'
                  : 'Catat kalibrasi rasio seduh, alat, dan profil rasa dari biji kopi Ramu favorit Anda.')}
            </p>
          </div>
        </div>

        {/* Log Input Form */}
        <form onSubmit={handleSaveBrewingLog} style={{ background: '#f9fafb', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e5e7eb', marginBottom: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>{lang === 'ja' ? 'コーヒー豆' : (lang === 'en' ? 'Coffee Beans' : 'Biji Kopi')}</label>
              <input 
                type="text" 
                value={newLog.coffee} 
                onChange={(e) => setNewLog({ ...newLog, coffee: e.target.value })} 
                required 
                placeholder={lang === 'ja' ? '例: フルウォッシュ グヌン・ハル' : (lang === 'en' ? 'e.g. Fullwash Mt. Halu' : 'Contoh: Fullwash Gn. Halu')}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.85rem' }} 
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>{lang === 'ja' ? '抽出器具' : (lang === 'en' ? 'Brew Method' : 'Metode Seduh')}</label>
              <select 
                value={newLog.method} 
                onChange={(e) => setNewLog({ ...newLog, method: e.target.value })}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
              >
                <option value="V60 Dripper">V60 Dripper</option>
                <option value="Aeropress">Aeropress</option>
                <option value="Espresso Machine">Espresso Machine</option>
                <option value="French Press">French Press</option>
                <option value="Tubruk">Tubruk Tradisional</option>
                <option value="Cold Brew">Cold Brew</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>{lang === 'ja' ? '比率・粉量' : (lang === 'en' ? 'Ratio & Dose' : 'Rasio & Dosis')}</label>
              <input 
                type="text" 
                value={newLog.dose} 
                onChange={(e) => setNewLog({ ...newLog, dose: e.target.value })} 
                placeholder="15g : 225ml"
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.85rem' }} 
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>{lang === 'ja' ? '挽き目' : (lang === 'en' ? 'Grind Size' : 'Gilingan')}</label>
              <input 
                type="text" 
                value={newLog.grind} 
                onChange={(e) => setNewLog({ ...newLog, grind: e.target.value })} 
                placeholder="Medium-Fine"
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.85rem' }} 
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>{lang === 'ja' ? '湯温・時間' : (lang === 'en' ? 'Temp & Time' : 'Suhu & Waktu')}</label>
              <input 
                type="text" 
                value={newLog.tempTime} 
                onChange={(e) => setNewLog({ ...newLog, tempTime: e.target.value })} 
                placeholder="92°C • 2m 30s"
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.85rem' }} 
              />
            </div>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>{lang === 'ja' ? 'フレーバーノート・余韻' : (lang === 'en' ? 'Tasting Notes & Aftertaste' : 'Catatan Rasa & Aftertaste')}</label>
            <input 
              type="text" 
              value={newLog.notes} 
              onChange={(e) => setNewLog({ ...newLog, notes: e.target.value })} 
              placeholder={lang === 'ja' ? '例: 甘いサトウキビ感、華やかなジャスミンのアロマ、すっきりとした酸味...' : 'Contoh: Sweet cane, aroma floral melati kuat, acidity menyegarkan...'}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.85rem' }} 
            />
          </div>
          <button 
            type="submit" 
            style={{
              padding: '0.55rem 1.25rem',
              backgroundColor: '#111827',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            {lang === 'ja' ? '💾 抽出ログを保存' : (lang === 'en' ? '💾 Save Brew Log' : '💾 Simpan Catatan Seduh')}
          </button>
        </form>

        {/* History list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {brewingLogs.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '0.85rem', margin: '1rem 0' }}>
              {lang === 'ja'
                ? '抽出ログがまだありません。お気に入りのレシピを記録してみましょう！'
                : (lang === 'en'
                  ? 'No brew logs yet. Record your favorite recipes above!'
                  : 'Belum ada catatan seduh. Masukkan resep seduh favorit Anda di atas!')}
            </p>
          ) : (
            brewingLogs.map(log => (
              <div key={log.id} style={{ padding: '1rem', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <strong style={{ fontSize: '0.95rem', color: '#111827' }}>{log.coffee}</strong>
                    <span style={{ padding: '2px 8px', borderRadius: '4px', background: '#f3f4f6', fontSize: '0.72rem', color: '#4b5563', fontWeight: 600 }}>{log.method}</span>
                    <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{log.date}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#4b5563', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.25rem' }}>
                    <span>⚖️ {log.dose}</span>
                    <span>⚙️ {log.grind}</span>
                    <span>⏱️ {log.tempTime}</span>
                  </div>
                  {log.notes && (
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: '#059669', fontStyle: 'italic' }}>
                      "{log.notes}"
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteLog(log.id)}
                  style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.8rem', cursor: 'pointer', padding: '0.25rem' }}
                >
                  {lang === 'ja' ? '削除' : (lang === 'en' ? 'Delete' : 'Hapus')}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
