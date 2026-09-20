"use client";

import { useLang } from "../../context/LanguageContext";
import { t } from "../../data/translations";
import styles from "./About.module.css";

export default function AboutPage() {
  const { lang } = useLang();
  const tr = t[lang];

  return (
    <main className={styles.aboutPage}>
      <div className="container">
        
        {/* Hero Section */}
        <section className={styles.hero}>
          <h1 className={styles.heroTitle}>{tr.about_hero_title}</h1>
        </section>

        {/* Our Story */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{tr.about_story_title}</h2>
          <div className={styles.textContent}>
            <p>{tr.about_story_p1}</p>
            <p>{tr.about_story_p2}</p>
          </div>
        </section>

        {/* Vision & Terroir */}
        <section className={styles.section}>
          <div className={styles.grid2}>
            <div className={styles.card}>
              <h3>{tr.about_vision_title}</h3>
              <p>{tr.about_vision_text}</p>
            </div>
            <div className={styles.card}>
              <h3>{tr.about_terroir_title}</h3>
              <p>{tr.about_terroir_text}</p>
            </div>
          </div>
        </section>

        {/* Guarantee */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{tr.about_guarantee_title}</h2>
          <ul className={styles.guaranteeList}>
            <li>{tr.about_guarantee_farm}</li>
            <li>{tr.about_guarantee_process}</li>
            <li>{tr.about_guarantee_qc}</li>
            <li>{tr.about_guarantee_export}</li>
          </ul>
        </section>

        {/* Location */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            {lang === 'ja' ? 'ロースタリー所在地' : (lang === 'en' ? 'Our Location' : 'Lokasi Kami')}
          </h2>
          <div className={styles.mapContainer}>
            <iframe 
              src="https://maps.google.com/maps?q=Ramu%20Roastery%20Company&t=&z=14&ie=UTF8&iwloc=&output=embed" 
              width="100%" 
              height="400" 
              style={{ border: 0, borderRadius: '8px' }} 
              allowFullScreen 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
          <p style={{ textAlign: 'center', marginTop: '1.5rem', lineHeight: '1.6', color: 'var(--foreground)', opacity: 0.8 }}>
            <strong>Ramu Roastery Company</strong><br/>
            <a href="https://share.google/BKvPny7x9Gi31hWBm" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>
              {lang === 'ja' ? 'Google マップで見る' : (lang === 'en' ? 'View on Google Maps' : 'Lihat di Google Maps')}
            </a>
          </p>
        </section>
        
      </div>
    </main>
  );
}
