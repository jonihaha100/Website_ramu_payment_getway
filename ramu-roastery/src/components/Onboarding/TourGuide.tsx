"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLang } from "../../context/LanguageContext";
import styles from "./TourGuide.module.css";

interface Step {
  target: string;
  title: string;
  content: string;
  badge: string;
}

const stepsData: Record<"id" | "en" | "ja", Step[]> = {
  id: [
    {
      target: "body",
      badge: "Langkah 1/5",
      title: "👋 Selamat Datang di Ramu Roastery!",
      content: "Kami menyangrai biji kopi spesialti segar setiap Senin & Kamis langsung dari Bandung. Mari kami pandu fitur-fitur belanja dan kemudahan di website ini!",
    },
    {
      target: ".tour-nav-catalog",
      badge: "Langkah 2/5",
      title: "☕ Katalog Biji Kopi",
      content: "Jelajahi koleksi kopi Filter dan Espresso kami. Anda bisa memfilter berdasarkan notes rasa (fruity, chocolatey, floral) serta proses pasca-panen.",
    },
    {
      target: ".tour-nav-cart",
      badge: "Langkah 3/5",
      title: "🛒 Keranjang & Pembelian Cepat",
      content: "Pilih ukuran (Filter: 150g/250g, Espresso: 250g/500g/1kg) dan profil gilingan. Standar otomatis terarah ke 'Biji Utuh' demi menjaga kesegaran rasa maksimal.",
    },
    {
      target: ".tour-nav-user",
      badge: "Langkah 4/5",
      title: "👤 Akun & Privilese VIP",
      content: "Di Menu Akun ini, nikmati status VIP Subscriber (Bebas Biaya Layanan Rp 0), bagikan kode referral Anda, dan catat pengalaman seduh di Catatan Seduh Harian.",
    },
    {
      target: ".tour-nav-help",
      badge: "Langkah 5/5",
      title: "💬 Bantuan Pelanggan & B2B",
      content: "Ada kendala teknis atau pertanyaan pasokan kedai kopi (B2B)? Hubungi barista roastery kami langsung lewat WhatsApp di jam operasional 09:00 - 17:00 WIB!",
    },
  ],
  en: [
    {
      target: "body",
      badge: "Step 1/5",
      title: "👋 Welcome to Ramu Roastery!",
      content: "We roast fresh specialty coffee beans every Monday & Thursday directly in Bandung. Let us walk you through the key features of our website!",
    },
    {
      target: ".tour-nav-catalog",
      badge: "Step 2/5",
      title: "☕ Coffee Catalog",
      content: "Explore our Filter and Espresso specialty collections. Filter by cup tasting notes (fruity, chocolatey, floral) and harvest processing methods.",
    },
    {
      target: ".tour-nav-cart",
      badge: "Step 3/5",
      title: "🛒 Shopping Cart & Quick Order",
      content: "Select your bag size (Filter: 150g/250g, Espresso: 250g/500g/1kg) and grind size. We default to 'Whole Bean' to preserve peak flavor and aroma.",
    },
    {
      target: ".tour-nav-user",
      badge: "Step 4/5",
      title: "👤 Account & VIP Perks",
      content: "Track your parcels, enjoy VIP Subscriber privileges (Rp 0 Admin Fee), share referral codes, and log daily brewing recipes in your tasting journal.",
    },
    {
      target: ".tour-nav-help",
      badge: "Step 5/5",
      title: "💬 Customer Support & B2B",
      content: "Need ordering assistance or wholesale supply for your coffee shop (B2B)? Connect directly with our roastery team on WhatsApp (09:00 - 17:00 WIB)!",
    },
  ],
  ja: [
    {
      target: "body",
      badge: "ステップ 1/5",
      title: "👋 Ramu Roastery へようこそ！",
      content: "バンドンより毎週月曜＆木曜に新鮮なスペシャルティコーヒーを焙煎してお届けしています。お買い物の流れをご案内します！",
    },
    {
      target: ".tour-nav-catalog",
      badge: "ステップ 2/5",
      title: "☕ コーヒーカタログ",
      content: "フィルター用やエスプレッソ用の豆、精製方法（ナチュラル、ウォッシュト、ハニー等）、カッピングノートで豆を検索できます。",
    },
    {
      target: ".tour-nav-cart",
      badge: "ステップ 3/5",
      title: "🛒 カート＆クイック注文",
      content: "パッケージサイズと挽き目をお選びいただけます。豆の鮮度を最高に保つため、標準では「豆のまま」が選択されています。",
    },
    {
      target: ".tour-nav-user",
      badge: "ステップ 4/5",
      title: "👤 マイページ＆VIP特典",
      content: "定期便の管理、VIP特典（手数料無料）、テイスティングメモの記録など様々な会員機能をご利用いただけます。",
    },
    {
      target: ".tour-nav-help",
      badge: "ステップ 5/5",
      title: "💬 カスタマーサポート＆卸売",
      content: "ご注文についてのご質問やカフェ向け卸（B2B）のご相談は、営業時間内（09:00〜17:00 WIB）にWhatsAppにてお気軽にお問い合わせください！",
    },
  ],
};

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
  isCenter: boolean;
}

