"use client";

import { useState, useRef, useEffect } from "react";
import { useLang } from "../../context/LanguageContext";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { t } from "../../data/translations";
import { localizeNotification, formatNotificationDate } from "../../utils/localizeNotification";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { lang, setLang, toggleLang } = useLang();
  const { cartCount, setIsCartOpen } = useCart();
  const { user, logout } = useAuth();
  const tr = t[lang];

  // Mobile Menu State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Notification State
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // User Menu State
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  
  const { addToast } = useToast();

  interface Notification {
    id: string;
    title: string;
    desc: string;
    time: string;
    read: boolean;
    href: string;
  }

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const prevNotifsRef = useRef<Notification[]>([]);
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (user) {
      const fetchNotifications = async () => {
        try {
          const res = await fetch(`/api/notifications?userEmail=${user.email}`);
          if (res.ok) {
            const data = await res.json();
            
            // Tampilkan alert (Toast) jika ada notifikasi baru
            if (prevNotifsRef.current.length > 0) {
              const prevIds = new Set(prevNotifsRef.current.map(n => n.id));
              const newNotifs = data.filter((n: Notification) => !prevIds.has(n.id) && !n.read);
              if (newNotifs.length > 0) {
                const localized = localizeNotification(newNotifs[0].title, newNotifs[0].desc, lang);
                addToast(`🔔 ${localized.title}: ${localized.desc}`, 'success');
              }
            }
            
            setNotifications(data);
            prevNotifsRef.current = data;
          }
        } catch (err) {
          console.error(err);
        }
      };
      
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 15000); // Polling every 15s
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      prevNotifsRef.current = [];
    }
  }, [user, addToast]);

  // Click outside to close notification & user menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllAsRead: true, userEmail: user?.email })
      });
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <nav className={styles.navbar}>
      <div className={styles.navInner}>
        {/* Left Zone: Brand Identity */}
        <Link href="/" className={styles.brand} aria-label="Ramu Roastery Home">
          <span className={styles.brandName}>Ramu</span>
          <span className={styles.brandSub}>Roastery Co.</span>
        </Link>

        {/* Center Zone: Curated Navigation */}
        <nav className={`${styles.navCenter} ${isMobileMenuOpen ? styles.navCenterOpen : ''}`} aria-label="Main Navigation">
          <ul className={styles.navLinks}>
            <li>
              <Link href="/catalog" className="tour-nav-catalog" onClick={() => setIsMobileMenuOpen(false)}>
                {tr.nav_catalog}
              </Link>
            </li>
            <li>
              <Link href="/about" onClick={() => setIsMobileMenuOpen(false)}>
                {tr.nav_about}
              </Link>
            </li>
            <li>
              <Link href="/custom-sourcing" onClick={() => setIsMobileMenuOpen(false)}>
                {lang === 'ja' ? 'B2B調達' : lang === 'en' ? 'B2B Sourcing' : 'B2B Sourcing'}
              </Link>
            </li>
            <li>
              <Link href="/track" onClick={() => setIsMobileMenuOpen(false)}>
                {lang === 'ja' ? '注文追跡' : lang === 'en' ? 'Track Order' : 'Lacak Pesanan'}
              </Link>
            </li>

            {/* Mobile Drawer Additional Items */}
            {isMobileMenuOpen && (
              <>
                <li className={styles.mobileDivider} />
                <li>
                  <Link href="/faq" onClick={() => setIsMobileMenuOpen(false)}>
                    {lang === 'ja' ? 'ヘルプ＆FAQ' : lang === 'en' ? 'Help & FAQ' : 'Pusat Bantuan & FAQ'}
                  </Link>
                </li>
                <li className={styles.mobileLangItem}>
                  <span className={styles.mobileLangLabel}>Language / 言語</span>
                  <div className={styles.mobileLangGroup}>
                    <button 
                      type="button"
                      className={`${styles.mobileLangBtn} ${lang === "id" ? styles.mobileLangBtnActive : ''}`} 
                      onClick={() => { setLang("id"); setIsMobileMenuOpen(false); }}
                    >
                      ID
                    </button>
                    <button 
                      type="button"
                      className={`${styles.mobileLangBtn} ${lang === "en" ? styles.mobileLangBtnActive : ''}`} 
                      onClick={() => { setLang("en"); setIsMobileMenuOpen(false); }}
                    >
                      EN
                    </button>
                    <button 
                      type="button"
                      className={`${styles.mobileLangBtn} ${lang === "ja" ? styles.mobileLangBtnActive : ''}`} 
                      onClick={() => { setLang("ja"); setIsMobileMenuOpen(false); }}
                    >
                      JP
                    </button>
                  </div>
                </li>
              </>
            )}
          </ul>
        </nav>

        {/* Right Zone: Clean Utilities */}
        <div className={styles.navUtilities}>
          {/* Typographic Language Switcher */}
          <div className={styles.langSelector} id="lang-toggle-btn" role="group" aria-label="Language selector">
            <button
              type="button"
              className={`${styles.langTextBtn} ${lang === "id" ? styles.langActive : ""}`}
              onClick={() => setLang("id")}
              aria-label="Bahasa Indonesia"
            >
              ID
            </button>
            <span className={styles.langSep}>/</span>
            <button
              type="button"
              className={`${styles.langTextBtn} ${lang === "en" ? styles.langActive : ""}`}
              onClick={() => setLang("en")}
              aria-label="English"
            >
              EN
            </button>
            <span className={styles.langSep}>/</span>
            <button
              type="button"
              className={`${styles.langTextBtn} ${lang === "ja" ? styles.langActive : ""}`}
              onClick={() => setLang("ja")}
              aria-label="日本語"
            >
              JP
            </button>
          </div>

          <span className={styles.utilityDivider} aria-hidden="true" />

          {/* User Account / Profile */}
          <div className={`tour-nav-user ${styles.userSection}`}>
            {user ? (
              <div className={styles.userMenuContainer} ref={userMenuRef}>
                <button 
                  className={styles.userMenuBtn}
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  aria-label="User menu"
                  title={user.name}
                >
                  <div className={`${styles.userAvatar} ${user.isVip || (user.role as string)?.toUpperCase() === 'VIP' ? styles.userAvatarVip : ''}`}>
                    <svg viewBox="0 0 24 24" fill={user.isVip || (user.role as string)?.toUpperCase() === 'VIP' ? '#f59e0b' : 'currentColor'}>
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                  <span className={styles.userLabel}>
                    {user.name.split(' ')[0]}
                  </span>
                  {unreadCount > 0 && (
                    <span className={styles.userNotifDot} title={`${unreadCount} notifikasi baru`} />
                  )}
                </button>

                {isUserMenuOpen && (
                  <div className={styles.userDropdown}>
                    <div className={styles.userDropdownHeader}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px', marginBottom: '0.2rem' }}>
                        <p className={styles.userDropdownName}>{user.name}</p>
                        {(user.isVip || (user.role as string)?.toUpperCase() === 'VIP') && (
                          <span className={styles.vipBadge}>✨ SUBSCRIBER</span>
                        )}
                      </div>
                      <p className={styles.userDropdownEmail}>{user.email || 'user@example.com'}</p>
                    </div>
                    <div className={styles.userDropdownLinks}>
                      {user.role === 'admin' && (
                        <Link href="/admin" className={styles.userDropdownItem} onClick={() => setIsUserMenuOpen(false)}>
                          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                          {tr.nav_admin}
                        </Link>
                      )}
                      <Link href="/dashboard" className={styles.userDropdownItem} onClick={() => setIsUserMenuOpen(false)}>
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                        {tr.dash_title}
                      </Link>
                      <Link href="/dashboard/orders" className={styles.userDropdownItem} onClick={() => setIsUserMenuOpen(false)}>
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                        {tr.nav_my_orders}
                      </Link>
                      <Link href="/faq" className={styles.userDropdownItem} onClick={() => setIsUserMenuOpen(false)}>
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                        {lang === 'ja' ? 'ヘルプ＆FAQ' : lang === 'en' ? 'Help & FAQ' : 'Bantuan & FAQ'}
                      </Link>
                      <button 
                        className={styles.userDropdownItem} 
                        onClick={() => {
                          logout();
                          setIsUserMenuOpen(false);
                        }}
                      >
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                        {tr.dash_logout}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className={styles.loginLink}>
                {lang === 'ja' ? 'ログイン' : lang === 'en' ? 'Sign In' : 'Masuk'}
              </Link>
            )}
          </div>

          {/* Shopping Bag Button */}
          <button 
            className={`tour-nav-cart ${styles.cartBtn}`}
            onClick={() => setIsCartOpen(true)}
            aria-label="Shopping Cart"
            title="Keranjang"
          >
            <svg className={styles.cartIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
            {cartCount > 0 && (
              <span className={styles.cartBadge}>{cartCount}</span>
            )}
          </button>

          {/* Mobile Menu Button */}
          <button 
            className={styles.mobileMenuBtn} 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {isMobileMenuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </>
              ) : (
                <>
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </>
              )}
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
}
