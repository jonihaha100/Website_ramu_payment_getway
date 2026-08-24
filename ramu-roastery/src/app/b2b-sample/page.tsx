"use client";

import { useState } from "react";
import { useLang } from "../../context/LanguageContext";
import { t } from "../../data/translations";
import styles from "./B2B.module.css";

export default function B2BSample() {
  const { lang } = useLang();
  const tr = t[lang];

  const [formData, setFormData] = useState({
    shopName: "",
    ownerName: "",
    instagram: "",
    address: "",
    preferences: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const waNumber = "6280000000000"; // Placeholder
    const greeting = lang === "id"
      ? "Halo RRC, saya tertarik mencoba Sample Box B2B."
      : "Hello RRC, I'm interested in trying the B2B Sample Box.";
    const waMessage = `${greeting}%0A%0A*${lang === "id" ? "Nama Kedai" : "Cafe Name"}*: ${formData.shopName}%0A*${lang === "id" ? "Nama Pemilik" : "Owner Name"}*: ${formData.ownerName}%0A*Instagram*: ${formData.instagram}%0A*${lang === "id" ? "Alamat" : "Address"}*: ${formData.address}%0A*${lang === "id" ? "Preferensi" : "Preferences"}*: ${formData.preferences}%0A%0A${lang === "id" ? "Mohon info langkah selanjutnya. Terima kasih!" : "Please advise on next steps. Thank you!"}`;
    window.open(`https://wa.me/${waNumber}?text=${waMessage}`, "_blank");
  };

  return (
    <main className={styles.b2bPage}>
      <div className="container">
        <header className={styles.header}>
          <h1>{tr.b2b_title}</h1>
          <p>{tr.b2b_sub}</p>
        </header>

        <div className={styles.formContainer}>
          <form onSubmit={handleSubmit} className={`${styles.form} glass`}>
            <div className={styles.inputGroup}>
              <label htmlFor="shopName">{tr.b2b_shop_name}</label>
              <input type="text" id="shopName" name="shopName" required value={formData.shopName} onChange={handleChange} placeholder={lang === "id" ? "Misal: Senja Kopi" : "e.g. Senja Coffee"} />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="ownerName">{tr.b2b_owner}</label>
              <input type="text" id="ownerName" name="ownerName" required value={formData.ownerName} onChange={handleChange} />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="instagram">{tr.b2b_instagram}</label>
              <input type="text" id="instagram" name="instagram" value={formData.instagram} onChange={handleChange} placeholder="@senjakopi" />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="address">{tr.b2b_address}</label>
              <textarea id="address" name="address" required rows={3} value={formData.address} onChange={handleChange} />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="preferences">{tr.b2b_pref}</label>
              <textarea id="preferences" name="preferences" rows={2} value={formData.preferences} onChange={handleChange} placeholder={tr.b2b_pref_placeholder} />
            </div>
            <button type="submit" className={`btn-primary ${styles.submitBtn}`}>
              {tr.b2b_submit}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
