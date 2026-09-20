"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useLang } from "../../context/LanguageContext";
import styles from "./TopTicker.module.css";

export default function TopTicker() {
  const pathname = usePathname();
  const { lang } = useLang();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const announcements = lang === "ja" ? [
    {
      badge: "焙煎所ライブ",
      text: (
        <span>
          営業時間: <strong className={styles.highlight}>09:00 – 17:00 WIB</strong> • 当日発送締切: <strong className={styles.highlight}>15:00 WIB</strong>
        </span>
      )
    },
    {
      badge: "焙煎スケジュール",
      text: (
        <span>
          フレッシュ焙煎バッチ: <strong className={styles.highlight}>毎週月曜＆木曜</strong>。最高のエイジング状態で発送。
        </span>
      )
    },
    {
      badge: "VIP特典",
      text: (
        <span>
          定期便会員様は <strong className={styles.highlight}>手数料無料 (Rp 0)</strong> ＆ <strong className={styles.highlight}>最大5万ルピア送料無料</strong>!
        </span>
      )
    }
  ] : lang === "en" ? [
    {
      badge: "LIVE ROASTERY",
      text: (
        <span>
          Operational Hours: <strong className={styles.highlight}>09:00 – 17:00 WIB</strong> • Same-day Dispatch Cut-off: <strong className={styles.highlight}>15:00 WIB</strong>
        </span>
      )
    },
    {
      badge: "ROAST SCHEDULE",
      text: (
        <span>
          Fresh Roasting Batches: <strong className={styles.highlight}>Every Monday & Thursday</strong>. Peak resting freshness guaranteed.
        </span>
      )
    },
    {
      badge: "VIP PERK",
      text: (
        <span>
          Active Subscribers Enjoy <strong className={styles.highlight}>Rp 0 Admin Fee</strong> & <strong className={styles.highlight}>Free Shipping up to 50k</strong>!
        </span>
      )
    }
  ] : [
    {
      badge: "LIVE ROASTERY",
      text: (
        <span>
          Jam Kerja Roastery: <strong className={styles.highlight}>09:00 – 17:00 WIB</strong> • Cut-off Pengiriman: <strong className={styles.highlight}>15:00 WIB</strong> (Senin–Sabtu)
        </span>
      )
    },
    {
      badge: "JADWAL SANGRAI",
      text: (
        <span>
          Batch Sangrai Segar: <strong className={styles.highlight}>Setiap Senin & Kamis</strong>. Kopi dikirim dalam masa resting optimal.
        </span>
      )
    },
    {
      badge: "VIP MEMBER",
      text: (
        <span>
          Pelanggan Langganan Aktif Nikmati <strong className={styles.highlight}>Bebas Biaya Layanan (Rp 0)</strong> & <strong className={styles.highlight}>Gratis Ongkir s/d 50k</strong>!
        </span>
      )
    }
  ];

  useEffect(() => {
    const dismissed = sessionStorage.getItem("ramu_ticker_dismissed");
    if (dismissed === "true") {
      setIsVisible(false);
    }
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isVisible, announcements.length]);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem("ramu_ticker_dismissed", "true");
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + announcements.length) % announcements.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % announcements.length);
  };

  if (!isVisible || pathname?.startsWith("/admin")) {
    return null;
  }

  const currentItem = announcements[currentIndex] || announcements[0];

  return (
    <div className={styles.tickerWrapper}>
      <div className={styles.tickerInner}>
        <div className={styles.tickerContent}>
          <span className={styles.badge}>
            <span className={styles.pulsingDot} />
            {currentItem.badge}
          </span>
          <div className={styles.messageSlide} key={currentIndex}>
            <span className={styles.messageText}>{currentItem.text}</span>
          </div>
        </div>

        <div className={styles.actions}>
          <button className={styles.navArrow} onClick={handlePrev} title="Previous">
            ◀
          </button>
          <button className={styles.navArrow} onClick={handleNext} title="Next">
            ▶
          </button>
          <button className={styles.closeBtn} onClick={handleDismiss} title="Tutup Bar">
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
