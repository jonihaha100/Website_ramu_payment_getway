"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLang } from "../../context/LanguageContext";
import { useToast } from "../../context/ToastContext";
import styles from "./PromoModal.module.css";

export default function PromoModal() {
  const pathname = usePathname();
  const router = useRouter();
  const { lang } = useLang();
  const { addToast } = useToast();

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
        ? `${promoDiscount.value}% OFF on all coffee beans`
        : `Rp ${Number(promoDiscount.value).toLocaleString("id-ID")} Instant Discount`;
    }
    return promoDiscount.type === "percentage"
      ? `Diskon ${promoDiscount.value}% untuk Semua Varian Kopi`
      : `Potongan Langsung Rp ${Number(promoDiscount.value).toLocaleString("id-ID")}`;
  };

  useEffect(() => {
    // Avoid showing on admin or during checkout flow
    if (pathname?.startsWith("/admin") || pathname?.startsWith("/checkout")) {
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

    // Check session dismissal (don't pester within same browsing session if closed)
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
  }, [pathname]);

  const handleClose = () => {
    if (dontShowToday) {
      // 24 hours expiry
      const tomorrow = Date.now() + 24 * 60 * 60 * 1000;
      localStorage.setItem("ramu_promo_dismiss_until", tomorrow.toString());
    }
    sessionStorage.setItem("ramu_promo_session_dismissed", "true");
    setIsOpen(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(promoCode);
    setCopied(true);
    addToast(
      lang === "ja"
        ? `プロモコード「${promoCode}」をコピーしました！`
        : lang === "en"
        ? `Promo code "${promoCode}" copied to clipboard!`
        : `Kode promo "${promoCode}" berhasil disalin!`,
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
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={handleClose} aria-label="Tutup">
          ✕
        </button>

        <div className={styles.badge}>
          <span>✨</span>
          <span>
            {lang === "ja" ? "ウェルカムクーポン" : lang === "en" ? "WELCOME VOUCHER" : "VOUCHER SELAMAT DATANG"}
          </span>
        </div>

        <h2 className={styles.title}>
          {lang === "ja" ? (
            <>極上の<span className={styles.highlight}>フレッシュ焙煎珈琲</span>を体験</>
          ) : lang === "en" ? (
            <>Experience <span className={styles.highlight}>Freshly Roasted Coffee</span></>
          ) : (
            <>Nikmati Kopi Sangrai <span className={styles.highlight}>Segar Berkualitas</span></>
          )}
        </h2>

        <p className={styles.subtitle}>
          {lang === "ja"
            ? `ご注文に使える特別クーポン: ${getFormattedDiscount()}。バンドンより毎週月曜＆木曜に焙煎したてを直送いたします。`
            : lang === "en"
            ? `Special offer for your order: ${getFormattedDiscount()}. Roasted fresh every Monday & Thursday directly from Bandung.`
            : `Penawaran spesial untuk pesanan Anda: ${getFormattedDiscount()}. Disangrai segar setiap Senin & Kamis langsung dari Bandung.`}
        </p>

        <div className={styles.couponBox}>
          <span className={styles.couponLabel}>
            {lang === "ja"
              ? "チェックアウト時にクーポンコードを入力"
              : lang === "en"
              ? "Enter Promo Code at Checkout"
              : "Gunakan Kode Kupon Saat Checkout"}
          </span>
          <div className={styles.couponRow}>
            <span className={styles.couponCode}>{promoCode}</span>
            <button className={styles.copyButton} onClick={handleCopy} type="button">
              {copied 
                ? (lang === "ja" ? "✓ コピー済" : lang === "en" ? "✓ Copied" : "✓ Tersalin") 
                : (lang === "ja" ? "📋 コピー" : lang === "en" ? "📋 Copy" : "📋 Salin")}
            </button>
          </div>
        </div>

        <button className={styles.mainAction} onClick={handleShopNow} type="button">
          {lang === "ja"
            ? "コードをコピーして買い物を始める →"
            : lang === "en"
            ? "Copy Code & Shop Now →"
            : "Salin Kode & Mulai Belanja →"}
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
              ? "Don't show this again today"
              : "Jangan tampilkan lagi hari ini"}
          </span>
        </label>
      </div>
    </div>
  );
}
