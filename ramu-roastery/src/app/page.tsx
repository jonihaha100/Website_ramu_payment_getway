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
        style={{ flex: 1, padding: '0.55rem 0.75rem', fontSize: '0.85rem' }} 
        onClick={handleAdd}
        aria-label={`Tambah ${coffee.name} ke keranjang`}
      >
        {lang === 'ja' ? '+ カート' : lang === 'en' ? '+ Cart' : '+ Keranjang'}
      </button>
      <button 
        className="btn-primary" 
        style={{ flex: 1, padding: '0.55rem 0.75rem', fontSize: '0.85rem' }} 
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
      {/* Hero Section: Editorial Artisan Roastery Atmosphere */}
      <section className={styles.hero}>
        <div className="container">
          <div className={styles.heroContent}>
            <div className={styles.originBadge}>
              <span>BANDUNG, WEST JAVA • EST. 2026</span>
            </div>
            
            <h1 className={styles.brandName}>Ramu</h1>
            <p className={styles.brandSub}>ARTISAN ROASTERY & TERROIR ARCHIVE</p>
            
            <h2 className={styles.heroHeadline}>{tr.hero_tagline}</h2>
            <p className={styles.heroSubheadline}>{tr.hero_sub}</p>
            
            <div className={styles.heroActions}>
              <Link href="/catalog" className={styles.heroCtaPrimary}>
                {tr.hero_cta_catalog}
              </Link>
              <Link href="/custom-sourcing" className={styles.heroCtaSecondary}>
                {tr.hero_cta_b2b}
              </Link>
            </div>

            {/* Roastery Hallmarks */}
            <div className={styles.heroHallmarks}>
              <div className={styles.hallmarkItem}>
                <span className={styles.hallmarkVal}>≤ 7 Hari</span>
                <span className={styles.hallmarkLabel}>
                  {lang === 'ja' ? '焙煎後新鮮出荷' : lang === 'en' ? 'Fresh Roast Window' : 'Jendela Fresh Roast'}
                </span>
              </div>
              <div className={styles.hallmarkItem}>
                <span className={styles.hallmarkVal}>SCA 84+</span>
                <span className={styles.hallmarkLabel}>
                  {lang === 'ja' ? 'カッピングスコア基準' : lang === 'en' ? 'Specialty Grade Standard' : 'Standar Specialty Grade'}
                </span>
              </div>
              <div className={styles.hallmarkItem}>
                <span className={styles.hallmarkVal}>100% Traceable</span>
                <span className={styles.hallmarkLabel}>
                  {lang === 'ja' ? '農園ダイレクト調達' : lang === 'en' ? 'Direct Farm Sourcing' : 'Kemitraan Langsung Kebun'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Micro-Lots & Artisan Single Origins */}
      <section className={`section ${styles.highlightsSection}`}>
        <div className="container">
          <div className={styles.sectionHeaderCenter}>
            <span className={styles.sectionEyebrow}>
              {lang === 'ja' ? '厳選マイクロロット' : lang === 'en' ? 'Curated Micro-Lots' : 'Kurasi Micro-Lot Pilihan'}
            </span>
            <h2 className={styles.sectionTitle}>{tr.highlights_title}</h2>
            <p className={styles.sectionSubtitle}>{tr.highlights_direct_buy}</p>
          </div>

          <div className={styles.sliderContainer}>
            <div className={styles.sliderWrapper}>
              {highlightedProducts.map(coffee => {
                const price200g = (coffee.pricePerKg / 1000) * 200;
                return (
                  <article key={coffee.id} className={styles.coffeeCard}>
                    <Link href={`/product/${coffee.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <div className={styles.cardImageWrap}>
                        {coffee.imageUrl && (
                          <img 
                            src={coffee.imageUrl} 
                            alt={coffee.name} 
                            loading="lazy"
                          />
                        )}
                        <span className={styles.roastCategoryBadge}>{coffee.category}</span>
                      </div>
                      
                      <div className={styles.cardBody}>
                        <h3 className={styles.cardTitle}>{coffee.name}</h3>
                        <div className={styles.tastingNotesWrap}>
                          {coffee.tastingNotes.slice(0, 3).map(note => (
                            <span key={note} className={styles.tastingNoteTag}>{note}</span>
                          ))}
                        </div>
                        <div className={styles.priceTag}>
                          Rp {price200g.toLocaleString('id-ID')}
                          <span className={styles.priceUnit}> / 200g</span>
                        </div>
                      </div>
                    </Link>
                    
                    <div className={styles.cardFooter}>
                      <AddToCartButton coffee={coffee} />
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
            <Link href="/catalog" className="btn-outline">
              {tr.highlights_see_all}
            </Link>
          </div>
        </div>
      </section>

      {/* Roastery Journey & Sourcing Philosophy (Editorial Split) */}
      <section id="journey" className={`section ${styles.journeySection}`}>
        <div className="container">
          <div className={styles.journeyGrid}>
            <div className={styles.journeyTextCol}>
              <span className={styles.sectionEyebrow}>
                {lang === 'ja' ? 'ロースタリーの哲学' : lang === 'en' ? 'Craftsmanship Philosophy' : 'Filosofi Sangrai'}
              </span>
              <h2 className={styles.sectionTitle}>{tr.journey_title}</h2>
              <p>{tr.journey_text}</p>
              
              <div className={styles.journeyPillars}>
                <div className={styles.pillarItem}>
                  <h4 className={styles.pillarTitle}>
                    {lang === 'ja' ? '農園との直接対話' : lang === 'en' ? 'Direct Farm Relations' : 'Kemitraan Petani Lokal'}
                  </h4>
                  <p className={styles.pillarDesc}>
                    {lang === 'ja' ? '西ジャワ・ハル山などの優良生産者と直接連携' : lang === 'en' ? 'Direct trade with highland growers in Mount Halu & Sumatra' : 'Bekerja sama erat dengan kelompok tani Gunung Halu dan dataran tinggi Nusantara.'}
                  </p>
                </div>
                <div className={styles.pillarItem}>
                  <h4 className={styles.pillarTitle}>
                    {lang === 'ja' ? '精密プロファイル焙煎' : lang === 'en' ? 'Calibrated Drum Roasting' : 'Kalibrasi Roasting Presisi'}
                  </h4>
                  <p className={styles.pillarDesc}>
                    {lang === 'ja' ? '豆の個性を最大限に引き出す緻密な熱制御' : lang === 'en' ? 'Specific heat curves engineered to unlock origin flavor complexity' : 'Kurva sangrai terukur untuk menonjolkan keaslian karakter rasa terroir.'}
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.journeyVisualCol}>
              <div className={styles.journeyImageFrame}>
                <img 
                  src="/images/signature_blend.jpg" 
                  alt="Proses Sangrai Artisan Ramu Roastery Bandung" 
                  loading="lazy"
                />
                <div className={styles.journeyCaption}>
                  <span>Fasilitas Roastery Bandung</span>
                  <span>Kalibrasi Agtron Terverifikasi</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Nusantara Terroir Archipelago Explorer */}
      <section className={`section ${styles.terroirSection}`}>
        <div className="container">
          <div className={styles.sectionHeaderCenter}>
            <span className={styles.sectionEyebrow}>
              {lang === 'ja' ? '産地の個性' : lang === 'en' ? 'Indonesian Terroir Atlas' : 'Peta Terroir Kopi Nusantara'}
            </span>
            <h2 className={styles.sectionTitle}>{tr.terroir_title}</h2>
            <p className={styles.sectionSubtitle}>
              {lang === 'ja' 
                ? '火山性土壌と高地気候が育む、インドネシア屈指のフレーバープロファイル' 
                : lang === 'en' 
                ? 'Unique soil compositions and microclimates across the Indonesian archipelago' 
                : 'Karakteristik tanah vulkanik dan iklim mikro pegunungan yang melahirkan profil rasa kopi dunia.'}
            </p>
          </div>

          <div className={styles.terroirGrid}>
            <div className={styles.terroirCard}>
              <span className={styles.terroirOrigin}>Sumatera</span>
              <h3 className={styles.terroirTitle}>Gayo & Mandheling</h3>
              <span className={styles.terroirAltitude}>1,200 - 1,600 mdpl • Wet Hulled & Anaerobic</span>
              <p className={styles.terroirDesc}>
                {lang === 'ja' 
                  ? '重厚なボディと温かみのあるスパイス、ダークカカオの長い余韻' 
                  : lang === 'en' 
                  ? 'Heavy creamy body with warm spices, cedar aromatics, and rich dark cocoa finish' 
                  : 'Sensasi bodi yang tebal, aroma rempah cedar hangat, serta sentuhan manis cokelat hitam.'}
              </p>
              <div className={styles.terroirNotes}>
                Catatan: Dark Chocolate, Brown Spice, Herbal
              </div>
            </div>

            <div className={styles.terroirCard}>
              <span className={styles.terroirOrigin}>Jawa Barat</span>
              <h3 className={styles.terroirTitle}>Java Preanger & Halu</h3>
              <span className={styles.terroirAltitude}>1,350 - 1,550 mdpl • Fully Washed & Honey</span>
              <p className={styles.terroirDesc}>
                {lang === 'ja' 
                  ? '華やかなジャスミンの香りと柑橘の明るい酸味、紅茶のような上品な後味' 
                  : lang === 'en' 
                  ? 'Delicate jasmine florals, bright bergamot acidity, and a refined black tea sweetness' 
                  : 'Aroma melati semerbak, keasaman bergamot yang cerah, serta rasa manis teh hitam yang bersih.'}
              </p>
              <div className={styles.terroirNotes}>
                Catatan: Jasmine Floral, Bergamot, Black Tea
              </div>
            </div>

            <div className={styles.terroirCard}>
              <span className={styles.terroirOrigin}>Sulawesi</span>
              <h3 className={styles.terroirTitle}>Toraja Sapan</h3>
              <span className={styles.terroirAltitude}>1,400 - 1,800 mdpl • Semi-Washed & Natural</span>
              <p className={styles.terroirDesc}>
                {lang === 'ja' 
                  ? '高地ならではの凝縮された甘み、熟したプラムと洗練されたハーブ感' 
                  : lang === 'en' 
                  ? 'Intense mountain sweetness with ripe stone fruit, cinnamon warmth, and elegant finish' 
                  : 'Ketinggian ekstrem menghasilkan rasa manis buah plum matang berpadu kayu manis.'}
              </p>
              <div className={styles.terroirNotes}>
                Catatan: Ripe Plum, Cinnamon, Sweet Tobacco
              </div>
            </div>

            <div className={styles.terroirCard}>
              <span className={styles.terroirOrigin}>Bali</span>
              <h3 className={styles.terroirTitle}>Kintamani Highlands</h3>
              <span className={styles.terroirAltitude}>1,200 - 1,450 mdpl • Anaerobic Natural</span>
              <p className={styles.terroirDesc}>
                {lang === 'ja' 
                  ? '柑橘の木陰で育まれたジューシーなオレンジの酸味と黒糖のコク' 
                  : lang === 'en' 
                  ? 'Intercropped with citrus trees, offering juicy orange acidity and rich muscovado sugar' 
                  : 'Tumbuh di antara kebun jeruk, menghadirkan kesegaran sitrus dan manis gula kelapa.'}
              </p>
              <div className={styles.terroirNotes}>
                Catatan: Orange Blossom, Cane Sugar, Juicy Citrus
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Roastery Standards & Quality Commitments (No Generic Emojis) */}
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
            <div className={styles.standardCard}>
              <div className={styles.standardIconBadge}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <path d="M9 12l2 2 4-4"/>
                </svg>
              </div>
              <h4 className={styles.standardTitle}>
                {lang === 'ja' ? '100% インドネシア珈琲' : lang === 'en' ? 'Direct Origin Transparency' : '100% Kopi Nusantara Terlacak'}
              </h4>
              <p className={styles.standardText}>
                {lang === 'ja' 
                  ? '厳選された現地農家からダイレクト調達し、公正な対価を生産者へ還元' 
                  : lang === 'en' 
                  ? 'Traceable micro-lots sourced directly from partner grower cooperatives with fair pricing' 
                  : 'Green beans diperoleh langsung dari kelompok tani binaan tanpa rantai perantara tengkulak.'}
              </p>
            </div>

            <div className={styles.standardCard}>
              <div className={styles.standardIconBadge}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <h4 className={styles.standardTitle}>
                {lang === 'ja' ? 'フレッシュロースト保証' : lang === 'en' ? 'Peak Freshness Window' : 'Jaminan Kesegaran Sangrai'}
              </h4>
              <p className={styles.standardText}>
                {lang === 'ja' 
                  ? '発送前最大7日以内に焙煎したての豆をお届け、最適なデガッシングを実現' 
                  : lang === 'en' 
                  ? 'Roasted maximum 7 days before dispatch to arrive within the perfect degassing window' 
                  : 'Biji kopi dikirim dalam rentang 7 hari pasca sangrai untuk waktu resting dan ekstraksi optimal.'}
              </p>
            </div>

            <div className={styles.standardCard}>
              <div className={styles.standardIconBadge}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <h4 className={styles.standardTitle}>
                {lang === 'ja' ? 'バーキャリブレーション保証' : lang === 'en' ? 'Bar Calibration Guarantee' : 'Garansi Kalibrasi Bar'}
              </h4>
              <p className={styles.standardText}>
                {lang === 'ja' 
                  ? 'カフェバーの抽出設定を崩さない一貫した水分値とロースト度合の検証' 
                  : lang === 'en' 
                  ? 'Consistent density and roast degree (Agtron verified) for effortless cafe bar workflow' 
                  : 'Konsistensi densitas dan profil rasa terukur memudahkan kalibrasi grinder di kafe maupun rumah.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Cupping Experiences & Reviews */}
      <section className={`section ${styles.reviewsSection}`}>
        <div className="container">
          <div className={styles.sectionHeaderCenter}>
            <span className={styles.sectionEyebrow}>
              {lang === 'ja' ? 'お客様の声' : lang === 'en' ? 'Cupping Notes & Feedback' : 'Ulasan Pecinta Kopi'}
            </span>
            <h2 className={styles.sectionTitle}>{tr.reviews_title}</h2>
            <p className={styles.sectionSubtitle}>{tr.reviews_sub}</p>
          </div>

          <div className={styles.reviewsGrid}>
            {reviews.filter(r => r.rating >= 4).slice(0, 3).map(review => {
              const initial = review.customerName ? review.customerName.charAt(0).toUpperCase() : 'C';
              return (
                <div key={review.id} className={styles.reviewCard}>
                  <div className={styles.reviewHeader}>
                    <div className={styles.reviewerMeta}>
                      <div className={styles.reviewerAvatar}>
                        {initial}
                      </div>
                      <div>
                        <div className={styles.reviewerName}>
                          {review.customerName}
                          <svg viewBox="0 0 24 24" width="15" height="15" fill="#047857" aria-label="Verified">
                            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1.3 14.8l-4.5-4.5 1.4-1.4 3.1 3.1 7.1-7.1 1.4 1.4-8.5 8.5z"/>
                          </svg>
                        </div>
                        <span className={styles.verifiedPill}>
                          {lang === 'ja' ? '認証購入者' : lang === 'en' ? 'Verified Buyer' : 'Pembeli Terverifikasi'}
                        </span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className={styles.reviewStars}>
                        {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                      </div>
                      <div className={styles.reviewDate}>
                        {new Date((review as any).createdAt || review.date).toLocaleDateString(lang === 'ja' ? 'ja-JP' : lang === 'en' ? 'en-US' : 'id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                  </div>

                  <div className={styles.productBoughtTag}>
                    ☕ {review.productName}
                  </div>

                  <p className={styles.reviewComment}>
                    "{review.comment}"
                  </p>

                  {(review.photos || review.videos) && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', flexWrap: 'wrap' }}>
                      {review.photos?.map((photo, idx) => (
                        <img key={idx} src={photo} alt="Foto Seduhan Pembeli" style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)' }} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* B2B Wholesale & Custom Sourcing Invitation */}
      <section id="partner" className={`section ${styles.ctaSection}`}>
        <div className="container">
          <div className={styles.ctaCard}>
            <h2 className={styles.ctaTitle}>{tr.cta_title}</h2>
            <p className={styles.ctaText}>{tr.cta_sub}</p>
            <div className={styles.heroActions} style={{ marginBottom: 0 }}>
              <Link href="/custom-sourcing" className={styles.heroCtaPrimary}>
                {tr.cta_custom}
              </Link>
              <Link href="/catalog" className={styles.heroCtaSecondary}>
                {tr.hero_cta_catalog}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Roastery Footer */}
      <footer className={styles.footer}>
        <div className="container">
          <div className={styles.footerGrid}>
            <div className={styles.footerBrandCol}>
              <h4>Ramu Roastery Company</h4>
              <p>
                Spesialis sangrai kopi artisan, kurasi micro-lot Nusantara, dan penyedia pasokan biji kopi berkualitas tinggi untuk kedai kopi dan penikmat seduh mandiri di seluruh dunia.
              </p>
              <div style={{ marginTop: '1rem', color: '#8F8177', fontSize: '0.8rem' }}>
                📍 Bandung, Jawa Barat, Indonesia
              </div>
            </div>

            <div className={styles.footerLinksCol}>
              <h5>Navigasi</h5>
              <ul>
                <li><Link href="/catalog">Katalog Kopi</Link></li>
                <li><Link href="/custom-sourcing">Mitra Kedai (B2B)</Link></li>
                <li><Link href="/about">Tentang Kami</Link></li>
                <li><Link href="/faq">Pusat Bantuan</Link></li>
              </ul>
            </div>

            <div className={styles.footerLinksCol}>
              <h5>Layanan</h5>
              <ul>
                <li><Link href="/track">Lacak Status Pesanan</Link></li>
                <li><Link href="/dashboard/orders">Riwayat Belanja</Link></li>
                <li><Link href="/login">Akun Pengguna</Link></li>
                <li><Link href="/admin">Portal Roaster</Link></li>
              </ul>
            </div>
          </div>

          <div className={styles.footerBottom}>
            <div>{tr.footer_copy}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#D6CBC0', fontSize: '0.8rem' }}>
              <span>🔒 Transaksi Dijamin Aman & Terenkripsi SSL (iPay88 Gateway)</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
