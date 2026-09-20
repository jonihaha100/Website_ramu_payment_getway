"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import { useLang } from "../../../context/LanguageContext";
import { provinces, indonesiaLocations } from "../../../data/indonesiaLocations";
import styles from "./addresses.module.css";

interface Address {
  id?: string;
  userEmail: string;
  label: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  province: string;
  city: string;
  subdistrict: string;
  village: string;
  postalCode: string;
  isDefault: boolean;
}

const emptyAddress: Address = {
  userEmail: "",
  label: "Rumah",
  firstName: "",
  lastName: "",
  phone: "",
  address: "",
  province: "",
  city: "",
  subdistrict: "",
  village: "",
  postalCode: "",
  isDefault: false,
};

export default function AddressesPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const { lang } = useLang();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Address>(emptyAddress);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user?.email) {
      fetch(`/api/addresses?email=${encodeURIComponent(user.email)}`)
        .then(res => res.json())
        .then(data => { if (Array.isArray(data)) setAddresses(data); })
        .catch(() => {});
    }
  }, [user?.email]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleEdit = (addr: Address) => {
    setFormData(addr);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const confirmMsg = lang === 'ja'
      ? 'この住所を削除してもよろしいですか？'
      : lang === 'en'
      ? 'Are you sure you want to delete this address?'
      : 'Hapus alamat ini?';
    if (!confirm(confirmMsg)) return;
    try {
      const res = await fetch(`/api/addresses?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setAddresses(prev => prev.filter(a => a.id !== id));
        addToast(
          lang === 'ja' ? '住所を削除しました' : lang === 'en' ? 'Address deleted successfully' : 'Alamat berhasil dihapus',
          'success'
        );
      }
    } catch { 
      addToast(
        lang === 'ja' ? '住所の削除に失敗しました' : lang === 'en' ? 'Failed to delete address' : 'Gagal menghapus alamat',
        'error'
      ); 
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, userEmail: user.email })
      });
      const result = await res.json();
      if (res.ok) {
        // Refresh list
        const listRes = await fetch(`/api/addresses?email=${encodeURIComponent(user.email)}`);
        const listData = await listRes.json();
        if (Array.isArray(listData)) setAddresses(listData);
        setShowForm(false);
        setFormData({ ...emptyAddress });
        addToast(
          formData.id
            ? (lang === 'ja' ? 'お届け先住所を更新しました！' : lang === 'en' ? 'Address updated successfully!' : 'Alamat berhasil diperbarui!')
            : (lang === 'ja' ? '新しいお届け先住所を追加しました！' : lang === 'en' ? 'New address added successfully!' : 'Alamat berhasil ditambahkan!'),
          'success'
        );
      } else {
        addToast(result.error || (lang === 'ja' ? '住所の保存に失敗しました' : lang === 'en' ? 'Failed to save address' : 'Gagal menyimpan alamat'), 'error');
      }
    } catch {
      addToast(lang === 'ja' ? '住所の保存に失敗しました' : lang === 'en' ? 'Failed to save address' : 'Gagal menyimpan alamat', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const labelIcons: Record<string, string> = {
    "Rumah": "🏠",
    "Kantor": "🏢",
    "Kedai": "☕",
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>📍 {lang === 'ja' ? 'お届け先住所録' : (lang === 'en' ? 'Address Book' : 'Daftar Alamat')}</h1>
          <p className={styles.subtitle}>
            {lang === 'ja'
              ? '配送先住所を管理します。チェックアウト時に再入力不要で簡単に選択できます。'
              : (lang === 'en'
                ? 'Manage your shipping addresses. Select your address during checkout without retyping.'
                : 'Kelola alamat pengiriman Anda. Pilih alamat saat checkout tanpa ketik ulang.')}
          </p>
        </div>
        <button className={styles.addBtn} onClick={() => { setFormData({ ...emptyAddress }); setShowForm(true); }}>
          {lang === 'ja' ? '+ 新しい住所を追加' : (lang === 'en' ? '+ Add Address' : '+ Tambah Alamat')}
        </button>
      </div>

      {/* Address Cards */}
      {addresses.length === 0 && !showForm && (
        <div className={styles.emptyState}>
          <span style={{ fontSize: "3rem" }}>📭</span>
          <h3>{lang === 'ja' ? '登録された住所がありません' : (lang === 'en' ? 'No saved addresses yet' : 'Belum ada alamat tersimpan')}</h3>
          <p>{lang === 'ja' ? 'お届け先を登録してスムーズにお買い物をお楽しみください！' : (lang === 'en' ? 'Add an address to make checkout faster!' : 'Tambahkan alamat agar checkout lebih cepat!')}</p>
        </div>
      )}

      <div className={styles.grid}>
        {addresses.map(addr => (
          <div key={addr.id} className={`${styles.card} ${addr.isDefault ? styles.cardDefault : ""}`}>
            {addr.isDefault && <span className={styles.defaultBadge}>★ {lang === 'ja' ? '既定の住所' : (lang === 'en' ? 'Default' : 'Utama')}</span>}
            <div className={styles.cardLabel}>{addr.label}</div>
            <h3 className={styles.cardName}>{addr.firstName} {addr.lastName}</h3>
            <p className={styles.cardPhone}>{addr.phone}</p>
            <p className={styles.cardAddress}>{addr.address}, Kel. {addr.village || "-"}, Kec. {addr.subdistrict || "-"}, {addr.city}, {addr.province}, {addr.postalCode}</p>
            <div className={styles.cardActions}>
              <button onClick={() => handleEdit(addr)}>✏️ {lang === 'ja' ? '編集' : (lang === 'en' ? 'Edit' : 'Edit')}</button>
              <button onClick={() => handleDelete(addr.id!)} className={styles.deleteBtn}>🗑️ {lang === 'ja' ? '削除' : (lang === 'en' ? 'Delete' : 'Hapus')}</button>
            </div>
          </div>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <div className={styles.formOverlay}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <h2>{formData.id ? (lang === 'ja' ? "お届け先の編集" : (lang === 'en' ? "Edit Address" : "Edit Alamat")) : (lang === 'ja' ? "新しいお届け先を追加" : (lang === 'en' ? "Add New Address" : "Tambah Alamat Baru"))}</h2>
            <div className={styles.field}>
              <label>{lang === 'ja' ? '住所ラベル' : (lang === 'en' ? 'Address Label' : 'Label Alamat')}</label>
              <select name="label" value={formData.label} onChange={handleChange}>
                <option value="Rumah">🏠 {lang === 'ja' ? '自宅' : (lang === 'en' ? 'Home' : 'Rumah')}</option>
                <option value="Kantor">🏢 {lang === 'ja' ? 'オフィス' : (lang === 'en' ? 'Office' : 'Kantor')}</option>
                <option value="Kedai">☕ {lang === 'ja' ? '店舗・カフェ' : (lang === 'en' ? 'Cafe/Store' : 'Kedai')}</option>
              </select>
            </div>
            
            <div className={styles.formRow}>
              <div className={styles.field}>
                <label>{lang === 'ja' ? '名（First Name）' : (lang === 'en' ? 'First Name' : 'Nama Depan')}</label>
                <input name="firstName" value={formData.firstName} onChange={handleChange} required placeholder={lang === 'ja' ? '例: 太郎' : 'Nama depan'} />
              </div>
              <div className={styles.field}>
                <label>{lang === 'ja' ? '姓（Last Name）' : (lang === 'en' ? 'Last Name' : 'Nama Belakang')}</label>
                <input name="lastName" value={formData.lastName} onChange={handleChange} required placeholder={lang === 'ja' ? '例: 山田' : 'Nama belakang'} />
              </div>
            </div>
            <div className={styles.field}>
              <label>{lang === 'ja' ? '電話番号' : (lang === 'en' ? 'Phone Number' : 'No. Telepon')}</label>
              <input name="phone" value={formData.phone} onChange={handleChange} required placeholder="0812xxxx" />
            </div>
            <div className={styles.field}>
              <label>{lang === 'ja' ? '詳細住所' : (lang === 'en' ? 'Full Address' : 'Alamat Lengkap')}</label>
              <textarea name="address" value={formData.address} onChange={handleChange} required rows={2} placeholder="Jl. Contoh No. 123, RT/RW" />
            </div>
            <div className={styles.formRow}>
              <div className={styles.field}>
                <label>{lang === 'ja' ? '州・県' : (lang === 'en' ? 'Province' : 'Provinsi')}</label>
                <select name="province" value={formData.province} onChange={(e) => { setFormData(prev => ({ ...prev, province: e.target.value, city: "" })); }} required>
                  <option value="" disabled>{lang === 'ja' ? '州・県を選択...' : (lang === 'en' ? 'Select Province...' : 'Pilih Provinsi...')}</option>
                  {provinces.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className={styles.field}>
                <label>{lang === 'ja' ? '市・県' : (lang === 'en' ? 'City' : 'Kota / Kabupaten')}</label>
                <select name="city" value={formData.city} onChange={handleChange} required disabled={!formData.province}>
                  <option value="" disabled>{lang === 'ja' ? '市・県を選択...' : (lang === 'en' ? 'Select City...' : 'Pilih Kota...')}</option>
                  {formData.province && indonesiaLocations[formData.province as keyof typeof indonesiaLocations]?.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className={styles.formRow}>
              <div className={styles.field}>
                <label>{lang === 'ja' ? '郡 / ディストリクト' : (lang === 'en' ? 'District' : 'Kecamatan')}</label>
                <input name="subdistrict" value={formData.subdistrict} onChange={handleChange} placeholder="Contoh: Mampang" />
              </div>
              <div className={styles.field}>
                <label>{lang === 'ja' ? '町名 / 村' : (lang === 'en' ? 'Village / Ward' : 'Kelurahan / Desa')}</label>
                <input name="village" value={formData.village} onChange={handleChange} placeholder="Contoh: Bangka" />
              </div>
            </div>
            <div className={styles.formRow}>
              <div className={styles.field}>
                <label>{lang === 'ja' ? '郵便番号' : (lang === 'en' ? 'Postal Code' : 'Kode Pos')}</label>
                <input name="postalCode" value={formData.postalCode} onChange={handleChange} required placeholder="12345" />
              </div>
              <div className={styles.field} style={{ display: "flex", alignItems: "center", gap: "0.5rem", paddingTop: "1.5rem" }}>
                <input type="checkbox" name="isDefault" checked={formData.isDefault} onChange={handleChange} id="isDefault" />
                <label htmlFor="isDefault" style={{ margin: 0, fontWeight: 600 }}>{lang === 'ja' ? '既定のお届け先に設定する' : (lang === 'en' ? 'Set as Default Address' : 'Jadikan Alamat Utama')}</label>
              </div>
            </div>
            <div className={styles.formActions}>
              <button type="button" onClick={() => setShowForm(false)} className={styles.cancelBtn}>{lang === 'ja' ? 'キャンセル' : (lang === 'en' ? 'Cancel' : 'Batal')}</button>
              <button type="submit" disabled={isSaving} className={styles.submitBtn}>
                {isSaving ? (lang === 'ja' ? "保存中..." : (lang === 'en' ? "Saving..." : "Menyimpan...")) : (lang === 'ja' ? "💾 住所を保存" : (lang === 'en' ? "💾 Save Address" : "💾 Simpan Alamat"))}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
