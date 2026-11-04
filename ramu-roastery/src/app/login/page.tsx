"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import { useLang } from "../../context/LanguageContext";
import { useToast } from "../../context/ToastContext";
import { t } from "../../data/translations";
import styles from "./Login.module.css";

interface StorySlide {
  id: string;
  video: string;
  image: string;
  webp: string;
  chapter: {
    id: string;
    en: string;
    ja: string;
  };
  title: {
    id: string;
    en: string;
    ja: string;
  };
  quote: {
    id: string;
    en: string;
    ja: string;
  };
  subtitle: {
    id: string;
    en: string;
    ja: string;
  };
}

const STORY_SLIDES: StorySlide[] = [
  {
    id: "beans",
    video: "/slides/slide-cinematic-1.mp4",
    webp: "/slides/slide-cinematic-1.webp",
    image: "/slides/slide-cinematic-1.webp",
    chapter: {
      id: "BAB 01 • KURASI BIJI",
      en: "CHAPTER 01 • BEAN SELECTION",
      ja: "第1章 • 厳選生豆",
    },
    title: {
      id: "Harmoni Biji Kopi Sangrai",
      en: "Artisan Roasted Coffee Beans",
      ja: "極上の焙煎豆",
    },
    quote: {
      id: "Setiap butir biji kopi disortir teliti, memastikan kematangan merata dan profil rasa terroir nusantara yang murni.",
      en: "Each bean is meticulously sorted, honoring the rich volcanic terroir and artisan roasting profile.",
      ja: "一粒ずつ手作業で選別し、豊かなテロワールと澄んだ果実味をそのまま封じ込めています。",
    },
    subtitle: {
      id: "Kurasi",
      en: "Curation",
      ja: "厳選",
    },
  },
  {
    id: "extraction",
    video: "/slides/slide-cinematic-2.mp4",
    webp: "/slides/slide-cinematic-2.webp",
    image: "/slides/slide-cinematic-2.webp",
    chapter: {
      id: "BAB 02 • SENI EKSTRAKSI",
      en: "CHAPTER 02 • EXTRACTION",
      ja: "第2章 • 抽出の美",
    },
    title: {
      id: "Keemasan Crema Presisi",
      en: "Silky Golden Crema Extraction",
      ja: "黄金のクレマ",
    },
    quote: {
      id: "Ekstraksi presisi dengan tekanan ideal menghasilkan crema keemasan yang kental dan kaya aroma manis karamel alami.",
      en: "Precise extraction unlocking luscious golden crema, layered with sweet caramel complexity and velvety body.",
      ja: "緻密な抽出圧から生まれる濃密なクレマ。キャラメルのような甘さと上品な余韻が広がります。",
    },
    subtitle: {
      id: "Ekstraksi",
      en: "Espresso",
      ja: "抽出",
    },
  },
  {
    id: "pourover",
    video: "/slides/slide-cinematic-3.mp4",
    webp: "/slides/slide-cinematic-3.webp",
    image: "/slides/slide-cinematic-3.webp",
    chapter: {
      id: "BAB 03 • SEDUH MANUAL",
      en: "CHAPTER 03 • POUR OVER",
      ja: "第3章 • ハンドドリップ",
    },
    title: {
      id: "Ritual Seduh Penuh Hening",
      en: "Mindful Pour-Over Mastery",
      ja: "丁寧な点滴抽出",
    },
    quote: {
      id: "Aliran air bertahap membuka aroma bunga dan kejernihan rasa buah yang memanjakan lidah para penikmat rasa.",
      en: "A gentle spiral pour awakening pristine floral notes and vibrant sweetness in every drop.",
      ja: "お湯を優しく注ぎ、珈琲本来の花のような香りと澄んだ酸味を静かに引き出します。",
    },
    subtitle: {
      id: "Seduh",
      en: "Craft",
      ja: "点滴",
    },
  },
  {
    id: "cup",
    video: "/slides/slide-cinematic-4.mp4",
    webp: "/slides/slide-cinematic-4.webp",
    image: "/slides/slide-cinematic-4.webp",
    chapter: {
      id: "BAB 04 • KEHANGATAN CANGKIR",
      en: "CHAPTER 04 • THE CUP",
      ja: "第4章 • 心温まる一杯",
    },
    title: {
      id: "Secangkir Cerita Penuh Makna",
      en: "A Mindful Cup of Conversation",
      ja: "語らいと安らぎの空間",
    },
    quote: {
      id: "Menghubungkan setiap penikmat rasa dalam ritual kopi yang menenangkan di setiap tegukan hangat hari Anda.",
      en: "Bringing curated warmth to your mindful day, connecting coffee enthusiasts across shared quiet rituals.",
      ja: "日常に寄り添う一杯の温もり。心解き放たれる豊かな時間をお届けします。",
    },
    subtitle: {
      id: "Cangkir",
      en: "The Cup",
      ja: "温もり",
    },
  },
];

