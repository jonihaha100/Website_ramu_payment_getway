/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../context/AuthContext";
import { useWishlist } from "../../../context/WishlistContext";
import { useLang } from "../../../context/LanguageContext";
import { t } from "../../../data/translations";
import { coffees, getLocalizedCoffee } from "../../../data/coffees";
import styles from "../dashboard.module.css";

export default function WishlistPage() {
  const { user, isLoading } = useAuth();
  const { wishlist, toggleWishlist } = useWishlist();
  const router = useRouter();
  const { lang } = useLang();
  const tr = t[lang];

  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [isProductsLoading, setIsProductsLoading] = useState(true);

  // Authentication Guard
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login?callbackUrl=/dashboard/wishlist");
    }
  }, [user, isLoading, router]);

  // Fetch all products to match with wishlist
  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        setAllProducts(data);
        setIsProductsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsProductsLoading(false);
      });
  }, []);

  if (isLoading || isProductsLoading || !user) {
    return <div style={{ padding: "4rem", textAlign: "center" }}>{tr.dash_wishlist_loading}</div>;
  }

  // Get full coffee objects from the wishlist IDs
  const savedCoffees = wishlist
    .map(id => allProducts.find(c => c.id === id))
    .filter(Boolean);

  const getProductImage = (id: string) => {
    const coffee = allProducts.find(c => c.id === id);
    if (coffee?.imageUrl) return coffee.imageUrl;
    switch (id) {
      case "signature-blend":
      case "house-blend-espresso":
        return "/images/signature_blend.jpg";
      case "gayo-natural": return "/images/gayo_natural.jpg";
      case "java-preanger-honey": return "/images/java_preanger.jpg";
      case "bali-kintamani": return "/images/bali_kintamani.jpg";
      case "toraja-sapan":
      case "toraja-anaerobic":
        return "/images/toraja_sapan.jpg";
      case "lampung-robusta":
      case "commercial-blend":
        return "/images/lampung_robusta.jpg";
      default: return null;
    }
  };

  return (
    <div className={styles.mainContent}>
      <h1 className={styles.sectionTitle}>{tr.dash_wishlist_title}</h1>

      {savedCoffees.length === 0 ? (
        <div className={styles.emptyState}>
          <h3>{tr.dash_wishlist_empty}</h3>
          <p>{tr.dash_wishlist_empty_sub}</p>
          <Link href="/catalog" className="btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>
            {tr.dash_wishlist_btn_cat}
          </Link>
        </div>
      ) : (
        <div className={styles.wishlistGrid}>
          {savedCoffees.map(rawCoffee => {
            const coffee = getLocalizedCoffee(rawCoffee, lang);
            const imgSrc = getProductImage(coffee.id);
            return (
              <div key={coffee.id} className={styles.wishlistCard}>
                <Link href={`/product/${coffee.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                  <div className={styles.wishlistImage}>
                    {imgSrc ? (
                      <img src={imgSrc} alt={coffee.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#eee', fontSize: '1.5rem' }}>☕</div>
                    )}
                  </div>
                  <div className={styles.wishlistContent}>
                    <h3>{coffee.name}</h3>
                    <p>{coffee.category}</p>
                  </div>
                </Link>
                <div className={styles.wishlistActions}>
                  <button 
                    className={styles.btnRemove}
                    onClick={(e) => {
                      e.preventDefault();
                      toggleWishlist(coffee.id, coffee.name);
                    }}

                  >
                    {tr.dash_wishlist_remove}
                  </button>
                  <Link 
                    href={`/product/${coffee.id}`} 
                    className="btn-primary" 
                    style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem', textAlign: 'center' }}
                  >
                    {tr.dash_wishlist_detail}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
