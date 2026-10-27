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
      <button 
        className="btn-outline" 
        style={{ flex: 1, padding: '0.6rem 0.5rem', fontSize: '0.75rem', letterSpacing: '0.08em' }} 
        onClick={handleAdd}
        aria-label={`Tambah ${coffee.name} ke keranjang`}
      >
        {lang === 'ja' ? '+ カート' : lang === 'en' ? '+ Cart' : '+ Keranjang'}
      </button>
      <button 
        className="btn-primary" 
        style={{ flex: 1, padding: '0.6rem 0.5rem', fontSize: '0.75rem', letterSpacing: '0.08em' }} 
        onClick={handleBuyNow}
        aria-label={`Beli ${coffee.name} sekarang`}
      >
        {lang === 'ja' ? '今すぐ購入' : lang === 'en' ? 'Buy Now' : 'Beli Sekarang'}
      </button>
    </>
  );
}

export default function Home() {
  const { lang } = useLang();
  const tr = t[lang];
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

  const highlightedProducts = coffees.slice(0, 4).map(c => getLocalizedCoffee(c, lang));

  return (
    <main className={styles.main}>
      {/* ====================================================================
          HERO SECTION: Gallery Minimalist (Wix Template #1968 Inspiration)
          ==================================================================== */}
      <section className={styles.hero}>
        <div className="container">
          <div className={styles.heroGrid}>
            <div className={styles.heroContent}>
              <span className={styles.superTitle}>
                {lang === 'ja' ? '特別展 • インドネシア産地珈琲' : lang === 'en' ? 'Curated Terroir Exhibition' : 'Kurasi Terroir Kopi Nusantara'}
              </span>
              
              <h1 className={styles.brandTitle}>Ramu Roastery</h1>
              <p className={styles.brandSub}>BANDUNG, WEST JAVA • EST. 2026</p>
              
              <h2 className={styles.heroHeadline}>{tr.hero_tagline}</h2>
              <p className={styles.heroSubheadline}>{tr.hero_sub}</p>
              
              <div className={styles.heroActions}>
                <Link href="/catalog" className="btn-primary" style={{ padding: '14px 34px' }}>
                  {tr.hero_cta_catalog}
                </Link>
                <Link href="/custom-sourcing" className="btn-outline" style={{ padding: '14px 34px' }}>
                  {tr.hero_cta_b2b}
                </Link>
              </div>
            </div>

            {/* Hero Exhibition Visual Frame */}
            <div className={styles.heroVisualCol}>
              <div className={styles.exhibitionFrame}>
                <div className={styles.exhibitionImageWrap}>
                  <img 
                    src="/images/hero_bg.jpg" 
                    alt="Ramu Roastery Artisan Batch Calibration" 
                    loading="eager"
                  />
                </div>
                <div className={styles.exhibitionLabel}>
                  <div>
                    <div className={styles.exhibitionLabelTitle}>Batch 026 • Drum Roasting</div>
                    <div className={styles.exhibitionLabelSub}>Gunung Halu & Java Preanger</div>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent-color)', fontWeight: 600, letterSpacing: '0.1em' }}>
                    EST. 2026
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          THE COLLECTION: GALLERY EXHIBITION GRID (Curated Coffee Lots)
          ==================================================================== */}
      <section className={`section ${styles.collectionSection}`}>
        <div className="container">
          <div className={styles.sectionHeaderCenter}>
            <span className={styles.sectionEyebrow}>
              {lang === 'ja' ? '厳選アーカイブ' : lang === 'en' ? 'The Collection' : 'Koleksi Sangrai Kurasi'}
            </span>
            <h2 className={styles.sectionTitle}>{tr.highlights_title}</h2>
            <p className={styles.sectionSubtitle}>{tr.highlights_direct_buy}</p>
          </div>

          <div className={styles.galleryGrid}>
            {highlightedProducts.map(coffee => {
              const price200g = (coffee.pricePerKg / 1000) * 200;
              return (
                <article key={coffee.id} className={styles.artworkCard}>
                  <Link href={`/product/${coffee.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div className={styles.artworkImageContainer}>
                      {coffee.imageUrl && (
                        <img 
                          src={coffee.imageUrl} 
                          alt={coffee.name} 
                          loading="lazy"
                        />
                      )}
                      <span className={styles.originBadgePill}>{coffee.category}</span>
                    </div>
                    
                    <div className={styles.artworkDetails}>
                      <span className={styles.artworkCategory}>Single Origin Arabica</span>
                      <h3 className={styles.artworkTitle}>{coffee.name}</h3>
                      <p className={styles.artworkNotes}>
                        {coffee.tastingNotes.join(" • ")}
                      </p>
                      
                      <div className={styles.artworkPriceRow}>
                        <div className={styles.artworkPrice}>
                          Rp {price200g.toLocaleString('id-ID')}
                          <span className={styles.artworkPriceUnit}> / 200g</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                  
                  <div className={styles.artworkActions}>
                    <AddToCartButton coffee={coffee} />
                  </div>
                </article>
              );
            })}
          </div>

          <div style={{ textAlign: "center", marginTop: "3.5rem" }}>
            <Link href="/catalog" className="btn-outline" style={{ padding: '14px 40px' }}>
              {tr.highlights_see_all}
            </Link>
          </div>
        </div>
      </section>

      {/* ====================================================================
          MEET THE ROASTER & PHILOSOPHY (Wix 1968 "Meet The Artist" Style)
          ==================================================================== */}
      <section id="journey" className={styles.roasterSection}>
        <div className="container">
          <div className={styles.roasterGrid}>
            <div className={styles.roasterImageFrame}>
              <img 
                src="/images/signature_blend.jpg" 
                alt="Proses Kurasi dan Sangrai Biji Kopi Ramu Roastery Bandung" 
                loading="lazy"
              />
              <div className={styles.roasterCaption}>
                <span>Bandung Roasting Lab</span>
                <span>Agtron Color Calibration</span>
              </div>
            </div>

            <div className={styles.roasterTextCol}>
              <span className={styles.sectionEyebrow}>
                {lang === 'ja' ? 'ロースターについて' : lang === 'en' ? 'Meet The Roaster' : 'Filosofi Sangrai'}
              </span>
              <h2 className={styles.sectionTitle}>{tr.journey_title}</h2>
              <p className={styles.roasterStory}>{tr.journey_text}</p>
              
              <div className={styles.roasterSpecs}>
                <div className={styles.specItem}>
                  <h5>
                    {lang === 'ja' ? '農園ダイレクト調達' : lang === 'en' ? 'Direct Farm Relations' : 'Kemitraan Petani Asal'}
                  </h5>
                  <p>
                    {lang === 'ja' 
                      ? '西ジャワ・ハル山などの優良生産者と直接連携し、公正な取引を実施。' 
                      : lang === 'en' 
                      ? 'Direct trade partnerships with smallholder cooperatives across Java and Sumatra.' 
                      : 'Kemitraan langsung dengan kelompok tani Gunung Halu dan dataran tinggi Nusantara.'}
                  </p>
                </div>
                <div className={styles.specItem}>
                  <h5>
                    {lang === 'ja' ? '厳密なプロファイル検証' : lang === 'en' ? 'Calibrated Drum Roasting' : 'Kalibrasi Roasting Presisi'}
                  </h5>
                  <p>
                    {lang === 'ja' 
                      ? '豆の個性を引き出す緻密な熱制御で、抽出時の再現性を保証。' 
                      : lang === 'en' 
                      ? 'Precision thermal profiles engineered for consistent cafe and home extraction.' 
                      : 'Kurva sangrai terukur untuk memastikan kalibrasi grinder kafe dan seduhan rumah yang konsisten.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          ROASTERY QUALITY COMMITMENTS (Minimalist 3-Column Exhibit)
          ==================================================================== */}
      <section className={`section ${styles.standardsSection}`}>
        <div className="container">
          <div className={styles.sectionHeaderCenter}>
            <span className={styles.sectionEyebrow}>
              {lang === 'ja' ? 'ロースト基準' : lang === 'en' ? 'Quality Benchmarks' : 'Standar Kualitas'}
            </span>
            <h2 className={styles.sectionTitle}>
              {lang === 'ja' ? 'ラームの品質誓約' : lang === 'en' ? 'The Roaster’s Commitment' : 'Komitmen Roaster Ramu'}
            </h2>
            <p className={styles.sectionSubtitle}>
              {lang === 'ja' 
                ? '最高の一杯をお届けするために妥協のないクラフトマンシップ' 
                : lang === 'en' 
                ? 'Uncompromising benchmarks for coffee consistency, freshness, and traceability' 
                : 'Setiap proses diawasi secara cermat agar sajian di cangkir Anda selalu luar biasa.'}
            </p>
          </div>

          <div className={styles.standardsGrid}>
            <div className={styles.standardExhibitItem}>
              <span className={styles.standardNumeral}>I. HARVEST</span>
              <h4 className={styles.standardHeadline}>
                {lang === 'ja' ? '100% インドネシア珈琲' : lang === 'en' ? 'Direct Origin Traceability' : '100% Kopi Nusantara Terlacak'}
              </h4>
              <p className={styles.standardBody}>
                {lang === 'ja' 
                  ? '厳選された現地農家からダイレクト調達し、公正な対価を生産者へ還元。' 
                  : lang === 'en' 
                  ? 'Traceable micro-lots sourced directly from partner grower cooperatives with transparent pricing.' 
                  : 'Green beans diperoleh langsung dari kelompok tani binaan tanpa rantai perantara tengkulak.'}
              </p>
            </div>

            <div className={styles.standardExhibitItem}>
              <span className={styles.standardNumeral}>II. ROASTING</span>
              <h4 className={styles.standardHeadline}>
                {lang === 'ja' ? 'フレッシュロースト保証' : lang === 'en' ? 'Peak Freshness Window' : 'Jaminan Kesegaran Sangrai'}
              </h4>
              <p className={styles.standardBody}>
                {lang === 'ja' 
                  ? '発送前最大7日以内に焙煎したての豆をお届け、最適なデガッシングを実現。' 
                  : lang === 'en' 
                  ? 'Roasted maximum 7 days before dispatch to arrive within the perfect degassing window.' 
                  : 'Biji kopi dikirim dalam rentang 7 hari pasca sangrai untuk waktu resting dan ekstraksi optimal.'}
              </p>
            </div>

            <div className={styles.standardExhibitItem}>
              <span className={styles.standardNumeral}>III. EXTRACTION</span>
              <h4 className={styles.standardHeadline}>
                {lang === 'ja' ? 'バーキャリブレーション保証' : lang === 'en' ? 'Bar Calibration Guarantee' : 'Garansi Kalibrasi Bar'}
              </h4>
              <p className={styles.standardBody}>
                {lang === 'ja' 
                  ? 'カフェバーの抽出設定を崩さない一貫した水分値とロースト度合の検証。' 
                  : lang === 'en' 
                  ? 'Consistent density and roast degree (Agtron verified) for effortless cafe bar workflow.' 
                  : 'Konsistensi densitas dan profil rasa terukur memudahkan kalibrasi grinder di kafe maupun rumah.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          GUEST IMPRESSIONS & CUPPING REVIEWS
          ==================================================================== */}
      <section className={`section ${styles.reviewsSection}`}>
        <div className="container">
          <div className={styles.sectionHeaderCenter}>
            <span className={styles.sectionEyebrow}>
              {lang === 'ja' ? 'お客様の声' : lang === 'en' ? 'Cupping Notes & Reviews' : 'Ulasan Pecinta Kopi'}
            </span>
            <h2 className={styles.sectionTitle}>{tr.reviews_title}</h2>
            <p className={styles.sectionSubtitle}>{tr.reviews_sub}</p>
          </div>

          <div className={styles.reviewsGrid}>
            {reviews.filter(r => r.rating >= 4).slice(0, 3).map(review => (
              <div key={review.id} className={styles.reviewCard}>
                <div className={styles.reviewHeader}>
                  <div>
                    <div className={styles.reviewerName}>{review.customerName}</div>
                    <span className={styles.buyerBadge}>
                      {lang === 'ja' ? '認証購入者' : lang === 'en' ? 'Verified Buyer' : 'Pembeli Terverifikasi'}
                    </span>
                  </div>
                  <div className={styles.reviewDate}>
                    {new Date((review as any).createdAt || review.date).toLocaleDateString(lang === 'ja' ? 'ja-JP' : lang === 'en' ? 'en-US' : 'id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>

                <p className={styles.reviewQuote}>
                  "{review.comment}"
                </p>

                <div className={styles.reviewBeanTag}>
                  ☕ {review.productName}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====================================================================
          B2B & SOURCING INVITATION (Minimalist Contrast Card)
          ==================================================================== */}
      <section id="partner" className={styles.ctaSection}>
        <div className="container">
          <div className={styles.ctaContainer}>
            <span className={styles.ctaSuper}>
              {lang === 'ja' ? 'パートナーシップ' : lang === 'en' ? 'Wholesale & Sourcing' : 'Kemitraan Kedai & Bisnis'}
            </span>
            <h2 className={styles.ctaTitle}>{tr.cta_title}</h2>
            <p className={styles.ctaText}>{tr.cta_sub}</p>
            <div className={styles.ctaActions}>
              <Link href="/custom-sourcing" className={styles.ctaBtnPrimary}>
                {tr.cta_custom}
              </Link>
              <Link href="/catalog" className={styles.ctaBtnSecondary}>
                {tr.hero_cta_catalog}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          FOOTER (Wix 1968 Minimalist Studio Footer)
          ==================================================================== */}
      <footer className={styles.footer}>
        <div className="container">
          <div className={styles.footerGrid}>
            <div className={styles.footerBrand}>
              <h4>Ramu Roastery</h4>
              <p>
                Spesialis sangrai kopi artisan dan arsip micro-lot Nusantara. Menyediakan pasokan biji kopi berkualitas tinggi untuk kedai kopi dan penikmat seduh mandiri di seluruh dunia.
              </p>
              <div style={{ marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                📍 Bandung, Jawa Barat, Indonesia
              </div>
            </div>

            <div className={styles.footerCol}>
              <h5>Navigasi</h5>
              <ul>
                <li><Link href="/catalog">Katalog Kopi</Link></li>
                <li><Link href="/custom-sourcing">Mitra Kedai (B2B)</Link></li>
                <li><Link href="/about">Tentang Kami</Link></li>
                <li><Link href="/faq">Pusat Bantuan</Link></li>
              </ul>
            </div>

            <div className={styles.footerCol}>
              <h5>Layanan</h5>
              <ul>
                <li><Link href="/track">Lacak Status Pesanan</Link></li>
                <li><Link href="/dashboard/orders">Riwayat Belanja</Link></li>
                <li><Link href="/login">Akun Pengguna</Link></li>
                <li><Link href="/admin">Portal Roaster</Link></li>
              </ul>
            </div>

            <div className={styles.footerCol}>
              <h5>Standar</h5>
              <ul>
                <li>SCA Cupping 84+</li>
                <li>Fresh Roast ≤ 7 Hari</li>
                <li>Single Origin Traceable</li>
                <li>iPay88 SSL Secure</li>
              </ul>
            </div>
          </div>

          <div className={styles.footerBottom}>
            <div>{tr.footer_copy}</div>
            <div>
              Transaksi Dijamin Aman & Terenkripsi SSL (iPay88 Gateway) 🔒
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