function LoginContent() {
  const { login, register, loginWithGoogle, isLoading, user } = useAuth();
  const { lang } = useLang();
  const { addToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  // Auth View State
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState("");
  const [loadingAction, setLoadingAction] = useState(false);

  // Form States
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Registration Form State
  const [regData, setRegData] = useState({
    name: "",
    phone: "",
    email: "",
    dob: "",
    gender: "male",
    password: "",
    confirmPassword: "",
  });

  // Story Carousel State
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Load Remembered Credential
  useEffect(() => {
    try {
      const saved = localStorage.getItem("ramu_remembered_login");
      if (saved) {
        setEmailOrPhone(saved);
        setRememberMe(true);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && user) {
      router.push(callbackUrl);
    }
  }, [isLoading, user, router, callbackUrl]);

  // Story Navigation Callbacks
  const nextSlide = useCallback(() => {
    setActiveSlide((prev) => (prev + 1) % STORY_SLIDES.length);
  }, []);

  const prevSlide = useCallback(() => {
    setActiveSlide((prev) => (prev - 1 + STORY_SLIDES.length) % STORY_SLIDES.length);
  }, []);

  // Hardware-friendly Slide Timer (Runs on 6000ms timer with ZERO intermediate React re-renders)
  useEffect(() => {
    if (isPaused) return;

    const timer = setTimeout(() => {
      setActiveSlide((prev) => (prev + 1) % STORY_SLIDES.length);
    }, 6000);

    return () => clearTimeout(timer);
  }, [activeSlide, isPaused]);

  if (!isLoading && user) {
    return null;
  }

  // Handle Form Submissions
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAction(true);
    setError("");
    try {
      if (rememberMe) {
        localStorage.setItem("ramu_remembered_login", emailOrPhone);
      } else {
        localStorage.removeItem("ramu_remembered_login");
      }
      const loggedUser = await login(emailOrPhone, password);
      addToast(t[lang].login_success, "success");
      if ((loggedUser as any)?.role?.toLowerCase() === 'admin') {
        window.location.href = "/admin";
      } else {
        router.push(callbackUrl);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Login failed";
      setError(errorMessage);
      addToast(errorMessage, "error");
      setPassword("");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regData.password !== regData.confirmPassword) {
      setError(t[lang].login_err_pass_match);
      return;
    }
    setLoadingAction(true);
    setError("");
    try {
      await register(regData);
      sessionStorage.setItem("ramu_just_registered", "true");
      addToast(t[lang].reg_success, "success");
      router.push(callbackUrl);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Registration failed";
      setError(errorMessage);
      addToast(errorMessage, "error");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleGoogle = async () => {
    setLoadingAction(true);
    setError("");
    try {
      await loginWithGoogle();
      router.push(callbackUrl);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Google Login failed");
    } finally {
      setLoadingAction(false);
    }
  };

  const currentStory = STORY_SLIDES[activeSlide];

  return (
    <main className={styles.loginPage}>
      <div className={styles.layoutContainer}>

        {/* LEFT COLUMN: VISUAL STORYTELLING CARD */}
        <section 
          className={`${styles.visualCol} ${isPaused ? styles.isPaused : ""}`}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          aria-label="Kisah Perjalanan Kopi Ramu"
        >
          <div className={styles.storyCard}>
            
            {/* Active Hardware-Accelerated Video Media */}
            <div className={styles.slidesContainer}>
              <div 
                key={`slide-${currentStory.id}`} 
                className={styles.slideItem}
              >
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="auto"
                  className={styles.slideVideo}
                  poster={currentStory.webp}
                  aria-hidden="true"
                >
                  <source src={currentStory.video} type="video/mp4" />
                  <img
                    src={currentStory.webp}
                    alt={currentStory.title[lang] || currentStory.title.en}
                    className={styles.slideImage}
                  />
                </video>
              </div>
            </div>

            {/* Invisible background preload for all slides to guarantee zero-latency slide transitions */}
            <div className={styles.hiddenPreloader} aria-hidden="true">
              {STORY_SLIDES.map((s) => (
                <video key={`preload-${s.id}`} preload="auto" muted playsInline src={s.video} />
              ))}
            </div>

            {/* Subtle Gradient Shadow Layer for Text Legibility */}
            <div className={styles.storyOverlay} />

            {/* Top Navigation & Chapter Header */}
            <div className={styles.storyTop}>
              <Link href="/" className={styles.backHomeLink}>
                {t[lang].login_back}
              </Link>
              
              <div className={styles.quoteHeader}>
                <span className={styles.quoteLabel}>
                  {currentStory.chapter[lang] || currentStory.chapter.en}
                </span>
                <div className={styles.hairline} />
              </div>
            </div>

            {/* Bottom Content: Display Title, Narrative Quote & Chapter Tabs */}
            <div className={styles.storyBottom}>
              <h2 className={styles.storyTitle}>
                {currentStory.title[lang] || currentStory.title.en}
              </h2>
              
              <p className={styles.storyQuote}>
                &ldquo;{currentStory.quote[lang] || currentStory.quote.en}&rdquo;
              </p>

              {/* Interactive Chapter Progress Bar */}
              <div className={styles.storyNav}>
                <div className={styles.chapterTabs} role="tablist" aria-label="Bab Cerita Kopi">
                  {STORY_SLIDES.map((slide, idx) => {
                    const isCurrent = idx === activeSlide;
                    const isPast = idx < activeSlide;

                    return (
                      <button
                        key={slide.id}
                        type="button"
                        role="tab"
                        aria-selected={isCurrent}
                        className={`${styles.chapterTab} ${isCurrent ? styles.active : ""}`}
                        onClick={() => setActiveSlide(idx)}
                      >
                        <div className={styles.tabTrack}>
                          <div
                            key={`prog-${slide.id}-${activeSlide}`}
                            className={`${styles.tabProgress} ${
                              isCurrent
                                ? styles.tabProgressActive
                                : isPast
                                ? styles.tabProgressCompleted
                                : ""
                            }`}
                          />
                        </div>
                        <span className={styles.tabText}>
                          0{idx + 1} {slide.subtitle[lang] || slide.subtitle.en}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Manual Story Controls */}
                <div className={styles.navControls}>
                  <button
                    type="button"
                    onClick={prevSlide}
                    className={styles.controlBtn}
                    aria-label="Kisah sebelumnya"
                  >
                    <svg viewBox="0 0 24 24">
                      <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={nextSlide}
                    className={styles.controlBtn}
                    aria-label="Kisah berikutnya"
                  >
                    <svg viewBox="0 0 24 24">
                      <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
                    </svg>
                  </button>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* RIGHT COLUMN: AUTHENTICATION FORM */}
        <section className={styles.authCol}>
          <div className={styles.authBox}>

            {/* Brand Header */}
            <div className={styles.brandHeader}>
              <Link href="/" className={styles.brandLink} aria-label="Ramu Roastery Home">
                <img 
                  src="/ramu_mark.png" 
                  alt="Ramu Roastery" 
                  className={styles.brandLogo} 
                />
                <span className={styles.brandText}>Ramu Roastery</span>
              </Link>
              
              <h1 className={styles.mainTitle}>
                {isLogin ? t[lang].login_welcome : t[lang].login_create}
              </h1>
              <p className={styles.subtitle}>
                {isLogin ? t[lang].login_welcome_sub : t[lang].login_create_sub}
              </p>
            </div>

            {/* Mode Switch Tabs (Masuk vs Daftar) */}
            <div className={styles.modeTabs}>
              <button
                type="button"
                className={`${styles.modeTabBtn} ${isLogin ? styles.activeMode : ""}`}
                onClick={() => {
                  setIsLogin(true);
                  setError("");
                }}
              >
                {t[lang].login_tab_login}
              </button>
              <button
                type="button"
                className={`${styles.modeTabBtn} ${!isLogin ? styles.activeMode : ""}`}
                onClick={() => {
                  setIsLogin(false);
                  setError("");
                }}
              >
                {t[lang].login_tab_reg}
              </button>
            </div>

            {/* Error Message Alert */}
            {error && (
              <div className={styles.errorAlert} role="alert">
                <svg className={styles.errorIcon} viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* SIGN IN FORM */}
            {isLogin ? (
              <form className={styles.form} onSubmit={handleLogin} noValidate>
                <div className={styles.fieldGroup}>
                  <label htmlFor="emailOrPhone" className={styles.label}>
                    {t[lang].login_email_phone}
                  </label>
                  <input
                    id="emailOrPhone"
                    type="text"
                    value={emailOrPhone}
                    onChange={(e) => setEmailOrPhone(e.target.value)}
                    placeholder="nama@email.com"
                    autoComplete="username"
                    required
                    className={styles.input}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="password" className={styles.label}>
                    {t[lang].login_password}
                  </label>
                  <div className={styles.inputWrapper}>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      required
                      className={`${styles.input} ${styles.inputWithToggle}`}
                    />
                    <button
                      type="button"
                      className={styles.eyeToggle}
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? t[lang].login_hide_pass : t[lang].login_show_pass}
                    >
                      {showPassword ? (
                        <svg viewBox="0 0 24 24">
                          <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.44-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.47-1.8c.83 0 1.5.67 1.5 1.5 0 .2-.04.38-.11.55l-1.94-1.94c.17-.07.35-.11.55-.11z" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24">
                          <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember Me and Forgot Password */}
                <div className={styles.optionsRow}>
                  <label className={styles.rememberLabel}>
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className={styles.checkbox}
                    />
                    <span>{t[lang].login_remember_me}</span>
                  </label>

                  <Link href="/faq" className={styles.forgotLink}>
                    {t[lang].login_forgot_pass}
                  </Link>
                </div>

                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={loadingAction}
                >
                  {loadingAction ? (
                    <div className={styles.spinner} />
                  ) : (
                    t[lang].login_btn_login
                  )}
                </button>
              </form>
            ) : (
              /* REGISTRATION FORM */
              <form className={styles.form} onSubmit={handleRegister} noValidate>
                <div className={styles.fieldGroup}>
                  <label htmlFor="regName" className={styles.label}>
                    {t[lang].login_fullname}
                  </label>
                  <input
                    id="regName"
                    type="text"
                    value={regData.name}
                    onChange={(e) => setRegData({ ...regData, name: e.target.value })}
                    placeholder="Budi Santoso"
                    autoComplete="name"
                    required
                    className={styles.input}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="regEmail" className={styles.label}>
                    Email
                  </label>
                  <input
                    id="regEmail"
                    type="email"
                    value={regData.email}
                    onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                    placeholder="budi@email.com"
                    autoComplete="email"
                    required
                    className={styles.input}
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.fieldGroup}>
                    <label htmlFor="regPhone" className={styles.label}>
                      {t[lang].dash_phone}
                    </label>
                    <input
                      id="regPhone"
                      type="tel"
                      value={regData.phone}
                      onChange={(e) => setRegData({ ...regData, phone: e.target.value })}
                      placeholder="0812xxxx"
                      autoComplete="tel"
                      required
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label htmlFor="regDob" className={styles.label}>
                      {t[lang].login_dob}
                    </label>
                    <input
                      id="regDob"
                      type="date"
                      value={regData.dob}
                      onChange={(e) => setRegData({ ...regData, dob: e.target.value })}
                      required
                      className={styles.input}
                    />
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="regGender" className={styles.label}>
                    {t[lang].login_gender}
                  </label>
                  <select
                    id="regGender"
                    value={regData.gender}
                    onChange={(e) => setRegData({ ...regData, gender: e.target.value })}
                    className={styles.select}
                  >
                    <option value="male">{t[lang].login_male}</option>
                    <option value="female">{t[lang].login_female}</option>
                  </select>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.fieldGroup}>
                    <label htmlFor="regPassword" className={styles.label}>
                      {t[lang].login_password}
                    </label>
                    <div className={styles.inputWrapper}>
                      <input
                        id="regPassword"
                        type={showPassword ? "text" : "password"}
                        value={regData.password}
                        onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        required
                        className={`${styles.input} ${styles.inputWithToggle}`}
                      />
                      <button
                        type="button"
                        className={styles.eyeToggle}
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? t[lang].login_hide_pass : t[lang].login_show_pass}
                      >
                        {showPassword ? (
                          <svg viewBox="0 0 24 24">
                            <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.44-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24">
                            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className={styles.fieldGroup}>
                    <label htmlFor="regConfirmPassword" className={styles.label}>
                      {t[lang].login_confirm_pass}
                    </label>
                    <div className={styles.inputWrapper}>
                      <input
                        id="regConfirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={regData.confirmPassword}
                        onChange={(e) => setRegData({ ...regData, confirmPassword: e.target.value })}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        required
                        className={`${styles.input} ${styles.inputWithToggle}`}
                      />
                      <button
                        type="button"
                        className={styles.eyeToggle}
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label={showConfirmPassword ? t[lang].login_hide_pass : t[lang].login_show_pass}
                      >
                        {showConfirmPassword ? (
                          <svg viewBox="0 0 24 24">
                            <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.44-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.47-1.8c.83 0 1.5.67 1.5 1.5 0 .2-.04.38-.11.55l-1.94-1.94c.17-.07.35-.11.55-.11z" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24">
                            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={loadingAction}
                >
                  {loadingAction ? (
                    <div className={styles.spinner} />
                  ) : (
                    t[lang].login_btn_reg
                  )}
                </button>
              </form>
            )}

            {/* Divider */}
            <div className={styles.divider}>{t[lang].login_or}</div>

            {/* Google Authentication Button */}
            <button
              type="button"
              className={styles.googleBtn}
              onClick={handleGoogle}
              disabled={loadingAction}
            >
              <svg className={styles.googleIcon} viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span>{t[lang].login_google}</span>
            </button>

            {/* Switch Mode Footer */}
            <div className={styles.switchFooter}>
              {isLogin ? (
                <span>
                  {t[lang].login_no_account}
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(false);
                      setError("");
                    }}
                    className={styles.switchLink}
                  >
                    {t[lang].login_signup_link}
                  </button>
                </span>
              ) : (
                <span>
                  {t[lang].login_has_account}
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(true);
                      setError("");
                    }}
                    className={styles.switchLink}
                  >
                    {t[lang].login_signin_link}
                  </button>
                </span>
              )}
            </div>

            {/* Admin Portal Shortcut */}
            <div style={{ marginTop: '1.25rem', textAlign: 'center', paddingTop: '1rem', borderTop: '1px solid #ECE8DF' }}>
              <Link 
                href="/admin/login" 
                style={{ 
                  fontSize: '0.78rem', 
                  color: '#8A8275', 
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontWeight: 500
                }}
              >
                <span>Portal Masuk Admin Roastery &rarr;</span>
              </Link>
            </div>

          </div>
        </section>

      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: "1rem", color: "#666" }}>Loading Ramu Roastery...</div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
