"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { useLang } from "../../context/LanguageContext";
import { useToast } from "../../context/ToastContext";
import { t } from "../../data/translations";
import { CustomerDetails, CheckoutPayload } from "../../types/cart";
import { indonesiaLocations, provinces } from "../../data/indonesiaLocations";
import styles from "./Checkout.module.css";

interface BankAccount {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  branch: string;
}

interface OrderConfirmationData {
  orderId: string;
  total: number;
  paymentType: string;
  bankDetails?: BankAccount[];
  whatsappLink?: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCart();
  const { user, isLoading } = useAuth();
  const { lang } = useLang();
  const translations = t[lang as keyof typeof t] || t.id;
  
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

  // Payment Method Selection
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"qris_online" | "bank_transfer" | "whatsapp_roaster">("qris_online");

  // Order Confirmation Modal State (Real, Launch-Ready Flow)
  const [orderConfirmation, setOrderConfirmation] = useState<OrderConfirmationData | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

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

  // Fetch Settings
  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (!data.error) setStoreSettings(data);
      })
      .catch(() => {});
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

  // Load draft from localStorage and autofill user details
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
        } catch (_e) {}
      }

      setCustomer(prev => ({ ...prev, ...defaultCustomer }));
    }
  }, [user]);

  // Save draft whenever customer details change
  useEffect(() => {
    if (user?.email && (customer.firstName || customer.phone || customer.address)) {
      const draftKey = `ramu_checkout_draft_${user.email}`;
      localStorage.setItem(draftKey, JSON.stringify(customer));
    }
  }, [customer, user]);

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

  const totalWeightGrams = items.reduce((sum, item) => sum + (item.weight * item.quantity), 0);
  const totalWeightKg = Math.max(1, Math.ceil(totalWeightGrams / 1000));
  
  // Dynamic shipping cost calculation
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
          if (data && data.success && Array.isArray(data.data) && data.data.length > 0) {
            setShippingOptions(data.data);
            setSelectedShippingCost(data.data[0].cost);
          } else {
            setShippingOptions([]);
            setSelectedShippingCost(25000 * totalWeightKg);
          }
        } catch (_e) {
          setSelectedShippingCost(25000 * totalWeightKg);
        } finally {
          setLoadingShipping(false);
        }
      }
    };
    
    const timeoutId = setTimeout(() => {
      fetchShipping();
    }, 600);
    
    return () => clearTimeout(timeoutId);
  }, [customer.city, totalWeightGrams, totalWeightKg]);

  const waNumber = "6281221341";
  const cartDetails = items.map(item => `- ${item.name} (${item.weight >= 1000 ? item.weight/1000 + 'kg' : item.weight + 'g'} - ${item.grind}) x${item.quantity}`).join("%0A");
  const waIntlMessage = `Halo Ramu Roastery! Saya ingin konsultasi pengiriman internasional untuk pesanan berikut:%0A${cartDetails}`;
  const waIntlLink = `https://wa.me/${waNumber}?text=${waIntlMessage}`;

  const isB2B = user?.role === 'b2b';
  const b2bDiscountRate = 0.20;

  const hasSubscriptionItem = items.some(item => item.isSubscription || item.id?.includes('sub-'));
  const isVip = user?.isVip || (user?.role as string)?.toUpperCase() === 'VIP' || hasSubscriptionItem;
  const adminFee = isVip ? 0 : (storeSettings?.adminFee || 2500);
  
  let baseTotal = totalPrice;
  let b2bDiscountAmount = 0;
  if (isB2B) {
    b2bDiscountAmount = Math.round(totalPrice * b2bDiscountRate);
    baseTotal = totalPrice - b2bDiscountAmount;
  }

  let promoDiscountAmount = 0;
  if (appliedPromo) {
    if (appliedPromo.discountType === 'percentage') {
      promoDiscountAmount = Math.round(baseTotal * (appliedPromo.discountValue / 100));
    } else {
      promoDiscountAmount = appliedPromo.discountValue;
    }
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
    if (items.length === 0 && !loading && !isLoading && !orderConfirmation) {
      router.push("/catalog");
    }
  }, [items, router, loading, isLoading, orderConfirmation]);

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

  const copyToClipboard = (text: string, key: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
      addToast(
        lang === 'ja' ? 'クリップボードにコピーしました' : lang === 'en' ? 'Copied to clipboard' : 'Berhasil disalin ke papan klip',
        'info'
      );
    }
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
        discount: promoDiscountAmount,
        b2bDiscount: b2bDiscountAmount,
        redeemPoints: redeemPoints,
        isVip,
        isTebeng: isTebengKirim,
        grindNotes: grindNotes,
        paymentMethod: selectedPaymentMethod,
        notes: [
          isTebengKirim ? "[TEBENG KIRIM: Batch Sangrai]" : "",
          grindNotes ? `Catatan Gilingan: ${grindNotes}` : "",
        ].filter(Boolean).join(" | ")
      };

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal memproses pesanan");
      }

      // If online gateway form is returned
      if (data.paymentType === "ipay88" && data.fields) {
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
        localStorage.removeItem(`ramu_checkout_draft_${user?.email}`);
        clearCart();
        form.submit();
        return;
      }

      // Real Order Confirmation Flow (Direct Bank Transfer / QRIS / Roaster Concierge)
      localStorage.removeItem(`ramu_checkout_draft_${user?.email}`);
      clearCart();
      setOrderConfirmation({
        orderId: data.orderId,
        total: data.total || grandTotal,
        paymentType: data.paymentType,
        bankDetails: data.bankDetails || [
          {
            bankName: "BCA (Bank Central Asia)",
            accountNumber: "123-456-7890",
            accountHolder: "PT Ramu Roastery Nusantara",
            branch: "KCP Dago Bandung"
          },
          {
            bankName: "Bank Mandiri",
            accountNumber: "131-00-1234567-8",
            accountHolder: "PT Ramu Roastery Nusantara",
            branch: "KC Surapati Bandung"
          }
        ],
        whatsappLink: data.whatsappLink || `https://wa.me/${waNumber}?text=${encodeURIComponent(`Halo Ramu Roastery, saya telah memesan #${data.orderId} sebesar Rp ${(data.total || grandTotal).toLocaleString("id-ID")}.`)}`
      });

      addToast(
        lang === 'ja'
          ? `ご注文 #${data.orderId} が確定しました`
          : lang === 'en'
          ? `Order #${data.orderId} created successfully`
          : `Pesanan #${data.orderId} resmi dibuat`,
        'success'
      );
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Terjadi kesalahan saat memproses pesanan");
      }
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || !user) return null;

  return (
    <main className={styles.checkoutPage}>
      <div className="container">
        <header className={styles.headerContainer}>
          <span className={styles.brandLabel}>Ramu Roastery Specialty Coffee</span>
          <h1 className={styles.title}>{translations.checkout_title}</h1>
        </header>
        
        <div className={styles.grid}>
          {/* LEFT: SHIPPING & CHECKOUT FORM */}
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>{translations.checkout_shipping}</h2>

            {/* International Export Banner */}
            <div className={styles.intlBanner}>
              <div className={styles.intlBannerHeader}>
                <strong>International Shipping & Export</strong>
              </div>
              <p>
                {lang === 'ja'
                  ? '日本および海外への発送に対応しております。配送料・納期・通関等のご相談はWhatsAppにて日本語または英語でお問い合わせください。'
                  : lang === 'en'
                  ? 'We ship worldwide. Please contact us via WhatsApp for international freight rates and custom clearing.'
                  : 'Melayani pengiriman internasional dan ekspor. Hubungi roaster kami via WhatsApp untuk kalkulasi ongkos kirim ke luar negeri.'}
              </p>
              <a href={waIntlLink} target="_blank" rel="noopener noreferrer" className={styles.intlBannerLink}>
                {lang === 'ja' ? 'WhatsAppで問い合わせる' : lang === 'en' ? 'Contact via WhatsApp' : 'Konsultasi Ekspor via WhatsApp'}
              </a>
            </div>

            {/* Saved Address Book Selector */}
            {savedAddresses.length > 0 && (
              <div className={styles.addressSelector}>
                <label className={styles.fieldLabel}>
                  {lang === 'ja' ? '保存されたお届け先' : lang === 'en' ? 'Saved Delivery Addresses' : 'Pilih Alamat Tersimpan'}
                </label>
                <select onChange={handleSelectAddress} defaultValue="">
                  <option value="">
                    {lang === 'ja' ? 'お届け先を選択するか手入力' : lang === 'en' ? 'Select saved address or fill manually' : 'Pilih dari buku alamat atau isi formulir di bawah'}
                  </option>
                  {savedAddresses.map(addr => (
                    <option key={addr.id} value={addr.id}>
                      {addr.isDefault ? '[Utama] ' : ''}{addr.label}: {addr.firstName} {addr.lastName}, {addr.city}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {error && <div className={styles.errorBanner}>{error}</div>}

            <form onSubmit={handleCheckout} className={styles.form}>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label htmlFor="firstName">{translations.checkout_fname}</label>
                  <input id="firstName" type="text" name="firstName" value={customer.firstName} onChange={handleInputChange} required />
                </div>
                <div className={styles.field}>
                  <label htmlFor="lastName">{translations.checkout_lname}</label>
                  <input id="lastName" type="text" name="lastName" value={customer.lastName} onChange={handleInputChange} required />
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label htmlFor="email">{translations.dash_email}</label>
                  <input id="email" type="email" name="email" value={customer.email} onChange={handleInputChange} required />
                </div>
                <div className={styles.field}>
                  <label htmlFor="phone">{translations.dash_phone}</label>
                  <input id="phone" type="tel" name="phone" value={customer.phone} onChange={handleInputChange} required placeholder="08xxxxxxxxxx" />
                </div>
              </div>

              <div className={styles.field}>
                <label htmlFor="address">{translations.checkout_address}</label>
                <textarea id="address" name="address" value={customer.address} onChange={handleInputChange} required rows={3} placeholder="Nama jalan, nomor rumah, RT/RW, patokan"></textarea>
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label htmlFor="province">{lang === 'ja' ? '州・県' : lang === 'en' ? 'Province' : 'Provinsi'}</label>
                  <select 
                    id="province"
                    name="province"
                    value={customer.province || ""}
                    onChange={(e) => {
                      setCustomer(prev => ({ ...prev, province: e.target.value, city: "" }));
                    }}
                    required
                  >
                    <option value="" disabled>{lang === 'ja' ? '州・県を選択' : lang === 'en' ? 'Select Province' : 'Pilih Provinsi'}</option>
                    {provinces.map(prov => (
                      <option key={prov} value={prov}>{prov}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.field}>
                  <label htmlFor="city">{translations.checkout_city}</label>
                  <select 
                    id="city"
                    name="city"
                    value={customer.city}
                    onChange={handleInputChange}
                    required
                    disabled={!customer.province}
                  >
                    <option value="" disabled>{lang === 'ja' ? '市区町村を選択' : lang === 'en' ? 'Select City' : 'Pilih Kota / Kabupaten'}</option>
                    {customer.province && indonesiaLocations[customer.province as keyof typeof indonesiaLocations]?.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label htmlFor="subdistrict">{lang === 'ja' ? '郡 / ディストリクト' : lang === 'en' ? 'District / Sub-district' : 'Kecamatan'}</label>
                  <input id="subdistrict" type="text" name="subdistrict" value={customer.subdistrict || ""} onChange={handleInputChange} required placeholder="Contoh: Coblong" />
                </div>
                <div className={styles.field}>
                  <label htmlFor="village">{lang === 'ja' ? '村 / 町名' : lang === 'en' ? 'Village / Ward' : 'Kelurahan / Desa'}</label>
                  <input id="village" type="text" name="village" value={customer.village || ""} onChange={handleInputChange} required placeholder="Contoh: Dago" />
                </div>
              </div>

              <div className={styles.field}>
                <label htmlFor="postalCode">{translations.checkout_postal}</label>
                <input id="postalCode" type="text" name="postalCode" value={customer.postalCode} onChange={handleInputChange} required placeholder="Contoh: 40135" />
              </div>

              {/* Shipping Service Selector */}
              <div className={styles.field} style={{ marginTop: "0.5rem" }}>
                <label htmlFor="shippingService">{lang === 'ja' ? '配送サービス' : lang === 'en' ? 'Courier & Shipping Service' : 'Layanan Kurir & Pengiriman'}</label>
                {loadingShipping ? (
                  <select id="shippingService" disabled>
                    <option>Menghitung opsi ongkos kirim...</option>
                  </select>
                ) : shippingOptions.length > 0 ? (
                  <select id="shippingService" onChange={handleShippingChange} value={selectedShippingCost} required>
                    {shippingOptions.map((opt, idx) => (
                      <option key={idx} value={opt.cost}>
                        {opt.courier} {opt.service} (Rp {opt.cost.toLocaleString("id-ID")}) - Estimasi {opt.etd}
                      </option>
                    ))}
                  </select>
                ) : (
                  <select id="shippingService" disabled>
                    <option>Pilih Provinsi & Kota terlebih dahulu untuk menampilkan kurir</option>
                  </select>
                )}

                {/* B2B Cargo Badge */}
                {totalWeightGrams >= 5000 && (
                  <div className={styles.b2bCargoBadge}>
                    <strong>Paket Kargo Partai Besar ({totalWeightKg} kg):</strong> Layanan J&T CARGO ekonomis otomatis aktif pada daftar pilihan kurir di atas.
                  </div>
                )}

                {/* Tebeng Kirim (Consolidated Fresh Roast Delivery) */}
                <div 
                  className={`${styles.tebengCard} ${isTebengKirim ? styles.tebengCardActive : ''}`} 
                  onClick={() => setIsTebengKirim(!isTebengKirim)}
                >
                  <label className={styles.tebengLabel} onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isTebengKirim}
                      onChange={(e) => setIsTebengKirim(e.target.checked)}
                    />
                    <div>
                      <strong className={styles.tebengTitle}>
                        Opsi Tebeng Kirim (Jadwal Batch Sangrai Senin & Kamis)
                      </strong>
                      <span className={styles.tebengDesc}>
                        Gabung jadwal pengiriman kurir reguler roastery kami. Bebas ongkos kirim untuk area Bandung & Cimahi, atau subsidi Rp 12.000 untuk pengiriman luar kota.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Custom Grinding Calibration Notes */}
              <div className={styles.field} style={{ marginTop: "0.5rem" }}>
                <label htmlFor="grindNotes">Catatan Kalibrasi Gilingan & Profil Seduh (Opsional)</label>
                <textarea
                  id="grindNotes"
                  value={grindNotes}
                  onChange={(e) => setGrindNotes(e.target.value)}
                  placeholder="Contoh: Tolong giling untuk V60 Paper Filter, Espresso Basket 58mm, atau Cold Brew kasar..."
                  rows={2}
                />
                <span className={styles.feedbackHint}>
                  Roaster kami akan mengkalibrasi tingkat gilingan secara presisi sesuai alat seduh yang Anda gunakan.
                </span>
              </div>

              {/* Roastery Operational Hours Notice */}
              <div className={styles.operatingBadge}>
                <strong>Jam Operasional Roastery:</strong> Senin - Sabtu, 09:00 - 17:00 WIB. Pesanan sebelum 15:00 WIB akan diproses pada batch sangrai hari yang sama atau batch terjadwal berikutnya.
              </div>

              {/* PAYMENT METHOD SELECTION */}
              <div className={styles.paymentSection}>
                <h3 className={styles.sectionTitle}>Pilihan Metode Pembayaran</h3>
                
                <div className={styles.paymentGrid}>
                  {/* Option 1: QRIS & Instant Online */}
                  <div 
                    className={`${styles.paymentCard} ${selectedPaymentMethod === "qris_online" ? styles.paymentCardActive : ""}`}
                    onClick={() => setSelectedPaymentMethod("qris_online")}
                  >
                    <div className={`${styles.radioCircle} ${selectedPaymentMethod === "qris_online" ? styles.radioCircleSelected : ""}`}>
                      {selectedPaymentMethod === "qris_online" && <div className={styles.radioInnerDot} />}
                    </div>
                    <div className={styles.paymentCardContent}>
                      <div className={styles.paymentCardHeader}>
                        <span className={styles.paymentCardTitle}>QRIS & Pembayaran Instan</span>
                        <span className={`${styles.paymentBadge} ${selectedPaymentMethod === "qris_online" ? styles.paymentBadgeActive : ""}`}>Rekomendasi</span>
                      </div>
                      <p className={styles.paymentCardDesc}>
                        Scan QRIS melalui GoPay, OVO, ShopeePay, BCA Mobile, Livin Mandiri, atau aplikasi perbankan digital manapun.
                      </p>
                    </div>
                  </div>

                  {/* Option 2: Direct Bank Transfer */}
                  <div 
                    className={`${styles.paymentCard} ${selectedPaymentMethod === "bank_transfer" ? styles.paymentCardActive : ""}`}
                    onClick={() => setSelectedPaymentMethod("bank_transfer")}
                  >
                    <div className={`${styles.radioCircle} ${selectedPaymentMethod === "bank_transfer" ? styles.radioCircleSelected : ""}`}>
                      {selectedPaymentMethod === "bank_transfer" && <div className={styles.radioInnerDot} />}
                    </div>
                    <div className={styles.paymentCardContent}>
                      <div className={styles.paymentCardHeader}>
                        <span className={styles.paymentCardTitle}>Transfer Bank Resmi (BCA / Mandiri)</span>
                        <span className={`${styles.paymentBadge} ${selectedPaymentMethod === "bank_transfer" ? styles.paymentBadgeActive : ""}`}>Rekening Resmi</span>
                      </div>
                      <p className={styles.paymentCardDesc}>
                        Transfer langsung ke rekening korporat PT Ramu Roastery Nusantara. Verifikasi manual dan konfirmasi otomatis.
                      </p>
                    </div>
                  </div>

                  {/* Option 3: WhatsApp Roaster Concierge */}
                  <div 
                    className={`${styles.paymentCard} ${selectedPaymentMethod === "whatsapp_roaster" ? styles.paymentCardActive : ""}`}
                    onClick={() => setSelectedPaymentMethod("whatsapp_roaster")}
                  >
                    <div className={`${styles.radioCircle} ${selectedPaymentMethod === "whatsapp_roaster" ? styles.radioCircleSelected : ""}`}>
                      {selectedPaymentMethod === "whatsapp_roaster" && <div className={styles.radioInnerDot} />}
                    </div>
                    <div className={styles.paymentCardContent}>
                      <div className={styles.paymentCardHeader}>
                        <span className={styles.paymentCardTitle}>Roaster Concierge / WhatsApp</span>
                        <span className={`${styles.paymentBadge} ${selectedPaymentMethod === "whatsapp_roaster" ? styles.paymentBadgeActive : ""}`}>B2B & Khusus</span>
                      </div>
                      <p className={styles.paymentCardDesc}>
                        Koordinasi langsung dengan tim roaster untuk kebutuhan pesanan korporat, faktur pajak resmi, atau batch sangrai khusus.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vouchers & Points */}
              <div className={styles.discountSection}>
                <div className={styles.field}>
                  <label htmlFor="promoCode">Kode Promo</label>
                  <div className={styles.inlineInputGroup}>
                    <input 
                      id="promoCode"
                      type="text" 
                      value={promoCodeInput}
                      onChange={(e) => setPromoCodeInput(e.target.value)}
                      placeholder="Masukkan kode promo"
                      disabled={appliedPromo !== null}
                      style={{ textTransform: 'uppercase' }}
                    />
                    {!appliedPromo ? (
                      <button type="button" onClick={handleApplyPromo} className={styles.btnSecondary}>
                        Terapkan
                      </button>
                    ) : (
                      <button type="button" onClick={() => setAppliedPromo(null)} className={styles.btnCancel}>
                        Batal
                      </button>
                    )}
                  </div>
                  {promoError && <p className={styles.feedbackError}>{promoError}</p>}
                  {appliedPromo && <p className={styles.feedbackSuccess}>Voucher promo {appliedPromo.code} berhasil digunakan.</p>}
                </div>

                {/* Points Redemption */}
                {pointsBalance > 0 && (
                  <div className={styles.field}>
                    <label htmlFor="redeemPoints">Tukar Ramu Points (Saldo: {pointsBalance} poin)</label>
                    <div className={styles.inlineInputGroup}>
                      <input
                        id="redeemPoints"
                        type="number"
                        min={0}
                        max={pointsBalance}
                        value={redeemPoints || ''}
                        onChange={(e) => { setRedeemPoints(Number(e.target.value)); setPointsDiscount(0); }}
                        placeholder={`Maks. ${pointsBalance} poin`}
                        disabled={pointsDiscount > 0}
                      />
                      {pointsDiscount === 0 ? (
                        <button type="button" onClick={handleRedeemPoints} className={styles.btnSecondary}>
                          Tukar
                        </button>
                      ) : (
                        <button type="button" onClick={() => { setPointsDiscount(0); setRedeemPoints(0); }} className={styles.btnCancel}>
                          Batal
                        </button>
                      )}
                    </div>
                    {pointsDiscount > 0 && <p className={styles.feedbackSuccess}>{redeemPoints} poin = Potongan Rp {pointsDiscount.toLocaleString('id-ID')}</p>}
                    <span className={styles.feedbackHint}>1 poin bernilai potongan Rp 100 langsung pada total transaksi.</span>
                  </div>
                )}
              </div>

              <button type="submit" className={styles.submitBtn} disabled={loading || loadingShipping}>
                {loading ? "Menyiapkan Transaksi..." : translations.checkout_pay}
              </button>
            </form>
          </div>

          {/* RIGHT: ORDER SUMMARY */}
          <div className={styles.summarySection}>
            <h2 className={styles.sectionTitle}>{translations.checkout_summary}</h2>
            
            <div className={styles.summaryItems}>
              {items.map(item => (
                <div key={item.id} className={styles.summaryItem}>
                  <div className={styles.summaryItemInfo}>
                    <h4>{item.name}</h4>
                    <p>{item.weight >= 1000 ? item.weight/1000 + 'kg' : item.weight + 'g'} • {item.grind} (x{item.quantity})</p>
                  </div>
                  <span className={styles.summaryItemPrice}>
                    Rp {(item.price * item.quantity).toLocaleString("id-ID")}
                  </span>
                </div>
              ))}
            </div>

            <div className={styles.summaryTotals}>
              <div className={styles.totalRow}>
                <span>{translations.checkout_subtotal}</span>
                <span>Rp {totalPrice.toLocaleString("id-ID")}</span>
              </div>
              
              {isB2B && (
                <div className={`${styles.totalRow} ${styles.discountRow}`}>
                  <span>Diskon Grosir Mitra (20%)</span>
                  <span>- Rp {b2bDiscountAmount.toLocaleString("id-ID")}</span>
                </div>
              )}

              {appliedPromo && (
                <div className={`${styles.totalRow} ${styles.discountRow}`}>
                  <span>Voucher Promo ({appliedPromo.code})</span>
                  <span>- Rp {promoDiscountAmount.toLocaleString("id-ID")}</span>
                </div>
              )}

              {pointsDiscount > 0 && (
                <div className={`${styles.totalRow} ${styles.discountRow}`}>
                  <span>Tukar Ramu Points ({redeemPoints} poin)</span>
                  <span>- Rp {pointsDiscount.toLocaleString("id-ID")}</span>
                </div>
              )}

              <div className={styles.totalRow}>
                <span>{translations.checkout_tax} ({taxRate}%)</span>
                <span>Rp {tax.toLocaleString("id-ID")}</span>
              </div>

              <div className={styles.totalRow}>
                <span>{translations.checkout_admin}</span>
                {isVip ? (
                  <span style={{ color: 'var(--accent-earth, #9E8765)', fontWeight: 600 }}>Rp 0 (VIP Privilege)</span>
                ) : (
                  <span>Rp {adminFee.toLocaleString("id-ID")}</span>
                )}
              </div>

              {isTebengKirim && (
                <div className={`${styles.totalRow} ${styles.discountRow}`}>
                  <span>Tebeng Kirim (Batch Sangrai)</span>
                  <span>{finalShippingCost === 0 ? "Gratis Ongkir" : "-Rp 12.000 (Subsidi)"}</span>
                </div>
              )}

              <div className={styles.totalRow}>
                <span>
                  {translations.checkout_ship_cost} 
                  {customer.city ? ` (${totalWeightKg} kg)` : ''}
                  {finalShippingCost === 0 && selectedShippingCost > 0 && storeSettings?.isFreeShippingEnabled ? ' (Free)' : ''}
                </span>
                <span style={{ textDecoration: finalShippingCost === 0 && selectedShippingCost > 0 ? 'line-through' : 'none' }}>
                  Rp {(finalShippingCost === 0 && selectedShippingCost > 0 ? selectedShippingCost : finalShippingCost).toLocaleString("id-ID")}
                </span>
              </div>

              <div className={styles.grandTotalRow}>
                <span className={styles.grandTotalLabel}>{translations.checkout_total}</span>
                <span className={styles.grandTotalValue}>Rp {grandTotal.toLocaleString("id-ID")}</span>
              </div>
            </div>

            {/* Curatorial Assurance */}
            <div className={styles.summaryAssurance}>
              <div className={styles.assuranceItem}>
                <div className={styles.assuranceDot} />
                <span>100% Arabika & Robusta Pilihan Terkurasi Nusantara</span>
              </div>
              <div className={styles.assuranceItem}>
                <div className={styles.assuranceDot} />
                <span>Disangrai segar di Bandung sesuai standar Specialty Coffee</span>
              </div>
              <div className={styles.assuranceItem}>
                <div className={styles.assuranceDot} />
                <span>Jaminan kemasan degassing valve dan pengiriman aman</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* REAL ORDER CONFIRMATION MODAL / INVOICE VIEW */}
      {orderConfirmation && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard} role="dialog" aria-modal="true">
            <div className={styles.modalHeader}>
              <span className={styles.modalSubheader}>Transaksi Resmi Diterbitkan</span>
              <h2 className={styles.modalTitle}>Pesanan Berhasil Dibuat</h2>
            </div>

            {/* Order Reference & Total */}
            <div className={styles.orderReferenceCard}>
              <div className={styles.orderRefRow}>
                <span className={styles.orderRefLabel}>Nomor Pesanan</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className={styles.orderRefValue}>{orderConfirmation.orderId}</span>
                  <button 
                    type="button" 
                    className={styles.copyBtn}
                    onClick={() => copyToClipboard(orderConfirmation.orderId, 'orderId')}
                  >
                    {copiedKey === 'orderId' ? 'Tersalin' : 'Salin'}
                  </button>
                </div>
              </div>

              <div className={styles.orderRefRow}>
                <span className={styles.orderRefLabel}>Total Pembayaran</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className={styles.orderTotalValue}>Rp {orderConfirmation.total.toLocaleString("id-ID")}</span>
                  <button 
                    type="button" 
                    className={styles.copyBtn}
                    onClick={() => copyToClipboard(orderConfirmation.total.toString(), 'orderTotal')}
                  >
                    {copiedKey === 'orderTotal' ? 'Tersalin' : 'Salin'}
                  </button>
                </div>
              </div>
            </div>

            {/* Bank Accounts Section */}
            <div>
              <h4 style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#666', margin: '0 0 0.75rem 0' }}>
                Rekening Pembayaran Resmi Ramu Roastery
              </h4>
              <div className={styles.bankAccountsList}>
                {orderConfirmation.bankDetails?.map((bank, idx) => (
                  <div key={idx} className={styles.bankAccountCard}>
                    <div className={styles.bankInfo}>
                      <h5>{bank.bankName}</h5>
                      <span className={styles.bankNumber}>{bank.accountNumber}</span>
                      <span className={styles.bankHolder}>a.n. {bank.accountHolder} ({bank.branch})</span>
                    </div>
                    <button 
                      type="button" 
                      className={styles.copyBtn}
                      onClick={() => copyToClipboard(bank.accountNumber.replace(/[^0-9]/g, ''), `bank-${idx}`)}
                    >
                      {copiedKey === `bank-${idx}` ? 'Tersalin' : 'Salin No'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Simple Instructions */}
            <div className={styles.instructionsSection}>
              <h5 className={styles.instructionsTitle}>Petunjuk Penyelesaian Pembayaran:</h5>
              <ol className={styles.instructionsList}>
                <li>Transfer sejumlah tepat <strong>Rp {orderConfirmation.total.toLocaleString("id-ID")}</strong> ke salah satu rekening resmi di atas.</li>
                <li>Simpan bukti transfer atau tangkapan layar pembayaran.</li>
                <li>Klik tombol konfirmasi WhatsApp di bawah atau kirim bukti via halaman Pesanan Saya di akun Anda.</li>
              </ol>
            </div>

            {/* Actions */}
            <div className={styles.modalActions}>
              {orderConfirmation.whatsappLink && (
                <a 
                  href={orderConfirmation.whatsappLink} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className={styles.btnPrimaryWa}
                >
                  Konfirmasi Pembayaran via WhatsApp
                </a>
              )}
              <button 
                type="button" 
                onClick={() => router.push("/dashboard/orders")} 
                className={styles.btnSecondaryOutline}
              >
                Lihat Daftar Transaksi di Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
