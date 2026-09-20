"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLang } from "../../context/LanguageContext";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { useAuth } from "../../context/AuthContext";
import styles from "./BottomNav.module.css";

export default function BottomNav() {
  const pathname = usePathname();
  const { lang } = useLang();
  const { cartCount, setIsCartOpen } = useCart();
  const { wishlistCount } = useWishlist();
  const { user } = useAuth();

  // Hide on admin panel routes
  if (pathname.startsWith("/admin")) {
    return null;
  }

  const isHome = pathname === "/";
  const isCatalog = pathname.startsWith("/catalog") || pathname.startsWith("/product");
  const isWishlist = pathname.startsWith("/dashboard/wishlist");
  const isAccount = (pathname.startsWith("/dashboard") && !isWishlist) || pathname.startsWith("/login");

  const labels = {
    home: lang === "ja" ? "ホーム" : lang === "en" ? "Home" : "Beranda",
    catalog: lang === "ja" ? "カタログ" : lang === "en" ? "Catalog" : "Katalog",
    wishlist: lang === "ja" ? "お気に入り" : lang === "en" ? "Wishlist" : "Wishlist",
    cart: lang === "ja" ? "カート" : lang === "en" ? "Cart" : "Keranjang",
    account: lang === "ja" ? "マイページ" : lang === "en" ? "Account" : "Akun",
  };

  return (
    <nav className={styles.bottomNav} aria-label="Quick Mobile Navigation">
      {/* 1. Beranda */}
      <Link 
        href="/" 
        className={`${styles.navItem} ${isHome ? styles.activeItem : ""}`}
        title={labels.home}
      >
        <div className={styles.iconWrapper}>
          <svg className={styles.icon} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V10" />
          </svg>
        </div>
        <span className={styles.label}>{labels.home}</span>
        {isHome && <span className={styles.activeIndicator} />}
      </Link>

      {/* 2. Katalog */}
      <Link 
        href="/catalog" 
        className={`${styles.navItem} ${isCatalog ? styles.activeItem : ""} tour-nav-catalog`}
        title={labels.catalog}
      >
        <div className={styles.iconWrapper}>
          <svg className={styles.icon} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        </div>
        <span className={styles.label}>{labels.catalog}</span>
        {isCatalog && <span className={styles.activeIndicator} />}
      </Link>

      {/* 3. Wishlist */}
      <Link 
        href="/dashboard/wishlist" 
        className={`${styles.navItem} ${isWishlist ? styles.activeItem : ""}`}
        title={labels.wishlist}
      >
        <div className={styles.iconWrapper}>
          <svg 
            className={styles.icon} 
            viewBox="0 0 24 24" 
            fill={isWishlist ? "#ef4444" : "none"}
            stroke={isWishlist ? "#ef4444" : "currentColor"}
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
            />
          </svg>
          {wishlistCount > 0 && (
            <span className={styles.badge}>{wishlistCount > 99 ? '99+' : wishlistCount}</span>
          )}
        </div>
        <span className={styles.label}>{labels.wishlist}</span>
        {isWishlist && <span className={styles.activeIndicator} />}
      </Link>

      {/* 4. Keranjang (Quick Open Drawer) */}
      <button 
        type="button"
        onClick={() => setIsCartOpen(true)} 
        className={`${styles.navItem} tour-nav-cart`}
        title={labels.cart}
      >
        <div className={styles.iconWrapper}>
          <svg className={styles.icon} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          {cartCount > 0 && (
            <span className={`${styles.badge} ${styles.badgeAmber}`}>{cartCount > 99 ? '99+' : cartCount}</span>
          )}
        </div>
        <span className={styles.label}>{labels.cart}</span>
      </button>

      {/* 5. Akun / Dashboard */}
      <Link 
        href={user ? "/dashboard" : "/login?callbackUrl=/dashboard"} 
        className={`${styles.navItem} ${isAccount ? styles.activeItem : ""} tour-nav-user`}
        title={labels.account}
      >
        <div className={styles.iconWrapper}>
          <svg className={styles.icon} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <span className={styles.label}>{labels.account}</span>
        {isAccount && <span className={styles.activeIndicator} />}
      </Link>
    </nav>
  );
}
