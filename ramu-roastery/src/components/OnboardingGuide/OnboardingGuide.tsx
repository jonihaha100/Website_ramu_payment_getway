"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import styles from "./OnboardingGuide.module.css";

import { useAuth } from "../../context/AuthContext";
import { useLang } from "../../context/LanguageContext";

const stepsId = [
  {
    emoji: "👋",
    title: "Selamat Datang di Ramu Roastery!",
    desc: "Kami adalah roastery kopi spesialis asal Bandung. Disangrai segar setiap Senin & Kamis. Mari kami bantu memahami cara belanja kopi yang tepat dan menyenangkan!",
  },
  {
    emoji: "☕",
    title: "Jelajahi Katalog & Varian Rasa",
    desc: "Buka menu \"Katalog Kopi\" untuk melihat koleksi biji kopi. Anda bisa memfilter berdasarkan profil seduh (Espresso / Filter) dan proses pasca-panen (Natural, Wash, Honey, Anaerobic).",
  },
  {
    emoji: "🛒",
    title: "Pilih Ukuran & Profil Gilingan",
    desc: "Pilih kemasan (Filter: 150g/250g, Espresso: 250g/500g/1kg). Pilihan otomatis terarah ke \"Biji Utuh\" demi menjaga kesegaran rasa, atau pilih gilingan Halus/Sedang/Kasar sesuai alat seduh Anda.",
  },
  {
    emoji: "💳",
    title: "Checkout, Jam Kirim & Tebeng Pengiriman",
    desc: "Di halaman Checkout, nikmati jam kerja operasional 09:00–17:00 WIB (cut-off 15:00 WIB). Anda juga bisa memilih opsi \"Tebeng Kirim\" ke batch sangrai terdekat atau menggunakan promo & Ramu Points!",
  },
  {
    emoji: "📦",
    title: "Lacak Pesanan & Fitur VIP",
    desc: "Pantau nomor resi di \"Dashboard → Pesanan Saya\". Dapatkan status VIP Subscriber (Bebas Biaya Layanan Rp 0) dan bagikan kode referral Anda untuk mendapatkan bonus poin!",
  },
];

const stepsEn = [
  {
    emoji: "👋",
    title: "Welcome to Ramu Roastery!",
    desc: "We are a specialty coffee roastery from Bandung, roasting fresh every Monday & Thursday. Let us guide you through our shopping experience!",
  },
  {
    emoji: "☕",
    title: "Explore the Coffee Catalog",
    desc: "Browse our catalog and filter by brewing category (Espresso / Filter) and processing methods (Natural, Wash, Honey, Anaerobic) to find your ideal cup.",
  },
  {
    emoji: "🛒",
    title: "Select Size & Grind Profile",
    desc: "Choose your package size (Filter: 150g/250g, Espresso: 250g/500g/1kg). We default to \"Whole Bean\" for optimal freshness, or select your preferred grind size.",
  },
  {
    emoji: "💳",
    title: "Checkout, Hours & Consolidated Dispatch",
    desc: "During checkout, note our 09:00–17:00 WIB hours (15:00 WIB dispatch cut-off). You can also choose 'Tebeng Kirim' to consolidate with the next roast batch!",
  },
  {
    emoji: "📦",
    title: "Track Orders & VIP Privileges",
    desc: "Track delivery status in \"Dashboard → My Orders\". Enjoy VIP perks (Rp 0 Admin Fee) and share your referral code to earn reward points!",
  },
];

