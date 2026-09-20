"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLang } from "../context/LanguageContext";
import { useCart } from "../context/CartContext";
import { t } from "../data/translations";
import { coffees as defaultCoffees, Coffee, getLocalizedCoffee } from "../data/coffees";
import { mockReviews, Review } from "../data/mockReviews";
import { useToast } from "../context/ToastContext";
import { useEffect, useState } from "react";
import styles from "./page.module.css";

function AddToCartButton({ coffee }: { coffee: Coffee }) {
  const { addToCart } = useCart();
  const { addToast } = useToast();
  const { lang } = useLang();
  const router = useRouter();

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart({
      id: `${coffee.id}-Whole Beans-200`,
      productId: coffee.id,
      name: coffee.name,
      price: (coffee.pricePerKg / 1000) * 200,
      quantity: 1,
      weight: 200,
      grind: "Whole Beans",
      image: coffee.imageUrl,
    });
    
    addToast(
      lang === 'ja'
        ? `${coffee.name} をカートに追加しました！`
        : lang === 'en'
        ? `${coffee.name} added to cart!`
        : `${coffee.name} ditambahkan ke keranjang!`,
      'success'
    );
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    handleAdd(e);
    router.push("/checkout");
  };

  return (
    <>
      <button className="btn-outline" style={{ flex: 1, padding: '0.5rem', fontSize: '0.9rem' }} onClick={handleAdd}>
        {lang === 'ja' ? '+ カート' : lang === 'en' ? '+ Cart' : '+ Keranjang'}
      </button>
      <button className="btn-primary" style={{ flex: 1, padding: '0.5rem', fontSize: '0.9rem' }} onClick={handleBuyNow}>
        {lang === 'ja' ? '今すぐ購入' : lang === 'en' ? 'Buy Now' : 'Beli Sekarang'}
      </button>
    </>
  );
}

