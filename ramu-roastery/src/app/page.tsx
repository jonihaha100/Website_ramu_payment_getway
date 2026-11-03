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

function HomeFaqItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className={styles.homeFaqItem}>
      <button 
        type="button" 
        className={styles.homeFaqBtn} 
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span>{question}</span>
        <svg 
          className={`${styles.homeFaqIcon} ${isOpen ? styles.homeFaqIconOpen : ''}`} 
          width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
      {isOpen && (
        <div className={styles.homeFaqAnswer}>
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
}

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
          GUEST IMPRESSIONS & CUPPING REVIEWS (SOCIAL PROOF & RATING)
          ==================================================================== */}
      <section className={`section ${styles.reviewsSection}`}>
        <div className="container">
          <div className={styles.sectionHeaderCenter}>
            <span className={styles.sectionEyebrow}>
              {lang === 'ja' ? '認証レビュー' : lang === 'en' ? 'Verified Cupping Reviews' : 'Ulasan Pecinta Kopi'}
            </span>
            <h2 className={styles.sectionTitle}>{tr.reviews_title}</h2>
            <p className={styles.sectionSubtitle}>{tr.reviews_sub}</p>

            {/* Curated Social Proof & Trust Barometer */}
            <div className={styles.trustScoreBar}>
              <div className={styles.trustScoreRating}>
                <div className={styles.trustStars} aria-label="Rating 4.9 dari 5 bintang">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className={styles.starSvg} viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className={styles.trustNumber}>4.9</span>
                <span className={styles.trustTotal}>
                  {lang === 'ja'
                    ? '（1,250件以上の認証レビュー）'
                    : lang === 'en'
                    ? 'from 1,250+ verified customer reviews'
                    : 'dari 1.250+ ulasan pembeli terverifikasi'}
                </span>
              </div>

              <div className={styles.trustHighlights}>
                <span className={styles.trustHighlightItem}>
                  <svg className={styles.checkSvg} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                  </svg>
                  {lang === 'ja' ? '100% 認証購入者のみ' : lang === 'en' ? '100% Verified Buyers' : '100% Pembeli Terverifikasi'}
                </span>
                <span className={styles.trustDivider} aria-hidden="true">•</span>
                <span className={styles.trustHighlightItem}>
                  {lang === 'ja' ? '新鮮焙煎保証 < 7日' : lang === 'en' ? 'Fresh Roast Guarantee < 7 Days' : 'Garansi Fresh Roast < 7 Hari'}
                </span>
                <span className={styles.trustDivider} aria-hidden="true">•</span>
                <span className={styles.trustHighlightItem}>
                  {lang === 'ja' ? '配送破損無料交換' : lang === 'en' ? 'Safe Arrival Guarantee' : 'Garansi Tukar Baru Jika Rusak'}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.reviewsGrid}>
            {[...reviews]
              .filter(r => r.rating >= 4)
              .sort((a, b) => new Date((b as any).createdAt || b.date || 0).getTime() - new Date((a as any).createdAt || a.date || 0).getTime())
              .slice(0, 3)
              .map((review) => {
              const initials = (review.customerName || "U")
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();

              return (
                <article key={review.id} className={styles.reviewCard}>
                  {/* Card Header: Reviewer Info & Date */}
                  <div className={styles.reviewHeader}>
                    <div className={styles.reviewerMeta}>
                      <div className={styles.reviewerAvatar} aria-hidden="true">
                        {initials}
                      </div>
                      <div className={styles.reviewerNameCol}>
                        <div className={styles.reviewerName}>{review.customerName}</div>
                        <span className={styles.verifiedBadge}>
                          <svg className={styles.verifiedCheck} viewBox="0 0 16 16" fill="currentColor">
                            <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                          </svg>
                          {lang === 'ja' ? '認証購入者' : lang === 'en' ? 'Verified Buyer' : 'Pembeli Terverifikasi'}
                        </span>
                      </div>
                    </div>
                    <time className={styles.reviewDate}>
                      {new Date((review as any).createdAt || review.date).toLocaleDateString(
                        lang === 'ja' ? 'ja-JP' : lang === 'en' ? 'en-US' : 'id-ID',
                        { day: 'numeric', month: 'short', year: 'numeric' }
                      )}
                    </time>
                  </div>

                  {/* Rating Score & Quality Tag */}
                  <div className={styles.reviewRatingRow}>
                    <div className={styles.starsRow} aria-label={`Rating ${review.rating} dari 5 bintang`}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className={`${styles.starCardSvg} ${star <= review.rating ? styles.starFilled : styles.starEmpty}`}
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className={styles.ratingNumber}>{review.rating}.0</span>
                    <span className={styles.ratingQualityBadge}>
                      {review.rating === 5
                        ? (lang === 'ja' ? '最高評価' : lang === 'en' ? 'Top Rated' : 'Puas Maksimal')
                        : (lang === 'ja' ? 'おすすめ' : lang === 'en' ? 'Recommended' : 'Direkomendasikan')}
                    </span>
                  </div>

                  {/* Review Text */}
                  <blockquote className={styles.reviewQuote}>
                    &ldquo;{review.comment}&rdquo;
                  </blockquote>

                  {/* User Photo Attachments */}
                  {review.photos && review.photos.length > 0 && (
                    <div className={styles.reviewPhotosGrid}>
                      {review.photos.map((photo, pIdx) => (
                        <img
                          key={pIdx}
                          src={photo}
                          alt={`Foto ulasan oleh ${review.customerName}`}
                          className={styles.reviewPhotoImg}
                          loading="lazy"
                        />
                      ))}
                    </div>
                  )}

                  {/* Official Roastery Concierge Reply */}
                  {review.reply && (
                    <div className={styles.reviewReplyBox}>
                      <div className={styles.replyHeader}>
                        <span className={styles.roasterBadge}>RAMU ROASTERY</span>
                        <span className={styles.replyLabel}>
                          {lang === 'ja' ? 'ロースター返信' : lang === 'en' ? 'Roaster Note' : 'Respon Roaster'}
                        </span>
                      </div>
                      <p className={styles.replyContent}>
                        &ldquo;{review.reply}&rdquo;
                      </p>
                    </div>
                  )}

                  {/* Pinned Card Footer: Product & Grind Profile */}
                  <div className={styles.reviewCardFooter}>
                    <div className={styles.beanMetaRow}>
                      <span className={styles.beanSymbol} aria-hidden="true">☕</span>
                      <div className={styles.beanInfoCol}>
                        <span className={styles.beanName}>{review.productName}</span>
                        {review.variant && (
                          <span className={styles.beanVariantDetail}>
                            {review.variant.replace(/^Membeli:\s*/i, '')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ====================================================================
          FAQ PREVIEW (Curated Roastery Knowledge & Help)
          ==================================================================== */}
      <section className={styles.homeFaqSection}>
        <div className="container">
          <header className={styles.homeFaqHeader}>
            <span className={styles.homeFaqSuper}>
              {lang === 'ja' ? 'よくあるご質問' : lang === 'en' ? 'Knowledge & Support' : 'Pusat Bantuan & Edukasi'}
            </span>
            <h2 className={styles.homeFaqTitle}>
              {lang === 'ja' ? 'よくあるご質問（FAQ）' : lang === 'en' ? 'Frequently Asked Questions' : 'Pertanyaan Umum Seputar Roastery'}
            </h2>
            <p className={styles.homeFaqSubtitle}>
              {lang === 'ja'
                ? '焙煎スケジュール、挽き目の選び方、配送、および決済に関するご案内です。'
                : lang === 'en'
                ? 'Key information regarding roast schedules, grind selection, shipping, and official payment methods.'
                : 'Informasi esensial mengenai jadwal sangrai batch, kalibrasi gilingan, pengiriman se-Indonesia, dan sistem transaksi resmi.'}
            </p>
          </header>

          <div className={styles.homeFaqGrid}>
            <HomeFaqItem 
              question={
                lang === 'ja' 
                  ? '焙煎（ロースト）の定期スケジュールはいつですか？' 
                  : lang === 'en' 
                  ? 'When is Ramu Roastery regular roasting schedule?' 
                  : 'Kapan jadwal sangrai (roasting batch) reguler Ramu Roastery?'
              }
              answer={
                lang === 'ja'
                  ? '新鮮な焙煎豆をお届けするため、毎週月曜日と木曜日にバッチ sangrai を行っています。15:00 WIB までのご注文は直近の焙煎バッチにて即時出荷いたします。'
                  : lang === 'en'
                  ? 'We roast fresh batches every Monday and Thursday in our Bandung hub. Orders placed before 15:00 WIB are scheduled for the nearest fresh roast batch.'
                  : 'Kami menyangrai biji kopi segar setiap hari SENIN dan KAMIS langsung di roastery Bandung. Pesanan sebelum 15:00 WIB diproses pada batch sangrai terdekat sehingga kopi tiba pada masa resting optimal.'
              }
            />

            <HomeFaqItem 
              question={
                lang === 'ja' 
                  ? '抽出器具に合わせた挽き目の選び方を教えてください' 
                  : lang === 'en' 
                  ? 'How do I choose the correct grind size for my brewer?' 
                  : 'Bagaimana cara menentukan profil gilingan kopi yang tepat?'
              }
              answer={
                lang === 'ja'
                  ? '全豆（Whole Beans）のほか、粗挽き（Cold Brew / フレンチプレス）、中挽き（V60 / ハンドドリップ）、細挽き（エスプレッソ / モカポット）をご用意しています。チェックアウト画面にて器具の詳細なご指定も可能です。'
                  : lang === 'en'
                  ? 'We offer Whole Beans, Coarse (Cold Brew & French Press), Medium (V60, Kalita, Aeropress), and Fine (Espresso & Moka Pot). Custom grinder calibration notes can also be entered during checkout.'
                  : 'Kami menyediakan Biji Utuh (Whole Beans), Giling Kasar (Cold Brew & French Press), Giling Sedang (V60, Kalita, Aeropress), dan Giling Halus (Espresso & Mokapot). Anda juga dapat menuliskan catatan alat seduh spesifik saat checkout.'
              }
            />

            <HomeFaqItem 
              question={
                lang === 'ja' 
                  ? 'インドネシア国内および海外発送に対応していますか？' 
                  : lang === 'en' 
                  ? 'Do you ship across Indonesia and internationally?' 
                  : 'Apakah melayani pengiriman ke seluruh Indonesia dan ekspor luar negeri?'
              }
              answer={
                lang === 'ja'
                  ? 'はい、JNE、SiCepat、GoSend（バンドン市内即日）、大口便（J&T CARGO 5kg以上）に対応しています。日本をはじめ海外発送のご相談はWhatsApp窓口にて承っております。'
                  : lang === 'en'
                  ? 'Yes, we ship nationwide using JNE, SiCepat, GoSend (same-day in Bandung), and economical J&T Cargo for bulk orders (5kg+). Worldwide international export is available via WhatsApp concierge.'
                  : 'Ya, kami melayani pengiriman ke seluruh Indonesia via JNE, SiCepat, GoSend (sesama Bandung), dan J&T CARGO ekonomis untuk paket partai besar (minimal 5kg). Untuk pengiriman ekspor internasional, hubungi roaster kami via WhatsApp.'
              }
            />

            <HomeFaqItem 
              question={
                lang === 'ja' 
                  ? '利用可能な公式決済方法は何ですか？' 
                  : lang === 'en' 
                  ? 'What payment methods are supported?' 
                  : 'Metode pembayaran resmi apa saja yang didukung?'
              }
              answer={
                lang === 'ja'
                  ? 'QRIS（GoPay、OVO、ShopeePay、BCA Mobile、Livin Mandiri）およびPT Ramu Roastery Nusantaraの公式銀行口座（BCA・Mandiri）への銀行振込に対応しています。'
                  : lang === 'en'
                  ? 'We support instant QRIS (GoPay, OVO, ShopeePay, BCA Mobile, Livin Mandiri) and direct bank transfers to official PT Ramu Roastery Nusantara corporate accounts (BCA & Mandiri).'
                  : 'Kami mendukung QRIS instan (GoPay, OVO, ShopeePay, BCA Mobile, Livin Mandiri) serta Transfer Bank resmi langsung ke rekening korporat PT Ramu Roastery Nusantara (Bank BCA & Bank Mandiri).'
              }
            />
          </div>

          <div className={styles.homeFaqFooterAction}>
            <Link href="/faq" className={styles.homeFaqSeeAllLink}>
              {lang === 'ja' ? 'すべてのFAQ・ヘルプを見る →' : lang === 'en' ? 'View Full Help Center & FAQ →' : 'Buka Halaman Lengkap Pusat Bantuan & FAQ →'}
            </Link>
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
          FOOTER (Gallery Studio Editorial Footer)
          ==================================================================== */}
      <footer className={styles.footer}>
        <div className="container">
          <div className={styles.footerGrid}>
            <div className={styles.footerBrandCol}>
              <h3>Ramu Roastery Co.</h3>
              <p>
                {lang === 'ja'
                  ? 'バンドン発の職人焙煎所。インドネシア各地の厳選されたスペシャルティコーヒー豆を世界へお届けします。'
                  : lang === 'en'
                  ? 'Specialty coffee roastery based in Bandung, West Java. Curating exceptional Indonesian terroirs with uncompromising craft.'
                  : 'Roastery kopi artisanal terkurasi berbasis di Bandung, Jawa Barat. Menghubungkan potensi terbaik terroir Nusantara dengan standar specialty coffee dunia.'}
              </p>
            </div>

            <div>
              <h4 className={styles.footerColTitle}>
                {lang === 'ja' ? 'ナビゲーション' : lang === 'en' ? 'Navigation' : 'Navigasi'}
              </h4>
              <ul className={styles.footerLinkList}>
                <li><Link href="/catalog">{tr.nav_catalog}</Link></li>
                <li><Link href="/about">{tr.nav_about}</Link></li>
                <li><Link href="/faq">{lang === 'ja' ? 'よくあるご質問 (FAQ)' : lang === 'en' ? 'Help Center & FAQ' : 'Pusat Bantuan & FAQ'}</Link></li>
                <li><Link href="/track">{lang === 'ja' ? '注文追跡' : lang === 'en' ? 'Track Order' : 'Lacak Pengiriman'}</Link></li>
              </ul>
            </div>

            <div>
              <h4 className={styles.footerColTitle}>
                {lang === 'ja' ? 'サービス' : lang === 'en' ? 'Services' : 'Layanan'}
              </h4>
              <ul className={styles.footerLinkList}>
                <li><Link href="/custom-sourcing">{lang === 'ja' ? '業務用卸売 (B2B)' : lang === 'en' ? 'Wholesale Partner' : 'Kemitraan Kedai (B2B)'}</Link></li>
                <li><Link href="/catalog">{lang === 'ja' ? '定期便サブスクリプション' : lang === 'en' ? 'Coffee Subscription' : 'Langganan Sangrai Rutin'}</Link></li>
                <li><Link href="/faq">{lang === 'ja' ? '海外発送・通関' : lang === 'en' ? 'International Export' : 'Pengiriman Ekspor Luar Negeri'}</Link></li>
                <li><Link href="/dashboard/orders">{lang === 'ja' ? '注文履歴' : lang === 'en' ? 'My Orders' : 'Riwayat Pesanan'}</Link></li>
              </ul>
            </div>

            <div>
              <h4 className={styles.footerColTitle}>
                {lang === 'ja' ? '焙煎拠点' : lang === 'en' ? 'Roasting Hub' : 'Roastery Hub'}
              </h4>
              <p className={styles.footerContactText}>
                Kota Bandung, Jawa Barat<br />
                {lang === 'ja' ? '月〜土: 09:00〜17:00 WIB' : lang === 'en' ? 'Mon – Sat: 09:00 – 17:00 WIB' : 'Senin – Sabtu: 09:00 – 17:00 WIB'}<br />
                {lang === 'ja' ? '焙煎日: 月曜 & 木曜' : lang === 'en' ? 'Roast Batches: Mon & Thu' : 'Batch Sangrai: Senin & Kamis'}
              </p>
              <ul className={styles.footerLinkList}>
                <li>
                  <a href="https://wa.me/6281221341" target="_blank" rel="noopener noreferrer">
                    WhatsApp: +62 812-2134-1
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className={styles.footerBottom}>
            <div className={styles.footerCopyText}>
              {tr.footer_copy}
            </div>
            <div className={styles.footerPaymentSec}>
              <span>SSL 256-Bit Encrypted</span>
              <span className={styles.footerSep}>·</span>
              <span>iPay88 Official Gateway</span>
              <span className={styles.footerSep}>·</span>
              <span>BCA & Mandiri Verified</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