const stepsJa = [
  {
    emoji: "👋",
    title: "Ramu Roastery へようこそ！",
    desc: "私たちはインドネシア・バンドン発のスペシャルティコーヒーロースタリーです。毎週月曜＆木曜に新鮮焙煎。お買い物の流れをご案内いたします！",
  },
  {
    emoji: "☕",
    title: "カタログと風味プロファイルを探索",
    desc: "「コーヒーカタログ」から、抽出方法（エスプレッソ / フィルター）や収穫後の精製プロセス（ナチュラル、ウォッシュト、ハニー、アナエロビック）で豆を絞り込めます。",
  },
  {
    emoji: "🛒",
    title: "パッケージサイズと挽き目を選択",
    desc: "お好みのサイズを選択（フィルター: 150g/250g、エスプレッソ: 250g/500g/1kg）。最高の鮮度を保つため「豆のまま」を推奨していますが、器具に合わせた粉への粉砕も承ります。",
  },
  {
    emoji: "💳",
    title: "チェックアウト＆発送スケジュール",
    desc: "チェックアウトページでは、営業時間09:00〜17:00 WIB（当日締切15:00 WIB）をご確認いただけます。定期便やプロモコード、Ramuポイントもご利用可能です！",
  },
  {
    emoji: "📦",
    title: "配送追跡とVIP特典",
    desc: "送り状番号は「マイページ → 注文履歴」でご確認いただけます。定期便会員様は手数料無料のVIP特典もお楽しみいただけます！",
  },
];