export default function Home() {
  const { lang } = useLang();
  const tr = t[lang];
  // Instant 0ms Load: Initialize with defaultCoffees & mockReviews
  const [coffees, setCoffees] = useState<Coffee[]>(defaultCoffees.slice(0, 4));
  const [reviews, setReviews] = useState<Review[]>(mockReviews);

  useEffect(() => {
    // Non-blocking background sync for fresh products
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setCoffees(data.slice(0, 4));
        }
      })
      .catch(() => {});
      
    // Non-blocking background sync for fresh reviews
    fetch('/api/reviews')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setReviews(data);
        }
      })
      .catch(() => {});
  }, []);

  const highlightedProducts = coffees.slice(0, 6).map(c => getLocalizedCoffee(c, lang));

  return (
    <main className={styles.main}>
      {/* Hero Section */}
      <section className={`${styles.hero} section`}>
        <div className="container">
          <div className={styles.heroContent}>
            <div className={styles.logoBadge}>
              <span className={styles.est}>EST 2026</span>
              <h1 className={styles.brandName}>Ramu</h1>
              <p className={styles.brandSub}>— ROASTERY COMPANY —</p>
            </div>
            <h2 className={styles.heroHeadline}>{tr.hero_tagline}</h2>
            <p className={styles.heroSubheadline}>{tr.hero_sub}</p>
            <div className={styles.heroActions}>
              <Link href="/catalog" className={styles.heroCtaBtn}>{tr.hero_cta_catalog}</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Highlights */}
      <section className={`section ${styles.highlightsSection}`}>
        <div className="container">
          <h2 className={styles.sectionTitleCenter}>{tr.highlights_title}</h2>
          <p className={styles.sectionSubtitleCenter}>{tr.highlights_direct_buy}</p>
          <div className={styles.sliderContainer}>
            <div className={styles.sliderWrapper}>
              {highlightedProducts.map(coffee => (
                <div key={coffee.id} className={`${styles.sliderItem} glass`}>
                <Link href={`/product/${coffee.id}`} style={{ textDecoration: 'none', color: 'inherit', flex: 1 }}>
                  <div className={styles.highlightImage}>
                    {coffee.imageUrl && <img src={coffee.imageUrl} alt={coffee.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    <span className={styles.highlightCategory}>{coffee.category}</span>
                  </div>
                  <div className={styles.highlightContent}>
                    <h3>{coffee.name}</h3>
                    <div className={styles.tastingNotesSmall}>
                      {coffee.tastingNotes.slice(0, 2).map(note => (
                        <span key={note}>{note}</span>
                      ))}
                    </div>
                  </div>
                </Link>
                <div style={{ padding: '0 1.5rem 1.5rem', display: 'flex', gap: '0.5rem' }}>
                   <AddToCartButton coffee={coffee} />
                </div>
              </div>
            ))}
            </div>
          </div>
          <div style={{ textAlign: "center", marginTop: "2rem" }}>
            <Link href="/catalog" className="btn-outline">{tr.highlights_see_all}</Link>
          </div>
        </div>
      </section>

      {/* Journey Section */}
      <section id="journey" className={`section ${styles.journeySection}`}>
        <div className="container">
          <div className={styles.grid2}>
            <div className={styles.textContent}>
              <h2 className={styles.sectionTitle}>{tr.journey_title}</h2>
              <p>{tr.journey_text}</p>
            </div>
            <div>
              <div className={`${styles.imageBox} glass`}>
                <span className={styles.imageText}>{tr.journey_img}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Terroir Section */}
      <section className={`section ${styles.terroirSection}`}>
        <div className="container">
          <h2 className={styles.sectionTitleCenter}>{tr.terroir_title}</h2>
          <div className={styles.terroirGrid}>
            <div className={`${styles.terroirCard} glass`}>
              <h3>Sumatra</h3>
              <p>Mandheling, Lampung Robusta & Gayo Arabica</p>
            </div>
            <div className={`${styles.terroirCard} glass`}>
              <h3>Java</h3>
              <p>Classic Estate Arabica / Java Preanger</p>
            </div>
            <div className={`${styles.terroirCard} glass`}>
              <h3>Sulawesi</h3>
              <p>Toraja Robusta & Arabika</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges Section */}
      <section className={`section`} style={{ backgroundColor: 'var(--bg-card)', padding: '3rem 0' }}>
        <div className="container">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'center', textAlign: 'center' }}>
            <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🌱</div>
              <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                {lang === 'ja' ? '100% インドネシア珈琲' : lang === 'en' ? '100% Indonesian Coffee' : '100% Kopi Nusantara'}
              </h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                {lang === 'ja' ? '厳選された現地農家からダイレクト調達' : lang === 'en' ? 'Finest beans directly from local farmers' : 'Biji kopi pilihan dari petani lokal terbaik'}
              </p>
            </div>
            <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔥</div>
              <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                {lang === 'ja' ? 'フレッシュロースト' : 'Freshly Roasted'}
              </h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                {lang === 'ja' ? '発送前最大7日以内に焙煎したての豆をお届け' : lang === 'en' ? 'Roasted maximum 7 days before dispatch' : 'Disangrai maksimal 7 hari sebelum dikirim'}
              </p>
            </div>
            <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🛡️</div>
              <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                {lang === 'ja' ? '品質保証' : lang === 'en' ? 'Quality Guarantee' : 'Garansi Kualitas'}
              </h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                {lang === 'ja' ? '万が一不備があった場合の交換・返金対応' : lang === 'en' ? 'Replacement if order does not match' : 'Penggantian jika pesanan tidak sesuai'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Reviews Section */}
      <section className={`section`}>
        <div className="container">
          <h2 className={styles.sectionTitleCenter}>{tr.reviews_title}</h2>
          <p className={styles.sectionSubtitleCenter}>{tr.reviews_sub}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
            {reviews.filter(r => r.rating >= 4).slice(0, 3).map(review => {
              const initial = review.customerName ? review.customerName.charAt(0).toUpperCase() : 'C';
              return (
              <div key={review.id} className="glass" style={{ padding: '1.5rem', borderRadius: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', transition: 'transform 0.3s ease, box-shadow 0.3s ease', cursor: 'default' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--accent-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem' }}>
                      {initial}
                    </div>
                    <div>
                      <div style={{ fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        {review.customerName}
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="#10b981"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1.3 14.8l-4.5-4.5 1.4-1.4 3.1 3.1 7.1-7.1 1.4 1.4-8.5 8.5z"/></svg>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                        {lang === 'ja' ? '認証済み購入者' : lang === 'en' ? 'Verified Buyer' : 'Pembeli Terverifikasi'}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#fbbf24', fontSize: '1rem' }}>
                      {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      {new Date((review as any).createdAt || review.date).toLocaleDateString(lang === 'ja' ? 'ja-JP' : lang === 'en' ? 'en-US' : 'id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '0.35rem 0.6rem', backgroundColor: 'var(--bg-card)', display: 'inline-block', borderRadius: '0.5rem', alignSelf: 'flex-start', border: '1px solid var(--border-color)' }}>
                  ☕ {review.productName}
                </div>

                <p style={{ color: 'var(--text-primary)', fontSize: '0.95rem', lineHeight: '1.6', fontStyle: 'italic', flex: 1 }}>
                  "{review.comment}"
                </p>

                {(review.photos || review.videos) && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', flexWrap: 'wrap' }}>
                    {review.photos?.map((photo, idx) => (
                      <img key={idx} src={photo} alt="Review Media" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '0.5rem', border: '1px solid var(--border-color)', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'} />
                    ))}
                    {review.videos?.map((video, idx) => (
                      <video key={idx} src={video} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }} />
                    ))}
                  </div>
                )}
              </div>
            )})}
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section id="partner" className={`section ${styles.ctaSection}`}>
        <div className="container">
          <div className={styles.ctaBox}>
            <h2>{tr.cta_title}</h2>
            <p>{tr.cta_sub}</p>
            <div className={styles.heroActions}>
              <Link href="/custom-sourcing" className="btn-primary">{tr.cta_custom}</Link>
            </div>
          </div>
        </div>
      </section>

      <footer className={styles.footer} style={{ borderTop: '1px solid var(--border-color)', paddingTop: '2rem', paddingBottom: '2rem' }}>
        <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          <p style={{ margin: 0, fontSize: '0.875rem' }}>{tr.footer_copy}</p>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {lang === 'ja' ? '安全で暗号化された取引 🔒' : lang === 'en' ? 'Secure & Encrypted Transactions 🔒' : 'Transaksi Aman & Terenkripsi 🔒'}
          </div>
        </div>
      </footer>
    </main>
  );
}