export default function TourGuide() {
  const { user } = useAuth();
  const { lang } = useLang();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);

  const steps = useMemo(() => {
    return stepsData[lang as "id" | "en" | "ja"] || stepsData.id;
  }, [lang]);

  // Start Tour Event Listener
  useEffect(() => {
    const handleStartTour = () => {
      setCurrentStep(0);
      setIsOpen(true);
    };
    window.addEventListener("start-tour", handleStartTour);
    return () => window.removeEventListener("start-tour", handleStartTour);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    const storageKey = user?.email ? `has_seen_tour_${user.email}` : "has_seen_tour_guest";
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, "true");
    }
  }, [user]);

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleClose();
    }
  }, [currentStep, steps.length, handleClose]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose, handleNext, handlePrev]);

  // Recalculate spotlight rectangle
  useEffect(() => {
    if (!isOpen) {
      setTargetRect(null);
      return;
    }

    const updatePosition = () => {
      const step = steps[currentStep];
      if (!step || step.target === "body") {
        setTargetRect({ top: 0, left: 0, width: 0, height: 0, isCenter: true });
        return;
      }

      // Find all elements matching target selector and pick the visible one
      const allEls = Array.from(document.querySelectorAll(step.target)) as HTMLElement[];
      const visibleEl = allEls.find((el) => {
        const r = el.getBoundingClientRect();
        return (
          r.width > 0 &&
          r.height > 0 &&
          window.getComputedStyle(el).display !== "none" &&
          window.getComputedStyle(el).visibility !== "hidden"
        );
      });

      if (visibleEl) {
        visibleEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
        const r = visibleEl.getBoundingClientRect();
        setTargetRect({
          top: r.top,
          left: r.left,
          width: r.width,
          height: r.height,
          isCenter: false,
        });
      } else {
        // Fallback gracefully without breaking or freezing
        setTargetRect({ top: 0, left: 0, width: 0, height: 0, isCenter: true });
      }
    };

    const timer = setTimeout(updatePosition, 60);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, { passive: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition);
    };
  }, [isOpen, currentStep, steps]);

  if (!isOpen || (user && user.role === "admin")) return null;

  const currentStepData = steps[currentStep] || steps[0];

  // Dynamic positioning for desktop
  const getCardStyle = (): React.CSSProperties => {
    if (!targetRect || targetRect.isCenter || typeof window === "undefined") {
      return {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      };
    }

    if (window.innerWidth <= 640) {
      return {}; // Managed by CSS media query on mobile
    }

    const cardWidth = 380;
    const cardHeight = 250;
    const margin = 16;

    // Horizontal alignment clamped within viewport
    const left = Math.max(margin, Math.min(targetRect.left, window.innerWidth - cardWidth - margin));

    // Vertical placement (prefer below, else above)
    const spaceBelow = window.innerHeight - (targetRect.top + targetRect.height + margin);
    let top = 0;
    if (spaceBelow >= cardHeight || targetRect.top < 160) {
      top = targetRect.top + targetRect.height + margin;
    } else {
      top = Math.max(margin, targetRect.top - cardHeight - margin);
    }

    return {
      top: `${top}px`,
      left: `${left}px`,
    };
  };

  const getSpotlightStyle = (): React.CSSProperties => {
    if (!targetRect || targetRect.isCenter) return { display: "none" };
    const pad = 6;
    return {
      top: `${targetRect.top - pad}px`,
      left: `${targetRect.left - pad}px`,
      width: `${targetRect.width + pad * 2}px`,
      height: `${targetRect.height + pad * 2}px`,
    };
  };

  const labels = {
    skip: lang === "ja" ? "スキップ" : lang === "en" ? "Skip" : "Lewati",
    back: lang === "ja" ? "← 戻る" : lang === "en" ? "← Back" : "← Kembali",
    next: lang === "ja" ? "次へ →" : lang === "en" ? "Next →" : "Lanjut →",
    finish: lang === "ja" ? "完了 🚀" : lang === "en" ? "Finish 🚀" : "Selesai 🚀",
  };

  return (
    <>
      {/* Dimmed backdrop - click outside closes cleanly, never locks screen */}
      <div className={styles.backdrop} onClick={handleClose} />

      {/* Spotlight cutout around the target element */}
      {targetRect && !targetRect.isCenter && (
        <div className={styles.spotlightHole} style={getSpotlightStyle()} />
      )}

      {/* Interactive Popover Card */}
      <div
        className={styles.popoverCard}
        style={getCardStyle()}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className={styles.cardHeader}>
          <span className={styles.stepBadge}>{currentStepData.badge}</span>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={handleClose}
            title={labels.skip}
            aria-label="Close guide"
          >
            ✕
          </button>
        </div>

        <h3 className={styles.cardTitle}>{currentStepData.title}</h3>
        <p className={styles.cardContent}>{currentStepData.content}</p>

        {/* Dots progress indicator */}
        <div className={styles.dotsProgress}>
          {steps.map((_, idx) => (
            <span
              key={idx}
              className={`${styles.dot} ${
                idx === currentStep ? styles.dotActive : idx < currentStep ? styles.dotDone : ""
              }`}
            />
          ))}
        </div>

        {/* Navigation buttons */}
        <div className={styles.cardFooter}>
          <button type="button" className={styles.skipBtn} onClick={handleClose}>
            {labels.skip}
          </button>

          <div className={styles.navBtns}>
            {currentStep > 0 && (
              <button type="button" className={styles.prevBtn} onClick={handlePrev}>
                {labels.back}
              </button>
            )}
            <button type="button" className={styles.nextBtn} onClick={handleNext}>
              {currentStep === steps.length - 1 ? labels.finish : labels.next}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
