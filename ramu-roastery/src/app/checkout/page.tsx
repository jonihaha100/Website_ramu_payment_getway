"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { useLang } from "../../context/LanguageContext";
import { useToast } from "../../context/ToastContext";
import { t } from "../../data/translations";
import { CustomerDetails, CheckoutPayload } from "../../types/cart";
import { indonesiaLocations, provinces } from "../../data/indonesiaLocations";
import styles from "./Checkout.module.css";

// Declare global snap object
declare global {
  interface Window {
    snap: any;
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCart();
  const { user, isLoading } = useAuth();
  const { lang } = useLang();
  const translations = t[lang as keyof typeof t];
  
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Shipping states
  const [shippingOptions, setShippingOptions] = useState<any[]>([]);
  const [loadingShipping, setLoadingShipping] = useState(false);
  const [selectedShippingCost, setSelectedShippingCost] = useState<number>(0);

  // Settings & Promos
  const [storeSettings, setStoreSettings] = useState<any>(null);
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  // Address Book
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);

  // Points Redemption
  const [pointsBalance, setPointsBalance] = useState(0);
  const [redeemPoints, setRedeemPoints] = useState(0);
  const [pointsDiscount, setPointsDiscount] = useState(0);

  // VIP & Roastery Operational Features
  const [isTebengKirim, setIsTebengKirim] = useState(false);
  const [grindNotes, setGrindNotes] = useState("");

  useEffect(() => {
    fetch('/api/settings').then(res => res.json()).then(data => {
      if (!data.error) setStoreSettings(data);
    });
  }, []);

  // Fetch saved addresses
  useEffect(() => {
    if (user?.email) {
      fetch(`/api/addresses?email=${encodeURIComponent(user.email)}`)
        .then(res => res.json())
        .then(data => { if (Array.isArray(data)) setSavedAddresses(data); })
        .catch(() => {});
    }
  }, [user?.email]);

  // Fetch points balance
  useEffect(() => {
    if (user?.email) {
      fetch(`/api/points?email=${encodeURIComponent(user.email)}`)
        .then(res => res.json())
        .then(data => { if (data.balance !== undefined) setPointsBalance(data.balance); })
        .catch(() => {});
    }
  }, [user?.email]);

  const handleSelectAddress = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const addrId = e.target.value;
    if (!addrId) return;
    const addr = savedAddresses.find(a => a.id === addrId);
    if (addr) {
      setCustomer(prev => ({
        ...prev,
        firstName: addr.firstName || '',
        lastName: addr.lastName || '',
        phone: addr.phone || prev.phone,
        address: addr.address,
        province: addr.province,
        city: addr.city,
        subdistrict: addr.subdistrict || '',
        village: addr.village || '',
        postalCode: addr.postalCode,
      }));
      addToast(
        lang === 'ja'
          ? `お届け先「${addr.label}」を選択しました`
          : lang === 'en'
          ? `Address "${addr.label}" selected`
          : `Alamat "${addr.label}" dipilih`,
        'info'
      );
    }
  };

  const handleRedeemPoints = () => {
    if (redeemPoints <= 0) return;
    if (redeemPoints > pointsBalance) {
      addToast(
        lang === 'ja'
          ? 'ポイント残高が不足しています'
          : lang === 'en'
          ? 'Insufficient points balance'
          : 'Poin tidak mencukupi',
        'error'
      );
      return;
    }
    // 1 poin = Rp 100 discount
    setPointsDiscount(redeemPoints * 100);
    addToast(
      lang === 'ja'
        ? `${redeemPoints} ポイント使用 = Rp ${(redeemPoints * 100).toLocaleString('id-ID')} 割引`
        : lang === 'en'
        ? `${redeemPoints} points redeemed = Rp ${(redeemPoints * 100).toLocaleString('id-ID')} discount`
        : `${redeemPoints} poin ditukar = diskon Rp ${(redeemPoints * 100).toLocaleString('id-ID')}`,
      'success'
    );
  };

  // Determine B2B discount early
  const isB2B = user?.role === 'b2b';
  const b2bDiscountRate = 0.20; // 20% discount for wholesale


  const [customer, setCustomer] = useState<CustomerDetails>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    province: "",
    city: "",
    subdistrict: "",
    village: "",
    postalCode: "",
  });

  // Load draft from localStorage and autofill user details when user is loaded
  useEffect(() => {
    if (user) {
      let defaultCustomer: Partial<CustomerDetails> = {
        email: user.email || "",
        firstName: user.name ? user.name.split(" ")[0] : "",
        lastName: user.name && user.name.split(" ").length > 1 ? user.name.split(" ").slice(1).join(" ") : "",
      };

      const draftKey = `ramu_checkout_draft_${user.email}`;
      const draft = localStorage.getItem(draftKey);
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          defaultCustomer = { ...defaultCustomer, ...parsed };
        } catch (e) {}
      }

      setCustomer(prev => ({ ...prev, ...defaultCustomer }));
    }
  }, [user]);

  // Save draft whenever customer changes
  useEffect(() => {
    if (user?.email && (customer.firstName || customer.phone || customer.address)) {
      const draftKey = `ramu_checkout_draft_${user.email}`;
      localStorage.setItem(draftKey, JSON.stringify(customer));
    }
  }, [customer, user]);

  const totalWeightGrams = items.reduce((sum, item) => sum + (item.weight * item.quantity), 0);
  const totalWeightKg = Math.max(1, Math.ceil(totalWeightGrams / 1000));
  
  // Fetch dynamic shipping cost when city is entered
  useEffect(() => {
    const fetchShipping = async () => {
      if (customer.city && customer.city.length > 3) {
        setLoadingShipping(true);
        try {
          const res = await fetch("/api/shipping/cost", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ destination: customer.city, weight: totalWeightGrams })
          });
          const data = await res.json();
          if (data.success && data.data.length > 0) {
            setShippingOptions(data.data);
            setSelectedShippingCost(data.data[0].cost); // Default to first option
          } else {
            setShippingOptions([]);
            setSelectedShippingCost(25000 * totalWeightKg); // Fallback dummy
          }
        } catch (e) {
          console.error(e);
          setSelectedShippingCost(25000 * totalWeightKg); // Fallback dummy
        } finally {
          setLoadingShipping(false);
        }
      }
    };
    
    // Simple debounce
    const timeoutId = setTimeout(() => {
      fetchShipping();
    }, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [customer.city, totalWeightGrams, totalWeightKg]);

  const waNumber = "6281221341"; // Example placeholder
  const cartDetails = items.map(item => `- ${item.name} (${item.weight >= 1000 ? item.weight/1000 + 'kg' : item.weight + 'g'} - ${item.grind}) x${item.quantity}`).join("%0A");
  const waIntlMessage = `Hello Ramu Roastery!%0A%0AI would like to inquire about international shipping for the following items:%0A${cartDetails}%0A%0APlease let me know the shipping options and total cost to my country. Thank you!`;
  const waIntlLink = `https://wa.me/${waNumber}?text=${waIntlMessage}`;

  const hasSubscriptionItem = items.some(item => item.isSubscription || item.id?.includes('sub-'));
  const isVip = user?.isVip || (user?.role as string)?.toUpperCase() === 'VIP' || hasSubscriptionItem;
  // Free admin fee (Rp 0) for VIP subscriber privilege
  const adminFee = isVip ? 0 : (storeSettings?.adminFee || 2500);
  
  // B2B Pricing logic
  let baseTotal = totalPrice;
  let b2bDiscountAmount = 0;
  if (isB2B) {
    b2bDiscountAmount = Math.round(totalPrice * b2bDiscountRate);
    baseTotal = totalPrice - b2bDiscountAmount;
  }

  // Promo code logic
  let promoDiscountAmount = 0;
  if (appliedPromo) {
    if (appliedPromo.discountType === 'percentage') {
      promoDiscountAmount = Math.round(baseTotal * (appliedPromo.discountValue / 100));
    } else {
      promoDiscountAmount = appliedPromo.discountValue;
    }
    // Prevent negative total
    if (promoDiscountAmount > baseTotal) promoDiscountAmount = baseTotal;
  }

  const subtotalAfterDiscounts = baseTotal - promoDiscountAmount - pointsDiscount;
  const taxRate = storeSettings?.taxRate || 10;
  const tax = Math.round(subtotalAfterDiscounts * (taxRate / 100));

  let finalShippingCost = selectedShippingCost;
  if (isTebengKirim) {
    const isBandungArea = customer.city?.toLowerCase().includes("bandung") || customer.city?.toLowerCase().includes("cimahi");
    if (isBandungArea) {
      finalShippingCost = 0;
    } else {
      finalShippingCost = Math.max(0, selectedShippingCost - 12000);
    }
  } else if (storeSettings?.isFreeShippingEnabled && subtotalAfterDiscounts >= storeSettings.freeShippingThreshold) {
    finalShippingCost = 0;
  } else if (finalShippingCost === 0 && storeSettings?.flatShippingRate > 0) {
    // Optional fallback if no dynamic shipping fetched
    finalShippingCost = storeSettings.flatShippingRate;
  }

  const grandTotal = subtotalAfterDiscounts + tax + finalShippingCost + adminFee;

  const handleApplyPromo = async () => {
    setPromoError(null);
    if (!promoCodeInput) return;
    
    try {
      const res = await fetch('/api/promos');
      const promos = await res.json();
      if (!Array.isArray(promos)) throw new Error("Gagal mengambil data promo");
      
      const promo = promos.find((p: any) => p.code === promoCodeInput.toUpperCase());
      if (!promo) {
        setPromoError(
          lang === 'ja'
            ? "指定されたクーポンコードが見つかりません"
            : (lang === 'en' ? "Promo code not found" : "Kode promo tidak ditemukan")
        );
        return;
      }
      if (!promo.isActive) {
        setPromoError(
          lang === 'ja'
            ? "このクーポンは現在ご利用いただけません"
            : (lang === 'en' ? "Promo code is no longer active" : "Kode promo sudah tidak aktif")
        );
        return;
      }
      if (promo.validUntil && new Date(promo.validUntil).getTime() < new Date().getTime()) {
        setPromoError(
          lang === 'ja'
            ? "このクーポンの有効期限が切れています"
            : (lang === 'en' ? "Promo code has expired" : "Kode promo telah kedaluwarsa")
        );
        return;
      }
      if (promo.maxUses && promo.usedCount >= promo.maxUses) {
        setPromoError(
          lang === 'ja'
            ? "このクーポンは上限回数に達したため利用できません"
            : (lang === 'en' ? "Promo code usage limit reached" : "Kode promo sudah mencapai batas kuota pemakaian")
        );
        return;
      }
      
      setAppliedPromo(promo);
      setPromoCodeInput("");
    } catch(e: any) {
      setPromoError(
        lang === 'ja'
          ? "クーポンの確認中にエラーが発生しました"
          : (lang === 'en' ? "Error verifying promo code" : e.message)
      );
    }
  };

  useEffect(() => {
    if (items.length === 0 && !loading && !isLoading) {
      router.push("/catalog");
    }
  }, [items, router, loading, isLoading]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login?callbackUrl=/checkout");
    }
  }, [user, isLoading, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCustomer(prev => ({ ...prev, [name]: value }));
  };

  const handleShippingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedShippingCost(Number(e.target.value));
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload: CheckoutPayload = {
        items,
        customer,
        shippingCost: finalShippingCost,
        adminFee,
        tax,
        promoCode: appliedPromo?.code,
        discount: promoDiscountAmount, // Used specifically for Promo Code discount
        b2bDiscount: b2bDiscountAmount,
        redeemPoints: redeemPoints,
        isVip,
        isTebeng: isTebengKirim,
        grindNotes: grindNotes,
        notes: [
          isTebengKirim ? "[TEBENG KIRIM: Jadwal Batch Sangrai]" : "",
          grindNotes ? `Catatan Gilingan: ${grindNotes}` : "",
        ].filter(Boolean).join(" | ")
      } as any;

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      if (data.paymentType === "ipay88" && data.fields) {
        // Build a dynamic form and submit to iPay88
        const form = document.createElement("form");
        form.method = "POST";
        form.action = data.actionUrl;
        form.style.display = "none";
        
        Object.keys(data.fields).forEach(key => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = data.fields[key];
          form.appendChild(input);
        });
        
        document.body.appendChild(form);
        // Clear cart before redirecting
        localStorage.removeItem(`ramu_checkout_draft_${user?.email}`);
        clearCart();
        form.submit();
      } else {
        // DUMMY FLOW (Fallback)
        addToast(
          lang === 'ja'
            ? `ご注文 ${data.orderId} を承りました！マイページの注文履歴をご確認ください。`
            : lang === 'en'
            ? `Order ${data.orderId} placed successfully! Please check your order history.`
            : `Pesanan ${data.orderId} berhasil dibuat! Silakan cek daftar transaksi Anda.`,
          'success'
        );
        localStorage.removeItem(`ramu_checkout_draft_${user?.email}`);
        clearCart();
        router.push("/dashboard/orders?newOrder=true");
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
      setLoading(false);
    }
  };

  if (isLoading || !user || items.length === 0) return null;

  return (
    <main className={styles.checkoutPage}>

      
      <div className="container">
        <h1 className={styles.title}>{translations.checkout_title}</h1>
        
        <div className={styles.grid}>
          <div className={styles.formSection}>
            <h2>{translations.checkout_shipping}</h2>

            <div className={styles.intlBanner}>
              <strong>🌍 International Shipping / Ekspor Luar Negeri</strong>
              <span>
                {lang === 'ja'
                  ? '日本への発送・海外配送に対応しております。配送料・納期・通関等のご相談はWhatsAppにて日本語または英語でお気軽にお問い合わせください。'
                  : (lang === 'en'
                    ? 'Are you outside Indonesia? We ship worldwide! Please contact us via WhatsApp for international shipping rates and customs info.'
                    : 'Sedang di luar negeri? Kami melayani ekspor! Hubungi via WhatsApp untuk ongkos kirim.')}
              </span>
              <a href={waIntlLink} target="_blank" rel="noopener noreferrer">
                {lang === 'ja' ? 'WhatsAppで問い合わせる（海外発送）' : (lang === 'en' ? 'Chat WhatsApp (International Order)' : 'Chat WhatsApp (Order Luar Negeri)')}
              </a>
            </div>

            {/* Address Book Selector */}
            {savedAddresses.length > 0 && (
              <div className={styles.addressSelector}>
                <label style={{ fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {lang === 'ja' ? '📍 保存されたお届け先を選択' : (lang === 'en' ? '📍 Select Saved Address' : '📍 Pilih Alamat Tersimpan')}
                </label>
                <select onChange={handleSelectAddress} defaultValue="">
                  <option value="">
                    {lang === 'ja' ? '-- お届け先を選択するか手入力 --' : (lang === 'en' ? '-- Select address or enter manually --' : '-- Pilih alamat atau isi manual --')}
                  </option>
                  {savedAddresses.map(addr => (
                    <option key={addr.id} value={addr.id}>
                      {addr.isDefault ? '★ ' : ''}{addr.label} — {addr.firstName} {addr.lastName}, {addr.city}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {error && <div className={styles.error}>{error}</div>}
            <form onSubmit={handleCheckout} className={styles.form}>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label>{translations.checkout_fname}</label>
                  <input type="text" name="firstName" value={customer.firstName} onChange={handleInputChange} required />
                </div>
                <div className={styles.field}>
                  <label>{translations.checkout_lname}</label>
                  <input type="text" name="lastName" value={customer.lastName} onChange={handleInputChange} required />
                </div>
              </div>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label>{translations.dash_email}</label>
                  <input type="email" name="email" value={customer.email} onChange={handleInputChange} required />
                </div>
                <div className={styles.field}>
                  <label>{translations.dash_phone}</label>
                  <input type="tel" name="phone" value={customer.phone} onChange={handleInputChange} required />
                </div>
              </div>
              <div className={styles.field}>
                <label>{translations.checkout_address}</label>
                <textarea name="address" value={customer.address} onChange={handleInputChange} required rows={3}></textarea>
              </div>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label>{lang === 'ja' ? '州・県（インドネシア国内）' : (lang === 'en' ? 'Province' : 'Provinsi')}</label>
                  <select 
                    name="province"
                    value={customer.province || ""}
                    onChange={(e) => {
                      setCustomer(prev => ({ ...prev, province: e.target.value, city: "" }));
                    }}
                    required
                  >
                    <option value="" disabled>{lang === 'ja' ? '州・県を選択...' : (lang === 'en' ? 'Select Province...' : 'Pilih Provinsi...')}</option>
                    {provinces.map(prov => (
                      <option key={prov} value={prov}>{prov}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.field}>
                  <label>{translations.checkout_city} / Kabupaten</label>
                  <select 
                    name="city"
                    value={customer.city}
                    onChange={handleInputChange}
                    required
                    disabled={!customer.province}
                  >
                    <option value="" disabled>{lang === 'ja' ? '市・県を選択...' : (lang === 'en' ? 'Select City...' : 'Pilih Kota/Kabupaten...')}</option>
                    {customer.province && indonesiaLocations[customer.province as keyof typeof indonesiaLocations]?.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label>{lang === 'ja' ? '郡 / ディストリクト' : (lang === 'en' ? 'District / Sub-district' : 'Kecamatan')}</label>
                  <input type="text" name="subdistrict" value={customer.subdistrict || ""} onChange={handleInputChange} required placeholder={lang === 'ja' ? '例: Mampang Prapatan' : 'Contoh: Mampang Prapatan'} />
                </div>
                <div className={styles.field}>
                  <label>{lang === 'ja' ? '村 / 町名' : (lang === 'en' ? 'Village / Ward' : 'Kelurahan / Desa')}</label>
                  <input type="text" name="village" value={customer.village || ""} onChange={handleInputChange} required placeholder={lang === 'ja' ? '例: Bangka' : 'Contoh: Bangka'} />
                </div>
              </div>
              <div className={styles.field}>
                <label>{translations.checkout_postal}</label>
                <input type="text" name="postalCode" value={customer.postalCode} onChange={handleInputChange} required />
              </div>
              
              <div className={styles.field} style={{ marginTop: "1rem" }}>
                <label>{lang === 'ja' ? '配送サービス' : (lang === 'en' ? 'Shipping Service' : 'Layanan Pengiriman')}</label>
                {loadingShipping ? (
                  <select disabled style={{ opacity: 0.7, backgroundColor: "#f9fafb" }}>
                    <option>{lang === 'ja' ? '⏳ 配送料を計算中...' : (lang === 'en' ? '⏳ Calculating shipping fee...' : '⏳ Sedang menghitung ongkos kirim...')}</option>
                  </select>
                ) : shippingOptions.length > 0 ? (
                  <select onChange={handleShippingChange} value={selectedShippingCost} required>
                    {shippingOptions.map((opt, idx) => (
                      <option key={idx} value={opt.cost}>
                        {opt.courier} {opt.service} - Rp {opt.cost.toLocaleString("id-ID")} ({opt.etd})
                      </option>
                    ))}
                  </select>
                ) : (
                  <select disabled style={{ opacity: 0.7, backgroundColor: "#f9fafb" }}>
                    <option>{lang === 'ja' ? '先に州・県と市区町村を選択してください' : (lang === 'en' ? 'Please select Province & City first' : 'Pilih Provinsi & Kota terlebih dahulu')}</option>
                  </select>
                )}
                {/* B2B Cargo Badge */}
                {totalWeightGrams >= 5000 && (
                  <div style={{
                    marginTop: '0.5rem',
                    padding: '0.6rem 0.85rem',
                    borderRadius: '0.375rem',
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    fontSize: '0.75rem',
                    color: '#1d4ed8',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <span>🚚</span>
                    <span><strong>{lang === 'ja' ? `大口配送 (${totalWeightKg} kg):` : (lang === 'en' ? `Bulk Cargo Package (${totalWeightKg} kg):` : `Paket Partai Besar (${totalWeightKg} kg):`)}</strong> {lang === 'ja' ? '格安J&T CARGO便が自動的に適用可能です！' : (lang === 'en' ? 'Cost-effective J&T CARGO is automatically available in the courier list above!' : 'Layanan J&T CARGO ekonomis otomatis aktif di daftar kurir di atas!')}</span>
                  </div>
                )}

                {/* Tebeng Kirim (Consolidated Delivery) */}
                <div style={{
                  marginTop: '0.75rem',
                  padding: '0.85rem 1rem',
                  borderRadius: '0.5rem',
                  background: isTebengKirim ? '#ecfdf5' : '#f8fafc',
                  border: `1px solid ${isTebengKirim ? '#10b981' : '#e2e8f0'}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }} onClick={() => setIsTebengKirim(!isTebengKirim)}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', margin: 0 }}>
                    <input
                      type="checkbox"
                      checked={isTebengKirim}
                      onChange={(e) => setIsTebengKirim(e.target.checked)}
                      style={{ width: '16px', height: '16px', accentColor: '#059669', cursor: 'pointer' }}
                    />
                    <div>
                      <strong style={{ fontSize: '0.85rem', color: '#0f172a', display: 'block' }}>
                        {lang === 'ja' ? '📦 焙煎バッチ便（月曜・木曜発送おまとめ便）' : (lang === 'en' ? '📦 Batch Roast Shipping (Mon & Thu Consolidated)' : '📦 Opsi Tebeng Kirim (Jadwal Batch Sangrai)')}
                      </strong>
                      <span style={{ fontSize: '0.75rem', color: '#475569', lineHeight: 1.3 }}>
                        {lang === 'ja' ? 'ラム・ロースタリーの定期焙煎便（月曜・木曜）に同梱。新鮮な焙煎直後の豆をお届けします！' : (lang === 'en' ? 'Consolidate with Ramu Roastery regular roast batches (Mon & Thu). Free local shipping in Bandung or discounted out-of-town freight!' : 'Gabung pengiriman reguler Ramu Roastery (Senin & Kamis). Free ongkir sesama Bandung/Cimahi, atau subsidi ongkir luar kota!')}
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Custom Grinding Notes */}
              <div className={styles.field} style={{ marginTop: "1rem" }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span>☕</span> {lang === 'ja' ? '挽き目・抽出に関する特別なご要望（任意）' : (lang === 'en' ? 'Grind & Brewing Special Notes (Optional)' : 'Catatan Khusus Profil Gilingan & Seduh (Opsional)')}
                </label>
                <textarea
                  value={grindNotes}
                  onChange={(e) => setGrindNotes(e.target.value)}
                  placeholder={lang === 'ja' ? '例：V60ペーパーフィルター用、エスプレッソ用、コールドブリュー用など...' : (lang === 'en' ? 'e.g. Ground for V60 Paper Filter / Espresso / Cold Brew...' : 'Contoh: Tolong giling untuk V60 Paper Filter / Espresso Flair / Cold Brew coarse grind, dll...')}
                  rows={2}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '0.375rem', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                />
                <span style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: '0.25rem' }}>
                  {lang === 'ja' ? '抽出器具の好みに応じて、ロースタリーにて最適なメッシュに挽き分けてお届けします。' : (lang === 'en' ? 'Our roastery will calibrate the grind to match your brewing device.' : 'Roastery kami akan menyesuaikan kalibrasi gilingan dengan preferensi alat seduh Anda.')}
                </span>
              </div>

              {/* Operational Hours & Cut-off Notice */}
              <div style={{
                marginTop: '1rem',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                fontSize: '0.78rem',
                color: '#334155',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem'
              }}>
                <span style={{ fontSize: '1.2rem' }}>⏰</span>
                <div style={{ lineHeight: 1.4 }}>
                  <strong>{lang === 'ja' ? 'ロースタリー営業時間:' : (lang === 'en' ? 'Roastery Hours:' : 'Jam Operasional Roastery:')}</strong> 09:00 – 17:00 WIB ({lang === 'ja' ? '月〜土' : (lang === 'en' ? 'Mon – Sat' : 'Senin – Sabtu')}).<br />
                  {lang === 'ja' ? (
                    <><strong>15:00 WIB</strong> までのご注文は当日発送または次回の焙煎バッチにて発送されます。</>
                  ) : lang === 'en' ? (
                    <>Orders placed before <strong>15:00 WIB</strong> will be processed same-day or in the next fresh roast batch.</>
                  ) : (
                    <>Pesanan sebelum <strong>15:00 WIB</strong> diproses hari yang sama / batch sangrai berikutnya.</>
                  )}
                </div>
              </div>
              
              <div className={styles.field} style={{ marginTop: "1rem" }}>
                <label>{lang === 'ja' ? 'プロモーションコード（任意）' : (lang === 'en' ? 'Promo Code (Optional)' : 'Kode Promo (Opsional)')}</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input 
                    type="text" 
                    value={promoCodeInput}
                    onChange={(e) => setPromoCodeInput(e.target.value)}
                    placeholder={lang === 'ja' ? 'コードを入力...' : (lang === 'en' ? 'Enter code...' : 'Masukkan kode...')}
                    disabled={appliedPromo !== null}
                    style={{ textTransform: 'uppercase' }}
                  />
                  {!appliedPromo ? (
                    <button type="button" onClick={handleApplyPromo} className="btn-outline" style={{ padding: '0.5rem 1rem' }}>
                      {lang === 'ja' ? '適用' : (lang === 'en' ? 'Apply' : 'Apply')}
                    </button>
                  ) : (
                    <button type="button" onClick={() => setAppliedPromo(null)} className="btn-outline" style={{ padding: '0.5rem 1rem', color: '#ef4444', borderColor: '#ef4444' }}>
                      {lang === 'ja' ? '解除' : (lang === 'en' ? 'Cancel' : 'Batal')}
                    </button>
                  )}
                </div>
                {promoError && <p style={{ color: '#ef4444', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>{promoError}</p>}
                {appliedPromo && <p style={{ color: '#10b981', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>✅ {lang === 'ja' ? `プロモーション「${appliedPromo.code}」を適用しました！` : (lang === 'en' ? `Promo "${appliedPromo.code}" applied!` : `Promo "${appliedPromo.code}" diterapkan!`)}</p>}
              </div>

              {/* Points Redemption */}
              {pointsBalance > 0 && (
                <div className={styles.field} style={{ marginTop: '1rem' }}>
                  <label>{lang === 'ja' ? `🏆 ラムポイントの利用（残高: ${pointsBalance} pt）` : (lang === 'en' ? `🏆 Redeem Ramu Points (Balance: ${pointsBalance} pts)` : `🏆 Tukar Ramu Points (Saldo: ${pointsBalance} poin)`)}</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="number"
                      min={0}
                      max={pointsBalance}
                      value={redeemPoints || ''}
                      onChange={(e) => { setRedeemPoints(Number(e.target.value)); setPointsDiscount(0); }}
                      placeholder={lang === 'ja' ? `最大 ${pointsBalance} pt` : (lang === 'en' ? `Max ${pointsBalance} pts` : `Maks. ${pointsBalance} poin`)}
                      disabled={pointsDiscount > 0}
                    />
                    {pointsDiscount === 0 ? (
                      <button type="button" onClick={handleRedeemPoints} className="btn-outline" style={{ padding: '0.5rem 1rem' }}>
                        {lang === 'ja' ? '利用' : (lang === 'en' ? 'Redeem' : 'Tukar')}
                      </button>
                    ) : (
                      <button type="button" onClick={() => { setPointsDiscount(0); setRedeemPoints(0); }} className="btn-outline" style={{ padding: '0.5rem 1rem', color: '#ef4444', borderColor: '#ef4444' }}>
                        {lang === 'ja' ? '解除' : (lang === 'en' ? 'Cancel' : 'Batal')}
                      </button>
                    )}
                  </div>
                  {pointsDiscount > 0 && <p style={{ color: '#10b981', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>✅ {redeemPoints} pt = Rp {pointsDiscount.toLocaleString('id-ID')} OFF</p>}
                  <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: '0.25rem 0 0 0' }}>1 pt = Rp 100 {lang === 'ja' ? '割引' : (lang === 'en' ? 'discount' : 'diskon')}</p>
                </div>
              )}

              <button type="submit" className={`btn-primary ${styles.submitBtn}`} disabled={loading || loadingShipping}>
                {loading ? (lang === 'ja' ? "処理中..." : (lang === 'en' ? "Processing..." : "Memproses...")) : translations.checkout_pay}
              </button>
            </form>
          </div>

          <div className={styles.summarySection}>
            <h2>{translations.checkout_summary}</h2>
            <div className={styles.summaryItems}>
              {items.map(item => (
                <div key={item.id} className={styles.summaryItem}>
                  <div>
                    <h4>{item.name}</h4>
                    <p>{item.weight >= 1000 ? item.weight/1000 + 'kg' : item.weight + 'g'} - {item.grind} (x{item.quantity})</p>
                  </div>
                  <span>Rp {(item.price * item.quantity).toLocaleString("id-ID")}</span>
                </div>
              ))}
            </div>
            <div className={styles.summaryTotals}>
              <div className={styles.totalRow}>
                <span>{translations.checkout_subtotal}</span>
                <span>Rp {totalPrice.toLocaleString("id-ID")}</span>
              </div>
              
              {isB2B && (
                <div className={styles.totalRow} style={{ color: '#10b981' }}>
                  <span>{lang === 'ja' ? '業務用卸売割引 (20%)' : (lang === 'en' ? 'Wholesale Discount (20%)' : 'Diskon Grosir (20%)')}</span>
                  <span>- Rp {b2bDiscountAmount.toLocaleString("id-ID")}</span>
                </div>
              )}

              {appliedPromo && (
                <div className={styles.totalRow} style={{ color: '#10b981' }}>
                  <span>Promo ({appliedPromo.code})</span>
                  <span>- Rp {promoDiscountAmount.toLocaleString("id-ID")}</span>
                </div>
              )}

              {pointsDiscount > 0 && (
                <div className={styles.totalRow} style={{ color: '#10b981' }}>
                  <span>🏆 Ramu Points ({redeemPoints} pt)</span>
                  <span>- Rp {pointsDiscount.toLocaleString("id-ID")}</span>
                </div>
              )}

              <div className={styles.totalRow}>
                <span>{translations.checkout_tax} ({storeSettings?.taxRate || 10}%)</span>
                <span>Rp {tax.toLocaleString("id-ID")}</span>
              </div>
              <div className={styles.totalRow}>
                <span>{translations.checkout_admin}</span>
                {isVip ? (
                  <span style={{ color: '#d97706', fontWeight: 700 }}>👑 Rp 0 (VIP Privilege)</span>
                ) : (
                  <span>Rp {adminFee.toLocaleString("id-ID")}</span>
                )}
              </div>
              {isTebengKirim && (
                <div className={styles.totalRow} style={{ color: '#059669', fontSize: '0.85rem' }}>
                  <span>{lang === 'ja' ? '📦 焙煎バッチ便（おまとめ便）' : (lang === 'en' ? '📦 Batch Roast Shipping' : '📦 Tebeng Kirim (Jadwal Sangrai)')}</span>
                  <span>{finalShippingCost === 0 ? (lang === 'ja' ? '送料無料' : (lang === 'en' ? 'Free Shipping' : 'Free Ongkir')) : (lang === 'ja' ? '-Rp 12.000 (送料補助)' : (lang === 'en' ? '-Rp 12,000 (Subsidy)' : '-Rp 12.000 (Subsidi)'))}</span>
                </div>
              )}
              <div className={styles.totalRow}>
                <span>
                  {translations.checkout_ship_cost} 
                  {customer.city ? ` (${totalWeightKg} kg)` : ''}
                  {finalShippingCost === 0 && selectedShippingCost > 0 && storeSettings?.isFreeShippingEnabled ? ' (Free)' : ''}
                </span>
                <span style={{ textDecoration: finalShippingCost === 0 && selectedShippingCost > 0 ? 'line-through' : 'none' }}>
                  Rp {finalShippingCost === 0 && selectedShippingCost > 0 ? selectedShippingCost.toLocaleString("id-ID") : finalShippingCost.toLocaleString("id-ID")}
                </span>
              </div>
              <div className={`${styles.totalRow} ${styles.grandTotal}`}>
                <span>{translations.checkout_total}</span>
                <span>Rp {grandTotal.toLocaleString("id-ID")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
