"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLang } from "../context/LanguageContext";
import { useCart } from "../context/CartContext";
import { t } from "../data/translations";
import { coffees, Coffee } from "../data/coffees";
import styles from "./page.module.css";

function AddToCartButton({ coffee }: { coffee: Coffee }) {
  const { addToCart } = useCart();
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
    });
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    handleAdd(e);
    router.push("/checkout");
  };

  return (
    <>
      <button className="btn-outline" style={{ flex: 1, padding: '0.5rem', fontSize: '0.9rem' }} onClick={handleAdd}>+ Cart</button>
      <button className="btn-primary" style={{ flex: 1, padding: '0.5rem', fontSize: '0.9rem' }} onClick={handleBuyNow}>Buy Now</button>
    </>
  );
}

export default function Home() {
  const { lang } = useLang();
  const tr = t[lang];
  const highlightedProducts = coffees.slice(0, 3);

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
              <Link href="/catalog" className="btn-primary">{tr.hero_cta_catalog}</Link>
              <Link href="/b2b-sample" className="btn-outline">{tr.hero_cta_b2b}</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Highlights */}
      <section className={`section ${styles.highlightsSection}`}>
        <div className="container">
          <h2 className={styles.sectionTitleCenter}>{tr.highlights_title}</h2>
          <p className={styles.sectionSubtitleCenter}>Beli Langsung dari Halaman Utama!</p>
          <div className={styles.highlightGrid}>
            {highlightedProducts.map(coffee => (
              <div key={coffee.id} className={`${styles.highlightCard} glass`} style={{ display: 'flex', flexDirection: 'column' }}>
                <Link href={`/product/${coffee.id}`} style={{ textDecoration: 'none', color: 'inherit', flex: 1 }}>
                  <div className={styles.highlightImage}>
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

      {/* CTA Footer */}
      <section id="partner" className={`section ${styles.ctaSection}`}>
        <div className="container">
          <div className={styles.ctaBox}>
            <h2>{tr.cta_title}</h2>
            <p>{tr.cta_sub}</p>
            <div className={styles.heroActions}>
              <Link href="/b2b-sample" className="btn-primary">{tr.cta_sample}</Link>
              <button className="btn-outline">{tr.cta_custom}</button>
            </div>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <p>{tr.footer_copy}</p>
      </footer>
    </main>
  );
}