export default function OnboardingGuide() {
  const { user } = useAuth();
  const { lang } = useLang();
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showHelpBtn, setShowHelpBtn] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    // Hide onboarding & help button completely for admins
    if ((user && user.role === "admin") || pathname.startsWith("/admin")) {
      setIsOpen(false);
      setShowHelpBtn(false);
      return;
    }
    setShowHelpBtn(true);

    // Check if user just registered
    const justRegistered = typeof window !== "undefined" ? sessionStorage.getItem("ramu_just_registered") : null;
    const userStorageKey = user?.email ? `ramu_onboarding_done_${user.email}` : "ramu_onboarding_done_guest";
    const done = typeof window !== "undefined" ? localStorage.getItem(userStorageKey) : "true";

    if (justRegistered === "true" || !done) {
      const timer = setTimeout(() => {
        setCurrentStep(0);
        setIsOpen(true);
        if (justRegistered === "true") {
          sessionStorage.removeItem("ramu_just_registered");
        }
      }, 500);
      return () => clearTimeout(timer);
    }

    const handleOpen = () => {
      setCurrentStep(0);
      setIsOpen(true);
    };
    window.addEventListener("open-onboarding", handleOpen);
    return () => window.removeEventListener("open-onboarding", handleOpen);
  }, [user, pathname]);

  // Click outside listener for speed dial menu
  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(`.${styles.speedDialMenu}`) && !target.closest(`.${styles.helpBtn}`)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  const steps = lang === 'ja' ? stepsJa : lang === 'en' ? stepsEn : stepsId;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Finish
      const userStorageKey = user?.email ? `ramu_onboarding_done_${user.email}` : "ramu_onboarding_done_guest";
      localStorage.setItem(userStorageKey, "true");
      localStorage.setItem("ramu_onboarding_done", "true");
      setIsOpen(false);
      
      // Auto-launch interactive spotlight tour so new users see all features!
      setTimeout(() => {
        window.dispatchEvent(new Event('start-tour'));
      }, 500);

      router.push('/catalog');
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1);
  };

  const handleSkip = () => {
    const userStorageKey = user?.email ? `ramu_onboarding_done_${user.email}` : "ramu_onboarding_done_guest";
    localStorage.setItem(userStorageKey, "true");
    localStorage.setItem("ramu_onboarding_done", "true");
    setIsOpen(false);
  };

  const handleOpenModal = () => {
    setIsMenuOpen(false);
    setCurrentStep(0);
    setIsOpen(true);
  };

  const handleStartInteractiveTour = () => {
    setIsMenuOpen(false);
    setIsOpen(false);
    window.dispatchEvent(new Event('start-tour'));
  };

  return (
    <>
      {/* Floating Orange Question Mark Button */}
      {showHelpBtn && (
        <div style={{ position: 'relative', zIndex: 999 }}>
          {isMenuOpen && (
            <div className={styles.speedDialMenu}>
              <button 
                type="button"
                className={styles.speedDialItem} 
                onClick={handleStartInteractiveTour}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
                <span>{lang === 'ja' ? 'インタラクティブツアーを開始' : lang === 'en' ? 'Start Interactive Tour' : 'Mulai Tur Panduan Website'}</span>
              </button>
              
              <button 
                type="button"
                className={styles.speedDialItem} 
                onClick={handleOpenModal}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                </svg>
                <span>{lang === 'ja' ? 'お買い物ガイド (5ステップ)' : lang === 'en' ? '5-Step Shopping Guide' : 'Panduan Belanja Kopi'}</span>
              </button>

              <button 
                type="button"
                className={styles.speedDialItem} 
                onClick={() => { setIsMenuOpen(false); router.push('/faq'); }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                <span>{lang === 'ja' ? 'よくある質問 (FAQ)' : lang === 'en' ? 'Help Center (FAQ)' : 'Pusat Bantuan & FAQ'}</span>
              </button>

              <a 
                href="https://wa.me/6281931736090" 
                target="_blank" 
                rel="noopener noreferrer" 
                className={styles.speedDialItem}
                style={{ textDecoration: 'none' }}
                onClick={() => setIsMenuOpen(false)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                </svg>
                <span>{lang === 'ja' ? 'CSチャット (WhatsApp)' : lang === 'en' ? 'Chat CS (WhatsApp)' : 'Chat CS (WhatsApp)'}</span>
              </a>
            </div>
          )}

          <button
            type="button"
            className={styles.helpBtn}
            onClick={() => setIsMenuOpen(prev => !prev)}
            title={lang === 'ja' ? 'クイックガイド＆ヘルプ' : lang === 'en' ? 'Quick Guide & Help' : 'Panduan & Bantuan Cepat'}
            aria-label="Help and Guide"
          >
            {isMenuOpen ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            ) : (
              <span style={{ fontSize: '1.45rem', fontWeight: 800, lineHeight: 1 }}>?</span>
            )}
          </button>
        </div>
      )}

      {/* Modal Overlay */}
      {isOpen && (
        <div className={styles.overlay} onClick={handleSkip}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            {/* Progress */}
            <div className={styles.progress}>
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`${styles.progressDot} ${i === currentStep ? styles.activeDot : ""} ${i < currentStep ? styles.completedDot : ""}`}
                />
              ))}
            </div>

            {/* Content */}
            <div className={styles.stepContent} key={currentStep}>
              <div className={styles.emoji}>{steps[currentStep].emoji}</div>
              <h2 className={styles.stepTitle}>{steps[currentStep].title}</h2>
              <p className={styles.stepDesc}>{steps[currentStep].desc}</p>
            </div>

            {/* Actions */}
            <div className={styles.actions}>
              <button onClick={handleSkip} className={styles.skipBtn}>
                {lang === 'ja' ? 'スキップ' : lang === 'en' ? 'Skip' : 'Lewati'}
              </button>
              <div className={styles.navBtns}>
                {currentStep > 0 && (
                  <button onClick={handlePrev} className={styles.prevBtn}>
                    ← {lang === 'ja' ? '戻る' : lang === 'en' ? 'Back' : 'Kembali'}
                  </button>
                )}
                <button onClick={handleNext} className={styles.nextBtn}>
                  {currentStep === steps.length - 1 
                    ? (lang === 'ja' ? "🎉 お買い物を始める！" : lang === 'en' ? "🎉 Start Shopping!" : "🎉 Mulai Belanja!") 
                    : (lang === 'ja' ? "次へ →" : lang === 'en' ? "Next →" : "Lanjut →")}
                </button>
              </div>
            </div>

            {/* Step counter */}
            <div className={styles.stepCounter}>
              {currentStep + 1} / {steps.length}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

