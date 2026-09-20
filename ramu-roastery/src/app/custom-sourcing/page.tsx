"use client";

import { useState } from "react";
import { useLang } from "../../context/LanguageContext";
import { useToast } from "../../context/ToastContext";
import { t } from "../../data/translations";

import styles from "./CustomSourcing.module.css";

const getOptions = (lang: string) => {
  const translations = t[lang as keyof typeof t];
  return {
    PURPOSE_OPTIONS: [
      { id: "kedai", title: translations.cs_q1_o1, icon: "🏪" },
      { id: "kantor", title: translations.cs_q1_o2, icon: "🏢" },
      { id: "event", title: translations.cs_q1_o3, icon: "🎉" },
      { id: "pribadi", title: translations.cs_q1_o4, icon: "☕" },
    ],
    FLAVOR_OPTIONS: [
      { id: "chocolate", title: translations.cs_q2_o1, icon: "🍫" },
      { id: "fruity", title: translations.cs_q2_o2, icon: "🍓" },
      { id: "floral", title: translations.cs_q2_o3, icon: "🌸" },
      { id: "bold", title: translations.cs_q2_o4, icon: "🔥" },
    ],
    VOLUME_OPTIONS: [
      { id: "low", title: translations.cs_q3_o1, icon: "📦" },
      { id: "medium", title: translations.cs_q3_o2, icon: "🚚" },
      { id: "high", title: translations.cs_q3_o3, icon: "🏭" },
    ]
  };
};

