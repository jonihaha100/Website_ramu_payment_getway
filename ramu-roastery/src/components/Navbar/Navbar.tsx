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
      <div className={`container ${styles.navInner}`}>
        {/* Logo / Brand */}
        <Link href="/" className={styles.brand}>
          <span className={styles.brandName}>Ramu</span>
          <span className={styles.brandSub}>Roastery Co.</span>
        </Link>

        {/* Mobile Menu Button */}
        <button 
          className={styles.mobileMenuBtn} 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

        {/* Links */}
        <ul className={`${styles.navLinks} ${isMobileMenuOpen ? styles.navLinksOpen : ''}`}>
          <li><Link href="/catalog" className="tour-nav-catalog" onClick={() => setIsMobileMenuOpen(false)}>{tr.nav_catalog}</Link></li>
          <li><Link href="/about" onClick={() => setIsMobileMenuOpen(false)}>{tr.nav_about}</Link></li>
          {isMobileMenuOpen && (
            <li className={styles.mobileLangItem}>
              <span className={styles.mobileLangLabel}>Language / 言語</span>
              <div className={styles.mobileLangGroup}>
                <button 
                  type="button"
                  className={`${styles.mobileLangBtn} ${lang === "id" ? styles.mobileLangBtnActive : ''}`} 
                  onClick={() => { setLang("id"); setIsMobileMenuOpen(false); }}
                >
                  🇮🇩 ID
                </button>
                <button 
                  type="button"
                  className={`${styles.mobileLangBtn} ${lang === "en" ? styles.mobileLangBtnActive : ''}`} 
                  onClick={() => { setLang("en"); setIsMobileMenuOpen(false); }}
                >
                  🇬🇧 EN
                </button>
                <button 
                  type="button"
                  className={`${styles.mobileLangBtn} ${lang === "ja" ? styles.mobileLangBtnActive : ''}`} 
                  onClick={() => { setLang("ja"); setIsMobileMenuOpen(false); }}
                >
                  🇯🇵 JP
                </button>
              </div>
            </li>
          )}
        </ul>

        {/* Right Controls */}
        <div className={styles.rightControls}>
          {/* Notification Bell (Only if logged in) */}
          {user && (
            <div className={styles.notifContainer} ref={notifRef}>
              <button 
                className={styles.notifBtn} 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                aria-label="Notifications"
              >
                <svg className={styles.notifIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className={styles.notifBadge}>{unreadCount}</span>
                )}
              </button>

              {isNotifOpen && (
                <div className={styles.notifDropdown}>
                  <div className={styles.notifHeader}>
                    <span className={styles.notifTitle}>{tr.nav_notif}</span>
                    {unreadCount > 0 && (
                      <button className={styles.notifMarkAll} onClick={markAllAsRead}>
                        {tr.nav_notif_read_all}
                      </button>
                    )}
                  </div>
                  
                  <div className={styles.notifList}>
                    {notifications.length > 0 ? (
                      notifications.map(notif => {
                        const loc = localizeNotification(notif.title, notif.desc, lang);
                        const formattedTime = formatNotificationDate(notif.time, lang);
                        return (
                          <div 
                            key={notif.id} 
                            className={`${styles.notifItem} ${!notif.read ? styles.notifItemUnread : ''}`}
                            style={{ cursor: 'pointer' }}
                            onClick={async () => {
                              try {
                                if (!notif.read) {
                                  await fetch('/api/notifications', {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ id: notif.id })
                                  });
                                  setNotifications(notifications.map(n => n.id === notif.id ? { ...n, read: true } : n));
                                }
                              } catch(e) {}
                              setIsNotifOpen(false);
                              if (notif.href && notif.href !== '#') {
                                router.push(notif.href);
                              }
                            }}
                          >
                            <div className={styles.notifItemTitle}>{loc.title}</div>
                            <div className={styles.notifItemDesc}>{loc.desc}</div>
                            <div className={styles.notifItemTime}>{formattedTime}</div>
                          </div>
                        );
                      })
                    ) : (
                      <div className={styles.emptyNotif}>{tr.nav_notif_empty}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Language Segmented Pill */}
          <div className={styles.langToggleContainer} id="lang-toggle-btn" role="group" aria-label="Language selector">
            <button
              type="button"
              className={`${styles.langBtn} ${lang === "id" ? styles.activeLang : styles.inactiveLang}`}
              onClick={() => setLang("id")}
              aria-label="Bahasa Indonesia"
            >
              ID
            </button>
            <button
              type="button"
              className={`${styles.langBtn} ${lang === "en" ? styles.activeLang : styles.inactiveLang}`}
              onClick={() => setLang("en")}
              aria-label="English"
            >
              EN
            </button>
            <button
              type="button"
              className={`${styles.langBtn} ${lang === "ja" ? styles.activeLang : styles.inactiveLang}`}
              onClick={() => setLang("ja")}
              aria-label="日本語"
            >
              JP
            </button>
          </div>

          {/* User / Login */}
          <div className={`tour-nav-user ${styles.userSection}`}>
            {user ? (
              <div className={styles.userMenuContainer} ref={userMenuRef}>
                <button 
                  className={styles.userMenuBtn}
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  aria-label="User menu"
                >
                  <div className={`${styles.userAvatar} ${user.isVip || (user.role as string)?.toUpperCase() === 'VIP' ? styles.userAvatarVip : ''}`}>
                    <svg viewBox="0 0 24 24" fill={user.isVip || (user.role as string)?.toUpperCase() === 'VIP' ? '#f59e0b' : 'currentColor'}>
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                  <span className={styles.userNameMobileHide}>
                    {user.name} {user.isVip || (user.role as string)?.toUpperCase() === 'VIP' ? '👑' : ''}
                  </span>
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
                Login
              </Link>
            )}
          </div>

          {/* Cart Toggle */}
          <button 
            className={`tour-nav-cart ${styles.cartBtn}`}
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

          {/* Help / CS Icon */}
          <Link 
            href="/faq" 
            className={`tour-nav-help ${styles.cartBtn}`} 
            title="Pusat Bantuan / CS"
            aria-label="Customer Service"
          >
            <svg className={styles.cartIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 11h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5Zm0 0a9 9 0 1 1 18 0m0 0v5a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3Z"/>
              <path d="M21 16v2a4 4 0 0 1-4 4h-5"/>
            </svg>
          </Link>
        </div>
      </div>
    </nav>
  );
}
