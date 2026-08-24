"use client";

import { useLang } from "../../context/LanguageContext";
import { useCart } from "../../context/CartContext";
import Link from "next/link";
import { t } from "../../data/translations";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const { lang, toggleLang } = useLang();
  const { cartCount, setIsCartOpen } = useCart();
  const tr = t[lang];

  return (
    <nav className={styles.navbar}>
      <div className={`container ${styles.navInner}`}>
        {/* Logo / Brand */}
        <Link href="/" className={styles.brand}>
          <span className={styles.brandName}>Ramu</span>
          <span className={styles.brandSub}>Roastery Co.</span>
        </Link>

        {/* Links */}
        <ul className={styles.navLinks}>
          <li><Link href="/catalog">{tr.nav_catalog}</Link></li>
          <li><Link href="/b2b-sample">{tr.nav_b2b}</Link></li>
          <li><Link href="#journey">{tr.nav_about}</Link></li>
        </ul>

        {/* Right Controls */}
        <div className={styles.rightControls}>
          {/* Cart Toggle */}
          <button 
            className={styles.cartBtn} 
            onClick={() => setIsCartOpen(true)}
            aria-label="Open cart"
          >
            <svg className={styles.cartIcon} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 20C9 21.1 8.1 22 7 22C5.9 22 5 21.1 5 20C5 18.9 5.9 18 7 18C8.1 18 9 18.9 9 20ZM20 20C20 21.1 19.1 22 18 22C16.9 22 16 21.1 16 20C16 18.9 16.9 18 18 18C19.1 18 20 18.9 20 20ZM7.2 13.8L7.1 14H19V16H7C5.9 16 5 15.1 5 14L5.3 12.5L2.5 2H1V0H4L4.7 2.5L5.6 6H21.5C22.3 6 23 6.7 23 7.5C23 7.7 22.9 8 22.8 8.2L19.4 13.6C18.9 14.4 18.1 14.9 17.2 14.9H8.5L7.2 13.8Z" fill="currentColor" stroke="none" />
            </svg>
            {cartCount > 0 && (
              <span className={styles.cartBadge}>{cartCount}</span>
            )}
          </button>

          {/* Language Toggle */}
          <button
            id="lang-toggle-btn"
            className={styles.langToggle}
            onClick={toggleLang}
            aria-label="Switch language"
          >
            <span className={lang === "id" ? styles.activeLang : styles.inactiveLang}>ID</span>
            <span className={styles.divider}>/</span>
            <span className={lang === "en" ? styles.activeLang : styles.inactiveLang}>EN</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
