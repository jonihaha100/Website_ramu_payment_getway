"use client";

import React, { useState, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLang } from "../../context/LanguageContext";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import styles from "./PromoModal.module.css";

export default function PromoModal() {
  const pathname = usePathname();
  const router = useRouter();
  const { lang } = useLang();
  const { addToast } = useToast();
  const { user } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [promoCode, setPromoCode] = useState("RAMUBARU");
  const [promoDiscount, setPromoDiscount] = useState<{ type: string; value: number }>({
    type: "percentage",
    value: 15
  });
  const [copied, setCopied] = useState(false);
  const [dontShowToday, setDontShowToday] = useState(false);

  const getFormattedDiscount = () => {
    if (lang === "ja") {
      return promoDiscount.type === "percentage"
        ? `全コーヒー商品 ${promoDiscount.value}% OFF`
        : `Rp ${Number(promoDiscount.value).toLocaleString("id-ID")} 値引き`;
    }
    if (lang === "en") {
      return promoDiscount.type === "percentage"
        ? `${promoDiscount.value}% discount on all coffee beans`
        : `Rp ${Number(promoDiscount.value).toLocaleString("id-ID")} direct discount`;
    }
    return promoDiscount.type === "percentage"
      ? `Diskon ${promoDiscount.value}% untuk Semua Varian Kopi`
      : `Potongan Langsung Rp ${Number(promoDiscount.value).toLocaleString("id-ID")}`;
  };

  const handleClose = useCallback(() => {
    if (dontShowToday) {
      const tomorrow = Date.now() + 24 * 60 * 60 * 1000;
      localStorage.setItem("ramu_promo_dismiss_until", tomorrow.toString());
    }
    sessionStorage.setItem("ramu_promo_session_dismissed", "true");
    setIsOpen(false);
  }, [dontShowToday]);

  useEffect(() => {
    // Avoid showing on admin pages, active checkout flow, or login page
    if (pathname?.startsWith("/admin") || pathname?.startsWith("/checkout") || pathname?.startsWith("/login")) {
      return;
    }

    // Do not show to admins
    if (user?.role === "admin") {
      return;
    }

    // Don't show promo modal if onboarding guide is still active
    const onboardingDone = localStorage.getItem("ramu_onboarding_done");
    if (!onboardingDone) {
      return;
    }

    // Check localStorage 24h dismissal
    const dismissUntil = localStorage.getItem("ramu_promo_dismiss_until");
    if (dismissUntil && Date.now() < parseInt(dismissUntil, 10)) {
      return;
    }

    // Check session dismissal (do not re-open within same browsing session if closed)
    const sessionDismissed = sessionStorage.getItem("ramu_promo_session_dismissed");
    if (sessionDismissed === "true") {
      return;
    }

    // Fetch latest active promo code in background
    const fetchPromo = async () => {
      try {
        const res = await fetch("/api/promos");
        if (res.ok) {
          const promos = await res.json();
          if (Array.isArray(promos)) {
            const activePromo = promos.find((p: any) => p.isActive);
            if (activePromo) {
              setPromoCode(activePromo.code);
              setPromoDiscount({
                type: activePromo.discountType || "percentage",
                value: activePromo.discountValue || 15
              });
            }
          }
        }
      } catch (err) {
        console.warn("Could not fetch active promo:", err);
      }
    };
    fetchPromo();

    // Polite entrance delay of 4 seconds so visitor can browse first
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 4000);

    return () => clearTimeout(timer);
  }, [pathname, user]);

  // Keyboard accessibility: Close dialog on Escape key (R-32)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  const handleCopy = () => {
    navigator.clipboard.writeText(promoCode);
    setCopied(true);
    addToast(
      lang === "ja"
        ? `プロモコード「${promoCode}」をクリップボードにコピーしました`
        : lang === "en"
        ? `Promo code "${promoCode}" copied to clipboard`
        : `Kode promo "${promoCode}" berhasil disalin`,
      "success"
    );
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShopNow = () => {
    handleCopy();
    handleClose();
    router.push("/catalog");
  };

  if (!isOpen) return null;

  return (
    <div 
      className={styles.overlay} 
      onClick={handleClose} 
      role="presentation"
    >
      <div 
        className={styles.modalCard} 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="promo-modal-title"
        aria-describedby="promo-modal-description"
      >
        <button 
          className={styles.closeButton} 
          onClick={handleClose} 
          aria-label={lang === "ja" ? "閉じる" : lang === "en" ? "Close" : "Tutup"}
          type="button"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <line x1="1" y1="1" x2="13" y2="13" />
            <line x1="13" y1="1" x2="1" y2="13" />
          </svg>
        </button>

        <div className={styles.eyebrow}>
          {lang === "ja" ? "初回注文のご案内" : lang === "en" ? "FIRST ORDER PRIVILEGE" : "PENAWARAN SELAMAT DATANG"}
        </div>

        <h2 id="promo-modal-title" className={styles.title}>
          {lang === "ja" ? (
            <>極上の焙煎珈琲を、<br />特別な一杯から。</>
          ) : lang === "en" ? (
            <>Freshly Roasted Specialty Coffee,<br />Curated for You.</>
          ) : (
            <>Nikmati Kopi Sangrai Segar,<br />Kurasi Langsung dari Bandung.</>
          )}
        </h2>

        <p id="promo-modal-description" className={styles.subtitle}>
          {lang === "ja"
            ? `ご注文に使える特別コード: ${getFormattedDiscount()}。毎週月曜と木曜に焙煎し、新鮮な状態でお届けします。`
            : lang === "en"
            ? `Privilege code for your first purchase: ${getFormattedDiscount()}. Freshly roasted every Monday and Thursday.`
            : `Gunakan kode sambutan ini untuk pesanan Anda: ${getFormattedDiscount()}. Disangrai segar setiap Senin dan Kamis.`}
        </p>

        <div className={styles.couponContainer}>
          <div className={styles.couponHeader}>
            <span className={styles.couponLabel}>
              {lang === "ja"
                ? "クーポンコード"
                : lang === "en"
                ? "PROMO CODE"
                : "KODE KUPON"}
            </span>
            <span className={styles.couponHint}>
              {lang === "ja" ? "チェックアウト時に適用" : lang === "en" ? "Apply at checkout" : "Pakai saat checkout"}
            </span>
          </div>
          <div className={styles.couponRow}>
            <span className={styles.couponCode}>{promoCode}</span>
            <button 
              className={copied ? styles.copyButtonActive : styles.copyButton} 
              onClick={handleCopy} 
              type="button"
              aria-label={lang === "ja" ? "コードをコピー" : lang === "en" ? "Copy promo code" : "Salin kode kupon"}
            >
              {copied 
                ? (lang === "ja" ? "Tersalin" : lang === "en" ? "Copied" : "Tersalin") 
                : (lang === "ja" ? "コピー" : lang === "en" ? "Copy" : "Salin")}
            </button>
          </div>
        </div>

        <button 
          className={styles.mainAction} 
          onClick={handleShopNow} 
          type="button"
        >
          {lang === "ja"
            ? "コードを適用してカタログを見る"
            : lang === "en"
            ? "Apply Code & Explore Catalog"
            : "Salin Kode & Lihat Katalog"}
        </button>

        <label className={styles.dismissControl}>
          <input
            type="checkbox"
            checked={dontShowToday}
            onChange={(e) => setDontShowToday(e.target.checked)}
          />
          <span>
            {lang === "ja"
              ? "本日中は再度表示しない"
              : lang === "en"
              ? "Do not show again today"
              : "Jangan tampilkan lagi hari ini"}
          </span>
        </label>
      </div>
    </div>
  );
}
