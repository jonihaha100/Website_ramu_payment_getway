/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { coffees as defaultCoffees, Coffee, getLocalizedCoffee } from "../../data/coffees";
import { Review, mockReviews } from "../../data/mockReviews";
import { useLang } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { useWishlist } from "../../context/WishlistContext";
import { useCart } from "../../context/CartContext";
import { useToast } from "../../context/ToastContext";
import { t } from "../../data/translations";
import styles from "./Catalog.module.css";

export default function Catalog() {
  const { lang } = useLang();
  const tr = t[lang];
  
  const { user } = useAuth();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToCart, setIsCartOpen } = useCart();
  const { addToast } = useToast();
  const router = useRouter();

  // Instant 0ms Load: Initialize with defaultCoffees so catalog never has blank waiting time
  const [coffees, setCoffees] = useState<Coffee[]>(defaultCoffees);
  const [reviews, setReviews] = useState<Review[]>(mockReviews);
  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [filterProcess, setFilterProcess] = useState<string>("All");

  useEffect(() => {
    // Non-blocking background sync for fresh stock
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setCoffees(data);
        }
      })
      .catch(() => {});

    // Non-blocking background sync for reviews
    fetch('/api/reviews')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setReviews(data);
        }
      })
      .catch(() => {});
  }, []);

  const handleWishlistClick = (e: React.MouseEvent, coffeeId: string, coffeeName: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toggleWishlist(coffeeId, coffeeName);
      router.push("/login?callbackUrl=/catalog");
      return;
    }
    toggleWishlist(coffeeId, coffeeName);
  };

  const handleQuickAdd = (e: React.MouseEvent, coffee: Coffee) => {
    e.preventDefault();
    e.stopPropagation();
    const weight = coffee.sizes?.[0] || (coffee.category === 'Filter' ? 150 : 250);
    const price = coffee.prices?.[weight] || ((coffee.pricePerKg / 1000) * weight);
    addToCart({
      id: `${coffee.id}-Whole Beans-${weight}`,
      productId: coffee.id,
      name: coffee.name,
      price: price,
      quantity: 1,
      weight: weight,
      grind: "Whole Beans",
      image: coffee.imageUrl,
    });
    addToast(
      lang === 'ja'
        ? `🛒 ${coffee.name} をカートに追加しました！`
        : lang === 'en'
        ? `🛒 ${coffee.name} added to cart!`
        : `🛒 ${coffee.name} ditambahkan ke keranjang!`,
      'success'
    );
  };

  const handleQuickBuy = (e: React.MouseEvent, coffee: Coffee) => {
    e.preventDefault();
    e.stopPropagation();
    handleQuickAdd(e, coffee);
    router.push("/checkout");
  };


  const filteredCoffees = coffees.filter((coffee) => {
    const categoryMatch = filterCategory === "All" || coffee.category === filterCategory;
    const processMatch = filterProcess === "All" || coffee.process === filterProcess;
    return categoryMatch && processMatch;
  });

  return (
    <main className={styles.catalogPage}>
      <div className="container">
        <header className={styles.header}>
          <h1>{tr.catalog_title}</h1>
          <p>{tr.catalog_sub}</p>
        </header>

        <div className={styles.layout}>
          {/* Sidebar Filters */}
          <aside className={styles.sidebar}>
            <div className={styles.filterGroup}>
              <h3>{tr.filter_category}</h3>
              {[
                { val: "All", label: tr.filter_all_cat },
                { val: "Espresso", label: lang === 'ja' ? "エスプレッソ" : "Espresso" },
                { val: "Filter", label: lang === 'ja' ? "フィルター" : "Filter" }
              ].map((f) => (
                <button
                  key={f.val}
                  className={filterCategory === f.val ? styles.activeFilter : styles.filterBtn}
                  onClick={() => setFilterCategory(f.val)}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className={styles.filterGroup}>
              <h3>{tr.filter_process}</h3>
              {[
                { val: "All", label: tr.filter_all_proc },
                { val: "Wash", label: lang === 'ja' ? "ウォッシュト" : (lang === 'en' ? "Washed" : "Wash") },
                { val: "Natural", label: lang === 'ja' ? "ナチュラル" : "Natural" },
                { val: "Honey", label: lang === 'ja' ? "ハニー" : "Honey" },
                { val: "Anaerobic", label: lang === 'ja' ? "アナエロビック" : "Anaerobic" },
              ].map((f) => (
                <button
                  key={f.val}
                  className={filterProcess === f.val ? styles.activeFilter : styles.filterBtn}
                  onClick={() => setFilterProcess(f.val)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </aside>

          {/* Product Grid */}
          <div className={styles.productGrid}>
            {filteredCoffees.length > 0 ? (
              filteredCoffees.map((rawCoffee) => {
                const coffee = getLocalizedCoffee(rawCoffee, lang);
                return (
                  <div key={coffee.id} className={`${styles.productCard} glass`}>
                    <Link href={`/product/${coffee.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <div className={styles.imagePlaceholder}>
                        {coffee.imageUrl && (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img 
                            src={coffee.imageUrl} 
                            alt={coffee.name} 
                            loading="lazy"
                            decoding="async"
                            style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }} 
                          />
                        )}
                        <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span className={styles.categoryBadge}>{coffee.category}</span>
                          {user?.role === 'b2b' && (
                            <span className={styles.categoryBadge} style={{ backgroundColor: '#10b981', color: 'white', borderColor: '#059669' }}>
                              {lang === 'ja' ? 'B2B 価格' : (lang === 'en' ? 'B2B Price' : 'Harga B2B')}
                            </span>
                          )}
                        </div>
                        <button 
                          type="button"
                          className={styles.wishlistBtn}
                          onClick={(e) => handleWishlistClick(e, coffee.id, coffee.name)}
                          title={isInWishlist(coffee.id) ? tr.pd_wishlist_remove : tr.pd_wishlist_add}
                        >
                          {isInWishlist(coffee.id) ? (
                            <svg viewBox="0 0 24 24" fill="#ef4444" width="24" height="24">
                              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                            </svg>
                          ) : (
                            <svg viewBox="0 0 24 24" fill="rgba(255,255,255,0.8)" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
                              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                          )}
                        </button>
                      </div>
                      <div className={styles.cardContent}>
                        <h2>{coffee.name}</h2>
                        
                        {(() => {
                          const productReviews = reviews.filter(r => r.productId === coffee.id);
                          if (productReviews.length === 0) return null;
                          const avgRating = (productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length).toFixed(1);
                          return (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                              <span style={{ color: '#fbbf24' }}>★</span>
                              <span style={{ fontWeight: 600, color: '#374151' }}>{avgRating}</span>
                              <span style={{ color: '#9ca3af' }}>({productReviews.length})</span>
                            </div>
                          );
                        })()}
                        
                        <p className={styles.origin}>{coffee.origin} • {coffee.process}</p>
                        <div className={styles.tastingNotes}>
                          {coffee.tastingNotes.map((note) => (
                            <span key={note} className={styles.noteTag}>{note}</span>
                          ))}
                        </div>
                        <p className={styles.price}>
                          {user?.role === 'b2b' ? (
                            <>
                              <span style={{ textDecoration: 'line-through', color: '#9ca3af', marginRight: '0.5rem', fontSize: '0.9rem' }}>
                                Rp {coffee.pricePerKg.toLocaleString("id-ID")}
                              </span>
                              <span style={{ color: '#10b981', fontWeight: 'bold' }}>
                                Rp {Math.round(coffee.pricePerKg * 0.8).toLocaleString("id-ID")} {lang === 'ja' ? '/ 1kg' : '/ kg'}
                              </span>
                            </>
                          ) : (
                            coffee.prices ? (
                              `${lang === 'ja' ? 'Rp ' : (lang === 'en' ? 'From Rp ' : 'Mulai Rp ')}${(coffee.prices[coffee.sizes?.[0] || 150] || Math.min(...Object.values(coffee.prices))).toLocaleString("id-ID")}${lang === 'ja' ? ' から' : ''}`
                            ) : (
                              `Rp ${coffee.pricePerKg.toLocaleString("id-ID")} ${lang === 'ja' ? '/ 1kg' : '/ kg'}`
                            )
                          )}
                        </p>
                      </div>
                    </Link>
                    <div className={styles.cardQuickActions}>
                      <button 
                        type="button" 
                        className={styles.btnQuickAdd}
                        onClick={(e) => handleQuickAdd(e, coffee)}
                        title={lang === 'ja' ? 'カートに追加' : lang === 'en' ? 'Add to Cart' : 'Tambah ke Keranjang'}
                      >
                        🛒 {lang === 'ja' ? '+ カート' : lang === 'en' ? '+ Cart' : '+ Keranjang'}
                      </button>
                      <button 
                        type="button" 
                        className="btn-primary"
                        style={{ flex: 1, padding: '0.55rem 0.75rem', fontSize: '0.82rem', borderRadius: '6px' }}
                        onClick={(e) => handleQuickBuy(e, coffee)}
                      >
                        {lang === 'ja' ? '今すぐ購入' : lang === 'en' ? 'Buy Now' : 'Beli Cepat'}
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className={styles.noResults}>
                <p>{tr.no_results}</p>
                <button
                  onClick={() => { setFilterCategory("All"); setFilterProcess("All"); }}
                  className="btn-outline"
                >
                  {tr.clear_filter}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
