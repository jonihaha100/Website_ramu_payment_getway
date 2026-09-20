"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { useLang } from "../../context/LanguageContext";
import { useToast } from "../../context/ToastContext";
import { t } from "../../data/translations";
import styles from "./Login.module.css";
import Link from "next/link";

function LoginContent() {
  const { login, register, loginWithGoogle, isLoading, user } = useAuth();
  const { lang } = useLang();
  const { addToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState("");
  const [loadingAction, setLoadingAction] = useState(false);

  // Form states
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  
  const [regData, setRegData] = useState({
    name: "",
    phone: "",
    email: "",
    dob: "",
    gender: "male",
    password: "",
    confirmPassword: "",
  });

  // If already logged in, redirect
  useEffect(() => {
    if (!isLoading && user) {
      router.push(callbackUrl);
    }
  }, [isLoading, user, router, callbackUrl]);

  if (!isLoading && user) {
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAction(true);
    setError("");
    try {
      await login(emailOrPhone, password);
      addToast(t[lang].login_success, "success");
      router.push(callbackUrl);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Login failed";
      setError(errorMessage);
      addToast(errorMessage, "error");
      setPassword(""); // Clear password field for better UX/security
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

  return (
    <main className={styles.loginPage}>
      <div className={styles.splitLayout}>
        
        {/* Left Visual Pane */}
        <div className={styles.leftPane}>
          <div className={styles.glassOverlay}></div>
          <div className={styles.leftContent}>
            <Link href="/" style={{ color: 'white', textDecoration: 'none', display: 'inline-block', marginBottom: '2rem', opacity: 0.8, fontSize: '0.9rem' }}>
              {t[lang].login_back}
            </Link>
            <h1 className={styles.leftTitle}>
              {t[lang].login_title_1}
            </h1>
            <p className={styles.leftText}>
              {t[lang].login_desc_1}
            </p>
          </div>
        </div>

        {/* Right Auth Pane */}
        <div className={styles.rightPane}>
          <div className={styles.authCard}>
            
            <div className={styles.authHeader}>
              <h2 className={styles.authTitle}>
                {isLogin ? t[lang].login_welcome : t[lang].login_create}
              </h2>
              <p className={styles.authSubtitle}>
                {isLogin ? t[lang].login_welcome_sub : t[lang].login_create_sub}
              </p>
            </div>
            
            <div className={styles.tabs}>
              <button 
                className={`${styles.tabBtn} ${isLogin ? styles.active : ""}`}
                onClick={() => { setIsLogin(true); setError(""); }}
              >
                {t[lang].login_tab_login}
              </button>
              <button 
                className={`${styles.tabBtn} ${!isLogin ? styles.active : ""}`}
                onClick={() => { setIsLogin(false); setError(""); }}
              >
                {t[lang].login_tab_reg}
              </button>
            </div>

            {error && (
              <div className={styles.error}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M11 15h2v2h-2zm0-8h2v6h-2zm.99-5C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/></svg>
                {error}
              </div>
            )}

            {isLogin ? (
              <form className={styles.form} onSubmit={handleLogin}>
                <div className={styles.field}>
                  <label>{t[lang].login_email_phone}</label>
                  <input 
                    type="text" 
                    value={emailOrPhone} 
                    onChange={e => setEmailOrPhone(e.target.value)} 
                    placeholder="nama@email.com"
                    required 
                  />
                </div>
                <div className={styles.field}>
                  <label>{t[lang].login_password}</label>
                  <input 
                    type="password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    placeholder="••••••••"
                    required 
                  />
                </div>
                <button type="submit" className={`btn-primary ${styles.submitBtn}`} disabled={loadingAction}>
                  {loadingAction ? t[lang].login_processing : t[lang].login_btn_login}
                </button>
              </form>
            ) : (
              <form className={styles.form} onSubmit={handleRegister}>
                <div className={styles.field}>
                  <label>{t[lang].login_fullname}</label>
                  <input type="text" value={regData.name} onChange={e => setRegData({...regData, name: e.target.value})} placeholder="Budi Santoso" required />
                </div>
                
                <div className={styles.field}>
                  <label>Email</label>
                  <input type="email" value={regData.email} onChange={e => setRegData({...regData, email: e.target.value})} placeholder="budi@email.com" required />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.field}>
                    <label>{t[lang].dash_phone}</label>
                    <input type="tel" value={regData.phone} onChange={e => setRegData({...regData, phone: e.target.value})} placeholder="0812xxxx" required />
                  </div>
                  <div className={styles.field}>
                    <label>{t[lang].login_dob}</label>
                    <input type="date" value={regData.dob} onChange={e => setRegData({...regData, dob: e.target.value})} required />
                  </div>
                </div>

                <div className={styles.field}>
                  <label>{t[lang].login_gender}</label>
                  <select value={regData.gender} onChange={e => setRegData({...regData, gender: e.target.value})}>
                    <option value="male">{t[lang].login_male}</option>
                    <option value="female">{t[lang].login_female}</option>
                  </select>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.field}>
                    <label>{t[lang].login_password}</label>
                    <input type="password" value={regData.password} onChange={e => setRegData({...regData, password: e.target.value})} placeholder="••••••••" required />
                  </div>
                  <div className={styles.field}>
                    <label>{t[lang].login_confirm_pass}</label>
                    <input type="password" value={regData.confirmPassword} onChange={e => setRegData({...regData, confirmPassword: e.target.value})} placeholder="••••••••" required />
                  </div>
                </div>

                <button type="submit" className={`btn-primary ${styles.submitBtn}`} disabled={loadingAction}>
                  {loadingAction ? t[lang].login_processing : t[lang].login_btn_reg}
                </button>
              </form>
            )}

            <div className={styles.divider}>{t[lang].login_or}</div>

            <button className={styles.googleBtn} onClick={handleGoogle} type="button" disabled={loadingAction}>
              <svg className={styles.googleIcon} viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                <path d="M1 1h22v22H1z" fill="none"/>
              </svg>
              {t[lang].login_google}
            </button>

          </div>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ padding: '4rem', textAlign: 'center' }}>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
