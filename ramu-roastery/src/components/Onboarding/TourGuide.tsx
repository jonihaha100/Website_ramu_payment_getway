"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { usePathname } from "next/navigation";
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
      badge: "Pembaruan Platform",
      title: "Selamat Datang di Ramu Roastery Company",
      content: "Website resmi kami telah diperbarui dengan jadwal sangrai fresh roast (Senin & Kamis), kalibrasi gilingan presisi, dan pembayaran resmi siap peluncuran tanpa simulasi.",
    },
    {
      target: ".tour-nav-catalog",
      badge: "Katalog & Langganan",
      title: "Katalog Biji Kopi & Paket Langganan",
      content: "Jelajahi varian single origin Nusantara dan house blend espresso. Kini tersedia opsi Langganan Biji Kopi prabayar (paket 4x & 12x pengiriman) dengan hemat hingga 15%!",
    },
    {
      target: ".tour-nav-cart",
      badge: "Kalibrasi Seduh",
      title: "Keranjang Belanja & Kalibrasi Gilingan",
      content: "Pilih ukuran kemasan (150g, 250g, 500g, 1kg) dan profil gilingan. Anda dapat menambahkan catatan alat seduh spesifik (V60, Espresso, Cold Brew) agar roaster kami mengkalibrasi mesh gilingan Anda.",
    },
    {
      target: ".tour-nav-user",
      badge: "Akun & Referral",
      title: "Menu Akun, Referral & Hak Istimewa VIP",
      content: "Cek langsung status pesanan, kelola paket langganan kopi, dan bagikan Kode Referral langsung dari dropdown akun untuk diskon belanja teman Rp 15.000 & 50 Ramu Points per transaksi!",
    },
    {
      target: ".tour-nav-help",
      badge: "Bantuan & Transaksi",
      title: "Pusat Bantuan, FAQ & Roaster Concierge",
      content: "Akses FAQ lengkap di bilah navigasi utama untuk info pengiriman se-Indonesia, ekspor mancanegara, serta pembayaran QRIS & Transfer Bank resmi. Roaster kami juga siap membantu via WhatsApp!",
    },
  ],
  en: [
    {
      target: "body",
      badge: "Platform Update",
      title: "Welcome to Ramu Roastery Company",
      content: "Our official platform has been upgraded with scheduled fresh roast batches (Mon & Thu), custom grind calibration, and official commercial payments ready for launch.",
    },
    {
      target: ".tour-nav-catalog",
      badge: "Catalog & Subscriptions",
      title: "Curated Beans & Coffee Subscriptions",
      content: "Explore curated Indonesian terroirs and espresso blends. Discover prepaid Coffee Subscriptions (4x & 12x deliveries) with up to 15% savings and VIP Rp 0 admin fee!",
    },
    {
      target: ".tour-nav-cart",
      badge: "Brew Calibration",
      title: "Shopping Cart & Custom Grind Calibration",
      content: "Choose bag sizes and grind profiles. Add custom brew method notes (V60, Espresso Basket, Cold Brew) so our roastery team calibrates the exact particle size for you.",
    },
    {
      target: ".tour-nav-user",
      badge: "Account & Referral",
      title: "Account Menu, Referral Code & VIP Perks",
      content: "Manage orders, monitor coffee subscriptions, and copy your personal Referral Code directly from the account dropdown to gift Rp 15,000 discounts and earn 50 Ramu Points!",
    },
    {
      target: ".tour-nav-help",
      badge: "Support & Help",
      title: "Help Center, FAQ & Roaster Concierge",
      content: "Access comprehensive FAQ in the top navbar for shipping rates, international export, and official payments. Our roaster team is also ready on WhatsApp 09:00 - 17:00 WIB!",
    },
  ],
  ja: [
    {
      target: "body",
      badge: "最新アップデート",
      title: "Ramu Roastery へようこそ",
      content: "月曜・木曜の新鮮焙煎バッチ、抽出器具に合わせた挽き目調整、正式な決済システムを備えた最新プラットフォームへと進化しました。",
    },
    {
      target: ".tour-nav-catalog",
      badge: "カタログ＆定期便",
      title: "厳選コーヒー豆と定期便サブスクリプション",
      content: "インドネシア各地のシングルオリジンを探索。最大15%お得な定期便サブスク（4回・12回便）なら、VIP手数料無料特典で新鮮な豆が自動で届きます。",
    },
    {
      target: ".tour-nav-cart",
      badge: "挽き目カスタム",
      title: "カート＆器具別グラインド調整",
      content: "豆のままのほか、V60、エスプレッソ、コールドブリューなど抽出器具の好みに応じて最適な挽き目をロースターが調整してお届けします。",
    },
    {
      target: ".tour-nav-user",
      badge: "マイページ＆紹介",
      title: "マイページ・紹介コード・VIP特典",
      content: "注文履歴や定期便の管理に加え、メニューから直接紹介コードをコピーしてお友達にRp 15.000割引をプレゼント。ご自身にも50ポイントが付与されます。",
    },
    {
      target: ".tour-nav-help",
      badge: "ヘルプ＆サポート",
      title: "FAQ・海外配送・ロースター相談",
      content: "配送や決済に関するよくある質問は上部ナビのFAQから確認可能。日本等への海外発送や焙煎プロファイルのご相談はWhatsAppにて日本語でも承ります。",
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
  const pathname = usePathname();
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

  if (!isOpen || (user && user.role === "admin") || pathname?.startsWith("/login")) return null;

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
