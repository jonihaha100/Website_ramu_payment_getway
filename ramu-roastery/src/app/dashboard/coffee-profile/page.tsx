"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useLang } from '../../../context/LanguageContext';
import { useToast } from '../../../context/ToastContext';
import { t } from '../../../data/translations';
import styles from './profileKopi.module.css';

// --- Data Structure with Icons for better UI ---
const getQuestions = (lang: string) => ({
  favoriteDrink: {
    label: t[lang as keyof typeof t].cp_q1,
    options: [
      { id: 'Espresso / Ristretto', icon: '☕', text: t[lang as keyof typeof t].cp_q1_o1 },
      { id: 'Americano / Long Black', icon: '🥃', text: t[lang as keyof typeof t].cp_q1_o2 },
      { id: 'Latte / Cappuccino', icon: '🥛', text: t[lang as keyof typeof t].cp_q1_o3 },
      { id: 'Manual Brew (V60 dll)', icon: '⚗️', text: t[lang as keyof typeof t].cp_q1_o4 },
      { id: 'Kopi Susu Gula Aren', icon: '🥤', text: t[lang as keyof typeof t].cp_q1_o5 },
    ]
  },
  tastePreference: {
    label: t[lang as keyof typeof t].cp_q2,
    options: [
      { id: 'Fruity / Asam Segar', icon: '🍒', text: t[lang as keyof typeof t].cp_q2_o1 },
      { id: 'Nutty / Cokelat', icon: '🌰', text: t[lang as keyof typeof t].cp_q2_o2 },
      { id: 'Pahit / Bold', icon: '💪', text: t[lang as keyof typeof t].cp_q2_o3 },
      { id: 'Floral / Tea-like', icon: '🌸', text: t[lang as keyof typeof t].cp_q2_o4 },
      { id: 'Balance / Seimbang', icon: '⚖️', text: t[lang as keyof typeof t].cp_q2_o5 },
    ]
  },
  frequency: {
    label: t[lang as keyof typeof t].cp_q3,
    options: [
      { id: 'Jarang', icon: '🔋', text: t[lang as keyof typeof t].cp_q3_o1 },
      { id: '1 kali', icon: '☀️', text: t[lang as keyof typeof t].cp_q3_o2 },
      { id: '2 - 3 kali', icon: '⚡', text: t[lang as keyof typeof t].cp_q3_o3 },
      { id: 'Lebih dari 3 kali', icon: '🚀', text: t[lang as keyof typeof t].cp_q3_o4 },
    ]
  },
  budget: {
    label: t[lang as keyof typeof t].cp_q4,
    options: [
      { id: '< Rp 100.000', icon: '🪙', text: t[lang as keyof typeof t].cp_q4_o1 },
      { id: 'Rp 100.000 - Rp 300.000', icon: '💵', text: t[lang as keyof typeof t].cp_q4_o2 },
      { id: 'Rp 300.000 - Rp 500.000', icon: '💴', text: t[lang as keyof typeof t].cp_q4_o3 },
      { id: '> Rp 500.000', icon: '💎', text: t[lang as keyof typeof t].cp_q4_o4 },
    ]
  },
  tools: {
    label: t[lang as keyof typeof t].cp_q5,
    options: [
      { id: 'V60 / Pour Over', icon: '🌪️', text: t[lang as keyof typeof t].cp_q5_o1 },
      { id: 'French Press', icon: '🫖', text: t[lang as keyof typeof t].cp_q5_o2 },
      { id: 'Aeropress', icon: '💉', text: t[lang as keyof typeof t].cp_q5_o3 },
      { id: 'Moka Pot', icon: '🌋', text: t[lang as keyof typeof t].cp_q5_o4 },
      { id: 'Lainnya', icon: '🔧', text: t[lang as keyof typeof t].cp_q5_o5 },
    ]
  },
  grinder: {
    label: t[lang as keyof typeof t].cp_q6,
    options: [
      { id: 'Manual Grinder', icon: '⚙️', text: t[lang as keyof typeof t].cp_q6_o1 },
      { id: 'Electric (Entry Level)', icon: '🔌', text: t[lang as keyof typeof t].cp_q6_o2 },
      { id: 'Electric (Prosumer)', icon: '🏭', text: t[lang as keyof typeof t].cp_q6_o3 },
      { id: 'Belum punya grinder', icon: '🚫', text: t[lang as keyof typeof t].cp_q6_o4 },
    ]
  },
  machine: {
    label: t[lang as keyof typeof t].cp_q7,
    options: [
      { id: 'Mesin Kapsul', icon: '💊', text: t[lang as keyof typeof t].cp_q7_o1 },
      { id: 'Home Espresso Machine', icon: '🏠', text: t[lang as keyof typeof t].cp_q7_o2 },
      { id: 'Prosumer / Commercial', icon: '🏢', text: t[lang as keyof typeof t].cp_q7_o3 },
      { id: 'Belum punya mesin', icon: '🙅‍♂️', text: t[lang as keyof typeof t].cp_q7_o4 },
    ]
  }
});

