"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLang } from '../../context/LanguageContext';
import { t } from '../../data/translations';
import styles from './layout.module.css';
import ProtectedRoute from '../../components/ProtectedRoute';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { lang } = useLang();
  const translations = t[lang as keyof typeof t];

  const navItems = [
    { name: translations.dash_menu_account, path: '/dashboard', icon: '👤' },
    { name: translations.dash_menu_addresses || 'Daftar Alamat', path: '/dashboard/addresses', icon: '📍' },
    { name: translations.dash_menu_subscriptions || 'Langganan', path: '/dashboard/subscriptions', icon: '🔄' },
    { name: translations.dash_menu_orders, path: '/dashboard/orders', icon: '📦' },
    { name: translations.dash_menu_wishlist, path: '/dashboard/wishlist', icon: '❤️' },
    { name: translations.dash_menu_returns, path: '/dashboard/returns', icon: '🔄' },
    { name: translations.dash_menu_reviews, path: '/dashboard/reviews', icon: '⭐' },
    { name: translations.dash_menu_security, path: '/dashboard/security', icon: '🔒' },
    { name: translations.dash_menu_coffee, path: '/dashboard/coffee-profile', icon: '☕' },
  ];

  return (
    <ProtectedRoute>
      <div className={styles.dashboardContainer}>
        <aside className={styles.sidebar}>
        <h2 className={styles.sidebarTitle}>{translations.dash_sidebar_title}</h2>
        <nav className={styles.navMenu}>
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            let tourClass = '';
            if (item.path === '/dashboard') tourClass = 'tour-dashboard-home';
            else if (item.path === '/dashboard/addresses') tourClass = 'tour-dashboard-addresses';
            else if (item.path === '/dashboard/coffee-profile') tourClass = 'tour-dashboard-coffee';

            return (
              <Link 
                key={item.path} 
                href={item.path} 
                className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''} ${tourClass}`}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>
      
        <main className={styles.content}>
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