export default function CustomSourcingPage() {
  const { lang } = useLang();
  const { addToast } = useToast();
  const translations = t[lang as keyof typeof t];
  const { PURPOSE_OPTIONS, FLAVOR_OPTIONS, VOLUME_OPTIONS } = getOptions(lang);

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    purpose: "",
    flavor: "",
    volume: "",
    name: "",
    businessName: "",
    phone: "",
  });

  const updateForm = (key: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate Contact Data
    if (!formData.name || !formData.phone) {
      addToast(translations.cs_err_contact, "error");
      return;
    }

    // Map keys to human readable strings
    const purposeText = PURPOSE_OPTIONS.find(o => o.id === formData.purpose)?.title || formData.purpose;
    const flavorText = FLAVOR_OPTIONS.find(o => o.id === formData.flavor)?.title || formData.flavor;
    const volumeText = VOLUME_OPTIONS.find(o => o.id === formData.volume)?.title || formData.volume;

    let message = "";
    if (lang === 'ja') {
      message = `こんにちは、Ramu Roastery様。カスタムソーシング（OEM・生豆調達）の相談を希望します。

【ご要望内容】
・ご利用目的: ${purposeText}
・フレーバー傾向: ${flavorText}
・想定月間使用量: ${volumeText}

【お客様情報】
・ご担当者名: ${formData.name}
・屋号・会社名: ${formData.businessName || "-"}
・ご連絡先: ${formData.phone}

カッピングや焙煎サンプルのご案内をいただけますと幸いです。よろしくお願いいたします。`;
    } else if (lang === 'en') {
      message = `Hello Ramu Roastery! I am interested in your Custom Sourcing services.

Here are my requirements:
- *Purpose*: ${purposeText}
- *Flavor Profile*: ${flavorText}
- *Estimated Monthly Volume*: ${volumeText}

- *Name*: ${formData.name}
- *Business/Institution*: ${formData.businessName || "-"}
- *WhatsApp/Phone*: ${formData.phone}

Please let me know how to proceed with cupping and sample roasting. Thank you!`;
    } else {
      message = `Halo Ramu Roastery! Saya tertarik dengan layanan Custom Sourcing.
    
Berikut detail kebutuhan saya:
- *Tujuan*: ${purposeText}
- *Karakter Rasa*: ${flavorText}
- *Estimasi Volume/Bulan*: ${volumeText}

- *Nama*: ${formData.name}
- *Nama Bisnis/Instansi*: ${formData.businessName || "-"}
- *Kontak WA*: ${formData.phone}

Mohon info lebih lanjut terkait kalibrasi dan *sample roasting*. Terima kasih!`;
    }

    // Submit Request to API
    try {
      await fetch('/api/custom-sourcing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          businessName: formData.businessName,
          phone: formData.phone,
          purposeText,
          flavorText,
          volumeText
        })
      });
    } catch (error) {
      console.error("Failed to submit request", error);
    }

    const encodedMessage = encodeURIComponent(message);
    const waNumber = "6281931736090"; // Nomor WhatsApp CS Khusus Ramu
    
    window.open(`https://wa.me/${waNumber}?text=${encodedMessage}`, "_blank");
  };

  // Render helpers
  const canProceed = () => {
    if (step === 1) return formData.purpose !== "";
    if (step === 2) return formData.flavor !== "";
    if (step === 3) return formData.volume !== "";
    return true; // Step 4 relies on HTML5 required attrs or handleSubmit validation
  };

  return (
    <main style={{ backgroundColor: "#f9fafb", minHeight: "100vh" }}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>{translations.cs_title}</h1>
          <p className={styles.subtitle}>{translations.cs_sub}</p>
        </div>

        {/* Wizard Progress */}
        <div className={styles.progressContainer}>
          {[1, 2, 3, 4].map((s) => (
            <div 
              key={s} 
              className={`${styles.stepIndicator} ${s === step ? styles.active : ""} ${s < step ? styles.completed : ""}`}
            >
              {s < step ? "✓" : s}
            </div>
          ))}
        </div>

        {/* Wizard Form */}
        <div className={styles.wizardCard}>
          {step === 1 && (
            <div>
              <h2 className={styles.questionTitle}>{translations.cs_q1}</h2>
              <div className={styles.optionGrid}>
                {PURPOSE_OPTIONS.map((opt) => (
                  <div 
                    key={opt.id} 
                    className={`${styles.optionCard} ${formData.purpose === opt.id ? styles.selected : ""}`}
                    onClick={() => updateForm("purpose", opt.id)}
                  >
                    <div className={styles.optionIcon}>{opt.icon}</div>
                    <div className={styles.optionTitle}>{opt.title}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className={styles.questionTitle}>{translations.cs_q2}</h2>
              <div className={styles.optionGrid}>
                {FLAVOR_OPTIONS.map((opt) => (
                  <div 
                    key={opt.id} 
                    className={`${styles.optionCard} ${formData.flavor === opt.id ? styles.selected : ""}`}
                    onClick={() => updateForm("flavor", opt.id)}
                  >
                    <div className={styles.optionIcon}>{opt.icon}</div>
                    <div className={styles.optionTitle}>{opt.title}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className={styles.questionTitle}>{translations.cs_q3}</h2>
              <div className={styles.optionGrid}>
                {VOLUME_OPTIONS.map((opt) => (
                  <div 
                    key={opt.id} 
                    className={`${styles.optionCard} ${formData.volume === opt.id ? styles.selected : ""}`}
                    onClick={() => updateForm("volume", opt.id)}
                  >
                    <div className={styles.optionIcon}>{opt.icon}</div>
                    <div className={styles.optionTitle}>{opt.title}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className={styles.questionTitle}>{translations.cs_q4}</h2>
              <form onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                  <label>{translations.cs_name}</label>
                  <input 
                    type="text" 
                    required 
                    className={styles.inputField} 
                    placeholder={translations.cs_name_ph}
                    value={formData.name}
                    onChange={(e) => updateForm("name", e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>{translations.cs_biz}</label>
                  <input 
                    type="text" 
                    className={styles.inputField} 
                    placeholder={translations.cs_biz_ph}
                    value={formData.businessName}
                    onChange={(e) => updateForm("businessName", e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>{translations.cs_wa}</label>
                  <input 
                    type="tel" 
                    required 
                    className={styles.inputField} 
                    placeholder={translations.cs_wa_ph}
                    value={formData.phone}
                    onChange={(e) => updateForm("phone", e.target.value)}
                  />
                </div>
              </form>
            </div>
          )}

          {/* Controls */}
          <div className={styles.navigationButtons}>
            {step > 1 ? (
              <button className="btn-outline" onClick={handlePrev}>
                {translations.cs_btn_prev}
              </button>
            ) : (
              <div></div> // Spacer
            )}

            {step < 4 ? (
              <button 
                className="btn-primary" 
                onClick={handleNext} 
                disabled={!canProceed()}
                style={{ opacity: canProceed() ? 1 : 0.5 }}
              >
                {translations.cs_btn_next}
              </button>
            ) : (
              <button className="btn-primary" onClick={handleSubmit}>
                {translations.cs_btn_submit}
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