export default function CoffeeProfilePage() {
  const { user, updateProfile } = useAuth();
  const { lang } = useLang();
  const { addToast } = useToast();
  const translations = t[lang as keyof typeof t];
  const questions = getQuestions(lang);
  const [hasProfile, setHasProfile] = useState(false);
  const [isEditing, setIsEditing] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    favoriteDrink: '',
    tastePreference: '',
    frequency: '',
    budget: '',
    tools: [] as string[],
    grinder: '',
    machine: ''
  });

  useEffect(() => {
    // Check user.coffeePreferences first, then fallback to user-scoped localStorage
    let pref = user?.coffeePreferences;
    if (!pref && user?.email) {
      try {
        const stored = localStorage.getItem(`ramu_coffee_preferences_${user.email}`);
        if (stored) pref = JSON.parse(stored);
      } catch (_e) {}
    }

    if (pref) {
      if (pref.favoriteDrink || pref.tastePreference) {
        setFormData({
          favoriteDrink: pref.favoriteDrink || '',
          tastePreference: pref.tastePreference || '',
          frequency: pref.frequency || '',
          budget: pref.budget || '',
          tools: pref.tools || [],
          grinder: pref.grinder || '',
          machine: pref.machine || ''
        });
        setHasProfile(true);
        setIsEditing(false);
      }
    }
  }, [user]);

  const handleRadioChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleCheckboxChange = (value: string) => {
    const isChecked = formData.tools.includes(value);
    if (!isChecked) {
      setFormData({ ...formData, tools: [...formData.tools, value] });
    } else {
      setFormData({ ...formData, tools: formData.tools.filter(t => t !== value) });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // 1. Update user profile state
      await updateProfile({ coffeePreferences: formData });
      
      // 2. Persist to dedicated localStorage for 100% offline & instant recall
      if (user?.email) {
        localStorage.setItem(`ramu_coffee_preferences_${user.email}`, JSON.stringify(formData));
        
        // 3. Post notification to in-app notification center
        fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userEmail: user.email,
            title: lang === 'ja' ? '☕ コーヒープロファイルを更新しました' : (lang === 'en' ? '☕ Coffee Profile Updated' : '☕ Profil Kopi Diperbarui'),
            desc: lang === 'ja' 
              ? 'お好みの味覚プロファイルが保存され、パーソナライズされたおすすめ珈琲が反映されました。'
              : (lang === 'en'
                ? 'Your taste preferences have been saved and personalized recommendations are now active.'
                : 'Preferensi seduhan rasa Anda berhasil disimpan dan rekomendasi kopi telah disesuaikan.'),
            href: '/dashboard/coffee-profile'
          })
        }).catch(() => {});
      }

      setHasProfile(true);
      setIsEditing(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      addToast(translations.cp_success || 'Profil selera kopi berhasil disimpan! ☕', 'success');
    } catch (_error) {
      addToast(translations.cp_fail || 'Gagal menyimpan profil kopi. Silakan coba lagi.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };


  const getIconForValue = (category: keyof typeof questions, value: string) => {
    if (category === 'tools') return '🛠️'; // General icon for tools array
    const option = questions[category].options.find(opt => opt.id === value);
    return option ? option.icon : '✨';
  };

  // --- RENDER VIEW MODE (SUMMARY) ---
  if (hasProfile && !isEditing) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>{translations.cp_title_summary}</h1>
          <p className={styles.description}>
            {translations.cp_sub_summary}
          </p>
        </div>

        <div className={styles.summaryContainer}>
          <div className={styles.summaryHeader}>
            <div className={styles.summaryTitle}>
              <span className={styles.summaryTitleIcon}>☕</span> 
              {translations.cp_identity}
            </div>
            <button className={styles.editBtn} onClick={() => setIsEditing(true)}>
              {translations.cp_edit}
            </button>
          </div>

          <div className={styles.summaryGrid}>
            <div className={styles.summaryItem}>
              <div className={styles.summaryItemIcon}>{getIconForValue('favoriteDrink', formData.favoriteDrink)}</div>
              <div className={styles.summaryItemContent}>
                <span className={styles.summaryLabel}>{translations.cp_fav_drink}</span>
                <span className={styles.summaryValue}>{questions.favoriteDrink.options.find(o => o.id === formData.favoriteDrink)?.text || '-'}</span>
              </div>
            </div>
            <div className={styles.summaryItem}>
              <div className={styles.summaryItemIcon}>{getIconForValue('tastePreference', formData.tastePreference)}</div>
              <div className={styles.summaryItemContent}>
                <span className={styles.summaryLabel}>{translations.cp_taste}</span>
                <span className={styles.summaryValue}>{questions.tastePreference.options.find(o => o.id === formData.tastePreference)?.text || '-'}</span>
              </div>
            </div>
            <div className={styles.summaryItem}>
              <div className={styles.summaryItemIcon}>{getIconForValue('frequency', formData.frequency)}</div>
              <div className={styles.summaryItemContent}>
                <span className={styles.summaryLabel}>{translations.cp_freq}</span>
                <span className={styles.summaryValue}>{questions.frequency.options.find(o => o.id === formData.frequency)?.text || '-'}</span>
              </div>
            </div>
            <div className={styles.summaryItem}>
              <div className={styles.summaryItemIcon}>{getIconForValue('budget', formData.budget)}</div>
              <div className={styles.summaryItemContent}>
                <span className={styles.summaryLabel}>{translations.cp_budget}</span>
                <span className={styles.summaryValue}>{questions.budget.options.find(o => o.id === formData.budget)?.text || '-'}</span>
              </div>
            </div>
            <div className={styles.summaryItem} style={{ gridColumn: '1 / -1' }}>
              <div className={styles.summaryItemIcon}>🛠️</div>
              <div className={styles.summaryItemContent}>
                <span className={styles.summaryLabel}>{translations.cp_tools_title}</span>
                <span className={styles.summaryValue}>
                  <div style={{ display: 'flex', gap: '2rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                    <div><strong>{translations.cp_brewer}</strong> {formData.tools.length > 0 ? formData.tools.map(t => questions.tools.options.find(o => o.id === t)?.text || t).join(', ') : '-'}</div>
                    <div><strong>{translations.cp_grinder}</strong> {questions.grinder.options.find(o => o.id === formData.grinder)?.text || '-'}</div>
                    <div><strong>{translations.cp_machine}</strong> {questions.machine.options.find(o => o.id === formData.machine)?.text || '-'}</div>
                  </div>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER EDIT MODE (FORM) ---
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>{hasProfile ? translations.cp_title_edit : translations.cp_title_new}</h1>
        <p className={styles.description}>
          {translations.cp_sub_new}
        </p>
      </div>

      <form className={styles.formCard} onSubmit={handleSubmit}>
        
        {/* Single Choice Questions */}
        {(Object.keys(questions) as Array<keyof typeof questions>).map((key, index) => {
          const q = questions[key];
          const isCheckbox = key === 'tools';
          
          return (
            <div key={key} className={styles.questionBlock}>
              <label className={styles.questionLabel}>
                <span>0{index + 1}.</span> {q.label}
              </label>
              
              <div className={styles.optionsGrid}>
                {q.options.map(opt => {
                  const isSelected = isCheckbox 
                    ? formData.tools.includes(opt.id)
                    : formData[key as keyof typeof formData] === opt.id;

                  return (
                    <label 
                      key={opt.id} 
                      className={`${styles.optionCard} ${isSelected ? styles.selected : ''}`}
                    >
                      <input 
                        type={isCheckbox ? "checkbox" : "radio"} 
                        name={key}
                        className={styles.hiddenInput}
                        checked={isSelected}
                        onChange={() => isCheckbox ? handleCheckboxChange(opt.id) : handleRadioChange(key, opt.id)}
                        required={!isCheckbox && !formData[key as keyof typeof formData]} 
                      />
                      <div className={styles.optionIcon}>{opt.icon}</div>
                      <div className={styles.optionText}>{opt.text}</div>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div className={styles.btnGroup}>
          {hasProfile && (
            <button type="button" onClick={() => setIsEditing(false)} className={styles.cancelBtn}>
              {translations.cp_cancel}
            </button>
          )}
          <button type="submit" className={styles.submitBtn} style={{ flex: 2 }} disabled={isSubmitting}>
            {isSubmitting ? '...' : translations.cp_save}
          </button>
        </div>
      </form>
    </div>
  );
}
