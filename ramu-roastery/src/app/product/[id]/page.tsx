/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { coffees as defaultCoffees, Coffee, getLocalizedCoffee } from "../../../data/coffees";
import { useCart } from "../../../context/CartContext";
import { useWishlist } from "../../../context/WishlistContext";
import { useAuth } from "../../../context/AuthContext";
import { Review, mockReviews } from "../../../data/mockReviews";
import { useLang } from "../../../context/LanguageContext";
import { t } from "../../../data/translations";
import { useToast } from "../../../context/ToastContext";
import styles from "./ProductDetail.module.css";

export default function ProductDetail() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const initialCoffee = defaultCoffees.find(c => c.id === id) || null;
  const [coffee, setCoffee] = useState<Coffee | null>(initialCoffee);
  const [isLoading, setIsLoading] = useState(!initialCoffee);
  const [localReviews, setLocalReviews] = useState<Review[]>(mockReviews.filter(r => r.productId === id));
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const { lang } = useLang();
  const tr = t[lang];
  const [reviewPhotos, setReviewPhotos] = useState<string[]>([]);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const { user } = useAuth();
  const [hasPurchased, setHasPurchased] = useState(false);

  useEffect(() => {
    // Fetch product details
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        const found = data.find((c: Coffee) => c.id === id);
        setCoffee(found || null);
        if (found) {
          const sizes = found.sizes || (found.category === 'Filter' ? [150, 250] : [250, 500, 1000]);
          setWeight(sizes[0]);
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });

    // Fetch reviews
    fetch('/api/reviews')
      .then(res => res.json())
      .then((data: Review[]) => {
        if (Array.isArray(data)) {
          setLocalReviews(data.filter(r => r.productId === id));
        } else {
          setLocalReviews([]);
        }
      })
      .catch(err => console.error("Failed to fetch reviews", err));

    // Check if user has purchased this item
    if (user?.email) {
      fetch('/api/orders')
        .then(res => res.json())
        .then(orders => {
          const purchased = orders.some((order: any) => 
            order.customerEmail === user.email && 
            (order.status === 'Delivered' || order.status === 'Completed' || order.status === 'Selesai' || order.status === 'Terkirim') &&
            order.items.some((item: any) => {
              const itemId = item.productId || item.id || "";
              return itemId.includes(id);
            })
          );
          setHasPurchased(purchased);
        })
        .catch(err => console.error("Failed to fetch orders", err));
    }
  }, [id, user]);
  const { addToCart, setIsCartOpen } = useCart();
  const { addToast } = useToast();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const handleWishlistClick = () => {
    const coffeeName = initialCoffee?.name || id;
    if (!user) {
      toggleWishlist(id, coffeeName);
      router.push(`/login?callbackUrl=/product/${id}`);
      return;
    }
    toggleWishlist(id, coffeeName);
  };

  const initialWeight = initialCoffee?.sizes?.[0] || (initialCoffee?.category === 'Filter' ? 150 : 250);
  const [weight, setWeight] = useState<number>(initialWeight);
  const [grind, setGrind] = useState<string>(tr.grind_whole || "Biji Utuh");
  const [purchaseMode, setPurchaseMode] = useState<"onetime"|"subscribe">("onetime");
  const [frequency, setFrequency] = useState<string>("1_WEEK");
  const [deliveriesTotal, setDeliveriesTotal] = useState<number>(4);
  const [quantity, setQuantity] = useState<number>(1);

  // Sync grind default if language translates
  useEffect(() => {
    if (!grind || grind === "Whole Beans" || grind === "Biji Utuh") {
      setGrind(tr.grind_whole);
    }
  }, [tr.grind_whole]);

  if (isLoading) {
    return (
      <div className="container section text-center">
        <h2>{tr.pd_loading}</h2>
      </div>
    );
  }

  if (!coffee) {
    return (
      <div className="container section text-center">
        <h1>{tr.pd_not_found}</h1>
        <Link href="/catalog" className="btn-primary" style={{marginTop: '2rem'}}>{tr.back_catalog}</Link>
      </div>
    );
  }

  const displayCoffee = getLocalizedCoffee(coffee, lang);

  // Calculate price based on size prices or pricePerKg
  const unitPrice = (coffee.prices && coffee.prices[weight])
    ? coffee.prices[weight]
    : Math.round((coffee.pricePerKg / 1000) * weight);
  const basePrice = unitPrice * quantity;

  // Harmonize stock logic with Product Management (batch roastery in grams/kg)
  const currentWeight = weight || (coffee.sizes?.[0] || 250);
  const availablePacks = Math.max(0, Math.floor(coffee.stock / currentWeight));
  const stockInKg = coffee.stock >= 1000 ? `${(coffee.stock / 1000).toFixed(1)} kg` : `${coffee.stock} g`;

  // For pre-paid subscription: 4x deliveries = 10% discount (0.9), 12x deliveries = 15% discount (0.85)
  const subDiscountRate = deliveriesTotal >= 12 ? 0.85 : 0.9;
  const totalPrice = purchaseMode === "subscribe" ? Math.round((basePrice * deliveriesTotal) * subDiscountRate) : basePrice;

  const avgRating = localReviews.length > 0 
      ? (localReviews.reduce((sum, r) => sum + r.rating, 0) / localReviews.length).toFixed(1)
      : 0;

  const handleAddToCart = () => {
    addToCart({
      id: `${coffee.id}-${grind}-${weight}-${purchaseMode === "subscribe" ? "sub-" + frequency : "one"}`,
      productId: coffee.id,
      name: displayCoffee.name,
      price: totalPrice / quantity,
      quantity: quantity,
      weight,
      grind,
      isSubscription: purchaseMode === "subscribe",
      frequency: purchaseMode === "subscribe" ? frequency : undefined,
      deliveriesTotal: purchaseMode === "subscribe" ? deliveriesTotal : undefined,
    });
    const toastMsg = lang === 'ja'
      ? `${displayCoffee.name} をカートに追加しました！`
      : (lang === 'en'
        ? `${displayCoffee.name} added to cart!`
        : `${displayCoffee.name} ditambahkan ke keranjang!`);
    addToast(toastMsg, 'success');
  };

  const handleBuyNow = () => {
    handleAddToCart();
    // Do not open cart sidebar for direct buy
    router.push("/checkout");
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push(`/login?callbackUrl=/product/${id}`);
      return;
    }
    setIsSubmittingReview(true);
    
    const newReview: Review = {
      id: `REV-NEW-${Date.now()}`,
      orderId: `ORD-${Date.now()}`,
      productId: id,
      productName: coffee.name,
      customerName: user.name,
      rating: reviewRating,
      comment: reviewComment,
      date: new Date().toISOString(),
      status: 'Published',
      variant: `${tr.pd_review_buy_label}${weight >= 1000 ? weight/1000 + 'kg' : weight + 'g'} - ${grind}`,
      photos: reviewPhotos.length > 0 ? reviewPhotos : undefined
    };

    fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newReview)
    })
    .then(res => {
      if (res.ok) {
        setLocalReviews([newReview, ...localReviews]);
        setReviewComment("");
        setReviewRating(5);
        setReviewPhotos([]);
        addToast(
          lang === 'ja'
            ? "レビューが投稿されました。ありがとうございます！"
            : (lang === 'en'
              ? "Review submitted successfully. Thank you!"
              : "Ulasan berhasil dikirim. Terima kasih!"),
          "success"
        );
      } else {
        addToast(
          lang === 'ja'
            ? "レビューの送信に失敗しました。"
            : (lang === 'en'
              ? "Failed to submit review."
              : "Gagal mengirim ulasan."),
          "error"
        );
      }
    })
    .catch(err => {
      addToast(
        lang === 'ja'
          ? "システムエラーが発生しました。"
          : (lang === 'en'
            ? "A system error occurred."
            : "Terjadi kesalahan sistem."),
        "error"
      );
    })
    .finally(() => {
      setIsSubmittingReview(false);
    });
  };

  // WhatsApp Generator (Optional, keep for alternative)
  const waNumber = "6280000000000"; // Placeholder
  const waMessage = `Halo Ramu Roastery! Saya ingin memesan kopi:%0A%0A*${coffee.name}*%0AUkuran: ${weight >= 1000 ? weight/1000 + 'kg' : weight + 'g'}%0AProfil Gilingan: ${grind}%0ATotal Harga: Rp ${totalPrice.toLocaleString('id-ID')}%0A%0AMohon info ketersediaan dan ongkos kirim. Terima kasih!`;
  const waLink = `https://wa.me/${waNumber}?text=${waMessage}`;

  return (
    <main className={styles.productPage}>
      <div className="container">
        <Link href="/catalog" className={styles.backLink}>{tr.back_catalog}</Link>
        
        <div className={styles.grid}>
          {/* Image Placeholder */}
          <div className={styles.imageGallery}>
            <div className={`${styles.mainImage} glass`} style={{ padding: 0, overflow: 'hidden' }}>
              {coffee.imageUrl ? (
                <img src={coffee.imageUrl} alt={coffee.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>{coffee.name} Image</span>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className={styles.details}>
            <div className={styles.header}>
              <span className={styles.categoryBadge}>{displayCoffee.category}</span>
              <h1 className={styles.title}>{displayCoffee.name}</h1>
              {localReviews.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#fbbf24', fontSize: '1.25rem' }}>★ {avgRating}</span>
                  <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>({localReviews.length} {tr.pd_reviews_count})</span>
                </div>
              )}
              <p className={styles.origin}>{displayCoffee.origin} • {displayCoffee.process}</p>
            </div>

            <p className={styles.price}>Rp {totalPrice.toLocaleString('id-ID')}</p>

            <p className={styles.description}>{displayCoffee.description}</p>

            <div className={styles.tastingNotes}>
              <h4>{tr.tasting_notes}</h4>
              <div className={styles.tags}>
                {displayCoffee.tastingNotes.map(note => (
                  <span key={note} className={styles.noteTag}>{note}</span>
                ))}
              </div>
            </div>

            {/* Customization Options */}
            <div className={styles.optionsSection}>
              <h4>{tr.size_label}</h4>
              <div className={styles.optionGrid}>
                {(coffee.sizes || (coffee.category === 'Filter' ? [150, 250] : [250, 500, 1000])).map(w => (
                  <button 
                    key={w}
                    className={weight === w ? styles.optionBtnActive : styles.optionBtn}
                    onClick={() => setWeight(w)}
                  >
                    {w >= 1000 ? w/1000 + ' kg' : w + ' g'}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.optionsSection}>
              <h4>{tr.grind_label}</h4>
              <div className={styles.optionGrid}>
                {[tr.grind_whole, tr.grind_coarse, tr.grind_medium, tr.grind_fine].map(g => (
                  <button 
                    key={g}
                    className={grind === g ? styles.optionBtnActive : styles.optionBtn}
                    onClick={() => setGrind(g)}
                  >
                    {g}
                  </button>
                ))}
              </div>
              <div style={{
                marginTop: '0.6rem',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                background: 'rgba(217, 119, 6, 0.08)',
                border: '1px solid rgba(217, 119, 6, 0.22)',
                fontSize: '0.78rem',
                color: '#d97706',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                lineHeight: 1.4
              }}>
                <span>💡</span>
                <span>
                  {grind === tr.grind_whole ? (
                    lang === 'ja' ? (
                      <><strong>ロースタリー推奨:</strong> 豆のまま（Whole Beans）でお届けすると、最大3ヶ月間最高の風味とアロマを保てます。抽出の直前に挽くのがおすすめです！</>
                    ) : lang === 'en' ? (
                      <><strong>Roastery Recommendation:</strong> Whole Beans preserve optimal flavor & aroma for up to 3 months. Grind just before brewing!</>
                    ) : (
                      <><strong>Rekomendasi Roastery:</strong> Biji Utuh (Whole Beans) menjaga kesegaran rasa & aroma maksimal hingga 3 bulan. Giling sesaat sebelum seduh!</>
                    )
                  ) : (
                    lang === 'ja' ? (
                      <><strong>挽き目のヒント:</strong> すぐに淹れられる粉の状態です。最高の香りをお楽しみいただくため、3〜4週間以内にお召し上がりいただくことを推奨します。</>
                    ) : lang === 'en' ? (
                      <><strong>Grind Tip:</strong> Ground coffee ready to brew. Best enjoyed within 3–4 weeks for optimal aromatic notes.</>
                    ) : (
                      <><strong>Tips Gilingan:</strong> Kopi bubuk siap seduh. Disarankan dihabiskan dalam 3–4 minggu untuk menikmati profil aroma terbaik.</>
                    )
                  )}
                </span>
              </div>
            </div>

            {/* Purchase Mode */}
            <div className={styles.optionsSection}>
              <h4>{tr.pd_purchase_type || "Tipe Pembelian"}</h4>
              <div className={styles.optionGrid}>
                <button
                  className={purchaseMode === 'onetime' ? styles.optionBtnActive : styles.optionBtn}
                  onClick={() => setPurchaseMode('onetime')}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', height: 'auto', padding: '0.75rem' }}
                >
                  <span style={{ fontWeight: 600 }}>{tr.pd_buy_onetime || "Beli Sekali"}</span>
                  <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>Rp {basePrice.toLocaleString('id-ID')}</span>
                </button>
                <button
                  className={purchaseMode === 'subscribe' ? styles.optionBtnActive : styles.optionBtn}
                  onClick={() => setPurchaseMode('subscribe')}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', height: 'auto', padding: '0.75rem' }}
                >
                  <span style={{ fontWeight: 600 }}>{tr.pd_prepaid_pkg || "Paket Prabayar (-10%)"}</span>
                  <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>{tr.pd_pay_upfront || "Bayar Penuh di Muka"}</span>
                </button>
              </div>
            </div>

            {purchaseMode === 'subscribe' && (
              <>
                <div className={styles.optionsSection}>
                  <h4>{tr.pd_select_pkg || "Pilih Paket Pengiriman"}</h4>
                  <div className={styles.optionGrid}>
                    {[
                      { val: 4, label: tr.pd_pkg_4x || "4x Kirim", desc: tr.pd_pkg_4x_desc || "Langganan 1 Bulan" },
                      { val: 12, label: tr.pd_pkg_12x || "12x Kirim", desc: tr.pd_pkg_12x_desc || "Langganan 3 Bulan" }
                    ].map(pkg => (
                      <button 
                        key={pkg.val}
                        className={deliveriesTotal === pkg.val ? styles.optionBtnActive : styles.optionBtn}
                        onClick={() => setDeliveriesTotal(pkg.val)}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', height: 'auto', padding: '0.75rem' }}
                      >
                        <span style={{ fontWeight: 600 }}>{pkg.label}</span>
                        <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>{pkg.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.optionsSection}>
                  <h4>{tr.pd_delivery_freq || "Frekuensi Pengiriman"}</h4>
                  <div className={styles.optionGrid}>
                    {[
                      { val: "1_WEEK", label: tr.pd_freq_1w || "Tiap 1 Minggu" },
                      { val: "2_WEEKS", label: tr.pd_freq_2w || "Tiap 2 Minggu" },
                      { val: "1_MONTH", label: tr.pd_freq_1m || "Tiap 1 Bulan" }
                    ].map(f => (
                      <button 
                        key={f.val}
                        className={frequency === f.val ? styles.optionBtnActive : styles.optionBtn}
                        onClick={() => setFrequency(f.val)}
                        style={{ padding: '0.75rem' }}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Quantity Selector */}
            <div className={styles.optionsSection}>
              <h4>{tr.pd_quantity || "Kuantitas"}</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #d1d5db', borderRadius: '0.25rem', overflow: 'hidden' }}>
                  <button 
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    style={{ padding: '0.5rem 1rem', background: '#f9fafb', border: 'none', cursor: 'pointer', borderRight: '1px solid #d1d5db' }}
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <span style={{ padding: '0.5rem 1.5rem', fontWeight: 600 }}>{quantity}</span>
                  <button 
                    onClick={() => setQuantity(q => Math.min(availablePacks, q + 1))}
                    style={{ padding: '0.5rem 1rem', background: '#f9fafb', border: 'none', cursor: 'pointer', borderLeft: '1px solid #d1d5db' }}
                    disabled={quantity >= availablePacks || availablePacks === 0}
                  >
                    +
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.875rem', color: availablePacks > 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                    {availablePacks > 0 
                      ? (lang === 'ja'
                          ? `在庫あり: ${stockInKg} (約${availablePacks}パック @${currentWeight >= 1000 ? (currentWeight/1000) + 'kg' : currentWeight + 'g'})`
                          : (lang === 'en'
                            ? `Available: ${stockInKg} (~${availablePacks} packs @${currentWeight >= 1000 ? (currentWeight/1000) + 'kg' : currentWeight + 'g'})`
                            : `Tersedia: ${stockInKg} (~${availablePacks} kemasan @${currentWeight >= 1000 ? (currentWeight/1000) + 'kg' : currentWeight + 'g'})`))
                      : (lang === 'ja'
                          ? `品切れ (@${currentWeight >= 1000 ? (currentWeight/1000) + 'kg' : currentWeight + 'g'}、残りバッチ: ${stockInKg})`
                          : (lang === 'en'
                            ? `Out of stock for ${currentWeight >= 1000 ? (currentWeight/1000) + 'kg' : currentWeight + 'g'} (Remaining batch: ${stockInKg})`
                            : `Stok Habis untuk kemasan ${currentWeight >= 1000 ? (currentWeight/1000) + 'kg' : currentWeight + 'g'} (Sisa batch: ${stockInKg})`))
                    }
                  </span>
                  <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>
                    {lang === 'ja'
                      ? '*ロースタリーの新鮮な焙煎バッチより計量・フレッシュパックしてお届けします'
                      : (lang === 'en'
                        ? '*Weighed & freshly packaged from roastery fresh batches'
                        : '*Ditimbang & disangrai segar dari stok batch roastery')}
                  </span>
                </div>
              </div>
            </div>

            {/* Checkout Actions */}
            <div className={styles.checkoutActions} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
                <button className="btn-outline" style={{ flex: 1 }} onClick={handleAddToCart} disabled={availablePacks < 1}>
                  {availablePacks < 1 ? (lang === 'ja' ? '売り切れ' : (lang === 'en' ? 'Out of Stock' : 'Stok Habis')) : tr.pd_add_cart}
                </button>
                <button className="btn-primary" style={{ flex: 1 }} onClick={handleBuyNow} disabled={availablePacks < 1}>
                  {availablePacks < 1 ? (lang === 'ja' ? '売り切れ' : (lang === 'en' ? 'Out of Stock' : 'Stok Habis')) : tr.pd_buy_now}
                </button>
              </div>
              
              <button 
                onClick={handleWishlistClick}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '0.5rem', 
                  padding: '0.75rem', 
                  background: 'transparent', 
                  border: `1px solid ${isInWishlist(id) ? '#ef4444' : 'var(--text-secondary)'}`, 
                  color: isInWishlist(id) ? '#ef4444' : 'var(--text-primary)', 
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  fontWeight: 500,
                  transition: 'all 0.2s ease'
                }}
              >
                {isInWishlist(id) ? (
                  <>
                    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                    {tr.pd_wishlist_saved}
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                    {tr.pd_wishlist_add}
                  </>
                )}
              </button>

              <a href={waLink} target="_blank" rel="noopener noreferrer" style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)', textDecoration: 'underline', marginTop: '0.5rem' }}>
                {tr.pd_wa_or}
              </a>
            </div>
          </div>
        </div>

        {/* CUSTOMER REVIEWS SECTION */}
        <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid #e5e7eb' }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#111827' }}>{tr.pd_review_title}</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Form Tulis Ulasan (Dihapus agar user hanya bisa review dari Dashboard) */}

            {localReviews.length > 0 ? (
              localReviews.map(review => (
                <div key={review.id} style={{ backgroundColor: '#f9fafb', padding: '1.5rem', borderRadius: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#111827' }}>{review.customerName}</div>
                      <div style={{ color: '#fbbf24', fontSize: '1rem', marginTop: '0.25rem' }}>
                        {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                      </div>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      {new Date((review as any).createdAt || review.date).toLocaleString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }).replace(/\./g, ':')} WIB
                    </span>
                  </div>
                  
                  {review.variant && (
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem', padding: '0.25rem 0.5rem', backgroundColor: '#e5e7eb', display: 'inline-block', borderRadius: '0.25rem' }}>
                      {review.variant}
                    </div>
                  )}
                  
                  <p style={{ color: '#374151', fontSize: '0.875rem', lineHeight: '1.5', marginTop: '0.5rem' }}>
                    {review.comment}
                  </p>

                  {(review.photos || review.videos) && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                      {review.photos?.map((photo, idx) => (
                        <img key={idx} src={photo} alt="Review Media" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }} />
                      ))}
                      {review.videos?.map((video, idx) => (
                        <video key={idx} src={video} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }} controls />
                      ))}
                    </div>
                  )}

                  {review.reply && (
                    <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#eff6ff', borderRadius: '0.5rem', borderLeft: '3px solid #3b82f6' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#1d4ed8', marginBottom: '0.25rem' }}>
                        {tr.pd_review_admin_reply}
                      </div>
                      <p style={{ margin: 0, fontSize: '0.875rem', color: '#1e3a8a' }}>{review.reply}</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', color: '#6b7280', padding: '2rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem' }}>
                {tr.pd_review_empty}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Mobile Sticky Quick Action Bar */}
      <div className={styles.mobileStickyBottom}>
        <div className={styles.stickyPriceBox}>
          <span className={styles.stickyPriceLabel}>{lang === 'ja' ? '合計' : (lang === 'en' ? 'Total' : 'Total')}</span>
          <span className={styles.stickyPriceVal}>Rp {totalPrice.toLocaleString("id-ID")}</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flex: 1 }}>
          <button 
            className="btn-outline" 
            style={{ flex: 1, padding: '0.65rem 0.5rem', fontSize: '0.85rem' }} 
            onClick={handleAddToCart}
            disabled={availablePacks < 1}
          >
            {availablePacks < 1 ? (lang === 'ja' ? '売り切れ' : (lang === 'en' ? 'Out of Stock' : 'Stok Habis')) : tr.pd_add_cart}
          </button>
          <button 
            className="btn-primary" 
            style={{ flex: 1.2, padding: '0.65rem 0.5rem', fontSize: '0.85rem' }} 
            onClick={handleBuyNow}
            disabled={availablePacks < 1}
          >
            {availablePacks < 1 ? (lang === 'ja' ? '売り切れ' : (lang === 'en' ? 'Out of Stock' : 'Stok Habis')) : tr.pd_buy_now}
          </button>
        </div>
      </div>
    </main>
  );
}
