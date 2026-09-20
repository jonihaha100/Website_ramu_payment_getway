"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { useLang } from '../../../context/LanguageContext';
import { useToast } from '../../../context/ToastContext';
import { t } from '../../../data/translations';
import { Order, OrderItem } from '../../../data/mockOrders';
import styles from './reviews.module.css';

interface ReviewItem extends OrderItem {
  orderId?: string;
  orderDate?: string;
  weight?: number | string;
  grind?: string;
  rating?: number;
  reviewText?: string;
  reviewDate?: string;
  reply?: string;
  variant?: string;
}

export default function ReviewsPage() {
  const { user } = useAuth();
  const { lang } = useLang();
  const { addToast } = useToast();
  const tr = t[lang];
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [pendingItems, setPendingItems] = useState<ReviewItem[]>([]);
  const [reviewedItems, setReviewedItems] = useState<ReviewItem[]>([]);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ReviewItem | null>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewPhotos, setReviewPhotos] = useState<string[]>([]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReviewPhotos(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    }
  };

  const searchParams = useSearchParams();
  const orderIdParam = searchParams ? searchParams.get('orderId') : null;

  useEffect(() => {
    const fetchReviewsAndOrders = async () => {
      try {
        const [ordersRes, reviewsRes] = await Promise.all([
          fetch(`/api/orders?customerEmail=${encodeURIComponent(user?.email || '')}`),
          fetch('/api/reviews')
        ]);
        
        const ordersData = await ordersRes.json();
        const reviewsData = await reviewsRes.json();
        
        // Include both Delivered and Completed orders
        const userOrders = ordersData.filter((order: Order) => 
          order.customerEmail === user?.email && 
          (order.status === 'Delivered' || order.status === 'Completed')
        );
        
        const allItems: ReviewItem[] = [];
        userOrders.forEach((order: Order) => {
          (order.items || []).forEach((item: OrderItem) => {
            allItems.push({
              ...item,
              orderId: order.id,
              orderDate: order.date
            });
          });
        });

        const pending: ReviewItem[] = [];
        const reviewed: ReviewItem[] = [];

        allItems.forEach(item => {
          const existingReview = reviewsData.find((r: any) => 
            r.orderId === item.orderId && r.productName === item.name
          );
          
          if (existingReview) {
            reviewed.push({ 
              ...item, 
              rating: existingReview.rating, 
              reviewText: existingReview.comment, 
              reviewDate: existingReview.date,
              reply: existingReview.reply
            });
          } else {
            pending.push(item);
          }
        });

        setPendingItems(pending);
        setReviewedItems(reviewed);
        
        // Auto open if orderId is in URL
        if (orderIdParam) {
          const itemToReview = pending.find(i => i.orderId === orderIdParam);
          if (itemToReview && !isModalOpen) {
            openReviewModal(itemToReview);
          }
        }
      } catch (_err) {
        console.error("Failed to fetch data:", _err);
      }
    };

    if (user?.email) {
      fetchReviewsAndOrders();
    }
  }, [user, orderIdParam]);

  const openReviewModal = (item: ReviewItem) => {
    setSelectedItem(item);
    setRating(0);
    setReviewText('');
    setReviewPhotos([]);
    setIsModalOpen(true);
  };

  const closeReviewModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleSubmitReview = async () => {
    if (!selectedItem) return;
    setIsSubmitting(true);

    const newReviewApi = {
      orderId: selectedItem.orderId,
      productId: (selectedItem as any).productId || selectedItem.id.split('-').slice(0, 3).join('-'),
      productName: selectedItem.name,
      customerName: user?.name || "Customer",
      rating,
      comment: reviewText,
      date: new Date().toISOString(),
      status: 'Published',
      variant: selectedItem.variant || "",
      photos: reviewPhotos.length > 0 ? reviewPhotos : undefined
    };

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReviewApi)
      });

      if (res.ok) {
        const newReview: ReviewItem = {
          ...selectedItem,
          rating,
          reviewText,
          reviewDate: newReviewApi.date
        };
        
        setReviewedItems([newReview, ...reviewedItems]);
        setPendingItems(pendingItems.filter(item => item.id !== selectedItem.id));
        
        setSubmitSuccess(true);
        setTimeout(() => {
          closeReviewModal();
          setSubmitSuccess(false);
        }, 2000);
      } else {
        addToast(
          lang === 'ja' ? 'レビューの投稿に失敗しました。' : (lang === 'en' ? 'Failed to submit review.' : 'Gagal mengirim ulasan.'),
          'error'
        );
      }
    } catch (err) {
      addToast(
        lang === 'ja' ? 'システムエラーが発生しました。' : (lang === 'en' ? 'A system error occurred.' : 'Terjadi kesalahan sistem saat mengirim ulasan.'),
        'error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className={styles.title}>{tr.dash_rev_title}</h1>
      <p className={styles.description}>{tr.dash_rev_desc}</p>

      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'pending' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          {tr.dash_rev_tab_wait} ({pendingItems.length})
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'history' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('history')}
        >
          {tr.dash_rev_tab_hist} ({reviewedItems.length})
        </button>
      </div>

      {activeTab === 'pending' && (
        <div className={styles.grid}>
          {pendingItems.length > 0 ? (
            pendingItems.map((item, idx) => (
              <div key={idx} className={styles.card}>
                <div className={styles.itemHeader}>
                  <div>
                    <h3 className={styles.itemName}>{item.name}</h3>
                    <div className={styles.itemMeta}>{lang === 'ja' ? '仕様:' : (lang === 'en' ? 'Variant:' : 'Varian:')} {item.weight}g | {item.grind}</div>
                  </div>
                </div>
                <div className={styles.orderDate}>
                  {lang === 'ja' ? '注文番号:' : (lang === 'en' ? 'Order ID:' : 'Pesanan:')} {item.orderId}
                </div>
                <button className={styles.btnReview} onClick={() => openReviewModal(item)}>
                  {tr.dash_rev_btn_write}
                </button>
              </div>
            ))
          ) : (
            <div className={styles.emptyState}>
              {tr.dash_rev_empty_wait}
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className={styles.grid}>
          {reviewedItems.length > 0 ? (
            reviewedItems.map((item, idx) => (
              <div key={idx} className={styles.historyCard}>
                <div className={styles.itemHeader}>
                  <div>
                    <h3 className={styles.itemName}>{item.name}</h3>
                    <div className={styles.itemMeta}>{lang === 'ja' ? '仕様:' : (lang === 'en' ? 'Variant:' : 'Varian:')} {item.weight}g | {item.grind}</div>
                  </div>
                </div>
                <div className={styles.historyStars}>
                  {'★'.repeat(item.rating || 0)}{'☆'.repeat(5 - (item.rating || 0))}
                </div>
                {item.reviewText && (
                  <div className={styles.historyText}>
                    &quot;{item.reviewText}&quot;
                  </div>
                )}
                {item.reply && (
                  <div style={{
                    marginTop: '0.75rem',
                    padding: '0.75rem',
                    backgroundColor: '#eff6ff',
                    borderRadius: '0.5rem',
                    borderLeft: '3px solid #3b82f6',
                    fontSize: '0.875rem'
                  }}>
                    <div style={{ fontWeight: 'bold', color: '#1d4ed8', marginBottom: '0.25rem', fontSize: '0.75rem' }}>
                      {lang === 'ja' ? 'ラム・ロースタリーからの返信:' : (lang === 'en' ? 'Ramu Roastery reply:' : 'Admin Ramu Roastery membalas:')}
                    </div>
                    <p style={{ margin: 0, color: '#1e3a8a' }}>{item.reply}</p>
                  </div>
                )}
                <div className={styles.orderDate} style={{ alignSelf: 'flex-start', marginTop: 'auto', paddingTop: '1rem' }}>
                  {lang === 'ja' ? '投稿日:' : (lang === 'en' ? 'Reviewed:' : 'Diulas:')} {item.reviewDate ? new Date(item.reviewDate).toLocaleDateString(lang === 'ja' ? 'ja-JP' : (lang === 'en' ? 'en-US' : 'id-ID')) : '-'}
                </div>
              </div>
            ))
          ) : (
            <div className={styles.emptyState}>
              {tr.dash_rev_empty_hist}
            </div>
          )}
        </div>
      )}

      {isModalOpen && selectedItem && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2 className={styles.modalTitle}>{tr.dash_rev_modal_title}</h2>
            <p className={styles.modalSubtitle}>
              {lang === 'ja'
                ? <><strong>{selectedItem.name}</strong> の味わいはいかがでしたか？</>
                : (lang === 'en'
                  ? <>How did you like <strong>{selectedItem.name}</strong>?</>
                  : <>Bagaimana rasa <strong>{selectedItem.name}</strong>?</>)}
            </p>
            
            {submitSuccess ? (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <div style={{ 
                  width: '64px', height: '64px', backgroundColor: '#10b981', 
                  borderRadius: '50%', display: 'flex', alignItems: 'center', 
                  justifyContent: 'center', margin: '0 auto 1rem auto',
                  color: 'white', fontSize: '2rem'
                }}>✓</div>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#111827' }}>{lang === 'ja' ? 'ご投稿ありがとうございます！' : (lang === 'en' ? 'Thank You!' : 'Terima Kasih!')}</h3>
                <p style={{ color: '#6b7280', margin: 0 }}>{lang === 'ja' ? 'お客様のご感想はロースタリーの励みになります。' : (lang === 'en' ? 'Your review means a lot to us.' : 'Ulasan Anda sangat berarti bagi kami.')}</p>
              </div>
            ) : (
              <>
                <div className={styles.starRating}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <span 
                      key={star}
                      className={`${styles.star} ${(hoverRating || rating) >= star ? styles.starActive : ''}`}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                    >
                      ★
                    </span>
                  ))}
                </div>

                <textarea 
                  className={styles.textarea}
                  placeholder={lang === 'ja' ? 'コーヒーの抽出体験、アロマ、味わい（酸味・甘み・余韻など）をお聞かせください...' : (lang === 'en' ? 'Share your brewing experience (aroma, tasting notes, finish, etc)...' : 'Ceritakan pengalaman Anda menyeduh kopi ini (aroma, rasa, dll)...')}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  disabled={isSubmitting}
                />

                <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>{tr.dash_rev_lbl_photo}</label>
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} disabled={isSubmitting} />
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                    {reviewPhotos.map((photo, idx) => (
                      <img key={idx} src={photo} alt={`Upload ${idx}`} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} />
                    ))}
                  </div>
                </div>

                <div className={styles.modalActions}>
                  <button className={styles.btnCancel} onClick={closeReviewModal} disabled={isSubmitting}>{lang === 'ja' ? 'キャンセル' : (lang === 'en' ? 'Cancel' : 'Batal')}</button>
                  <button 
                    className={styles.btnSubmit} 
                    onClick={handleSubmitReview}
                    disabled={rating === 0 || isSubmitting}
                  >
                    {isSubmitting ? (lang === 'ja' ? '送信中...' : (lang === 'en' ? 'Submitting...' : 'Mengirim...')) : tr.dash_rev_btn_submit}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
