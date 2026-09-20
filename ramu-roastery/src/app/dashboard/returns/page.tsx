"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useLang } from '../../../context/LanguageContext';
import { useToast } from '../../../context/ToastContext';
import { t } from '../../../data/translations';
import { Order, OrderItem } from '../../../data/mockOrders';
import styles from './returns.module.css';

interface ReturnTicket {
  id: string;
  orderId?: string;
  customerName?: string;
  customerEmail?: string;
  dateRequested: string;
  itemName: string;
  reason: string;
  description: string;
  status: string;
  adminNotes?: string;
  proofImageUrl?: string;
}

interface ExtendedOrderItem extends OrderItem {
  orderId?: string;
  weight?: number | string;
  grind?: string;
}

export default function ReturnsPage() {
  const { user } = useAuth();
  const { lang } = useLang();
  const { addToast } = useToast();
  const tr = t[lang];
  
  // Dummy return tickets state
  const [returns, setReturns] = useState<ReturnTicket[]>([]);
  const [deliveredItems, setDeliveredItems] = useState<ExtendedOrderItem[]>([]);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItemStr, setSelectedItemStr] = useState('');
  const [reasonCategory, setReasonCategory] = useState('');
  const [reasonDetail, setReasonDetail] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  
  // Tracking number states
  const [trackingInputs, setTrackingInputs] = useState<Record<string, string>>({});
  const [submittingTracking, setSubmittingTracking] = useState<string | null>(null);

  useEffect(() => {
    const fetchDeliveredOrders = async () => {
      try {
        const res = await fetch(`/api/orders?customerEmail=${encodeURIComponent(user?.email || '')}`);
        const data = await res.json();
        
        const userOrders = data.filter((order: Order) => order.customerEmail === user?.email && order.status === 'Delivered');
        
        const items: ExtendedOrderItem[] = [];
        userOrders.forEach((order: Order) => {
          (order.items || []).forEach((item: OrderItem) => {
            items.push({
              ...item,
              orderId: order.id,
            });
          });
        });
        setDeliveredItems(items);
      } catch (_err) {
        console.error("Failed to fetch orders:", _err);
      }
    };

    const fetchReturns = async () => {
      try {
        const res = await fetch(`/api/returns?userEmail=${user?.email}`);
        const data = await res.json();
        setReturns(data);
      } catch (err) {
        console.error("Failed to fetch returns:", err);
      }
    };

    if (user?.email) {
      fetchDeliveredOrders();
      fetchReturns();
    }
  }, [user]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending': return <span className={`${styles.badge} ${styles.badgePending}`}>{tr.dash_ret_status_wait}</span>;
      case 'Approved': return <span className={`${styles.badge} ${styles.badgeApproved}`}>{tr.dash_ret_status_appr}</span>;
      case 'Rejected': return <span className={`${styles.badge} ${styles.badgeRejected}`}>{tr.dash_ret_status_rej}</span>;
      default: return null;
    }
  };

  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemStr || !reasonCategory || !reasonDetail) return;

    const parsedItem = JSON.parse(selectedItemStr);
    
    let base64Image = '';
    if (proofFile) {
      base64Image = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(proofFile);
      });
    }

    const newReturn = {
      orderId: parsedItem.orderId,
      customerEmail: user?.email,
      customerName: user?.name || user?.email,
      itemName: `${parsedItem.name} ${parsedItem.weight}g | ${parsedItem.grind}`,
      reason: reasonCategory,
      description: reasonDetail,
      proofImageUrl: base64Image,
    };

    try {
      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReturn)
      });
      if (res.ok) {
        const result = await res.json();
        setReturns([result.data, ...returns]);
        setIsModalOpen(false);
        setSelectedItemStr('');
        setReasonCategory('');
        setReasonDetail('');
        setProofFile(null);
        addToast(
          lang === 'ja'
            ? '返品リクエストを送信しました！担当者が速やかに確認いたします。'
            : lang === 'en'
            ? 'Return request submitted successfully! Our team will review it shortly.'
            : 'Pengajuan pengembalian berhasil dikirim! Admin akan segera memprosesnya.',
          'success'
        );
      } else {
        addToast(
          lang === 'ja'
            ? 'リクエストの送信に失敗しました。'
            : lang === 'en'
            ? 'Failed to submit return request.'
            : 'Gagal mengirim pengajuan.',
          'error'
        );
      }
    } catch (err) {
      console.error(err);
      addToast(
        lang === 'ja'
          ? '通信エラーが発生しました。'
          : lang === 'en'
          ? 'A network error occurred.'
          : 'Gagal mengirim pengajuan.',
        'error'
      );
    }
  };

  const handleSubmitTracking = async (returnId: string) => {
    const trackingNo = trackingInputs[returnId];
    if (!trackingNo || trackingNo.trim() === '') {
      addToast(
        lang === 'ja'
          ? '配送伝票番号を入力してください。'
          : lang === 'en'
          ? 'Please enter tracking number first.'
          : 'Mohon masukkan nomor resi terlebih dahulu.',
        'error'
      );
      return;
    }
    
    setSubmittingTracking(returnId);
    try {
      const res = await fetch('/api/returns', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: returnId,
          returnTrackingNumber: trackingNo
        })
      });
      
      if (res.ok) {
        // Update local state
        setReturns(prev => prev.map(r => {
          if (r.id === returnId) {
            return { ...r, status: 'In Transit', returnTrackingNumber: trackingNo };
          }
          return r;
        }));
        addToast(
          lang === 'ja'
            ? '伝票番号を保存しました！返送品の到着を確認いたします。'
            : lang === 'en'
            ? 'Tracking number saved! We will monitor your returned shipment.'
            : 'Resi berhasil disimpan! Kami akan memantau pengiriman barang Anda.',
          'success'
        );
      } else {
        addToast(
          lang === 'ja'
            ? '伝票番号の保存に失敗しました。'
            : lang === 'en'
            ? 'Failed to save tracking number.'
            : 'Gagal menyimpan resi pengiriman.',
          'error'
        );
      }
    } catch (err) {
      console.error(err);
      addToast(
        lang === 'ja'
          ? 'データ処理に失敗しました。'
          : lang === 'en'
          ? 'Failed to process data.'
          : 'Gagal memproses data.',
        'error'
      );
    } finally {
      setSubmittingTracking(null);
    }
  };

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{tr.dash_ret_title}</h1>
          <p className={styles.description}>{tr.dash_ret_desc}</p>
        </div>
        <button className={styles.btnNewReturn} onClick={() => setIsModalOpen(true)}>
          {tr.dash_ret_btn_new}
        </button>
      </div>

      <div className={styles.grid}>
        {returns.length > 0 ? (
          returns.map((ret, idx) => (
            <div key={idx} className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <div className={styles.ticketId}>{ret.id}</div>
                  <div className={styles.ticketDate}>
                    {new Date(ret.dateRequested).toLocaleDateString('id-ID', {
                      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </div>
                </div>
                <div>{getStatusBadge(ret.status)}</div>
              </div>
              
              <div className={styles.itemInfo}>
                <span className={styles.itemName}>{ret.itemName}</span>
                <span className={styles.ticketDate}>
                  {lang === 'ja' ? 'カテゴリー: ' : lang === 'en' ? 'Category: ' : 'Kategori: '}{ret.reason}
                </span>
              </div>
              
              <div className={styles.reason}>
                &quot;{ret.description}&quot;
              </div>

              {ret.status === 'Approved' && (
                <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#ecfdf5', border: '1px solid #10b981', borderRadius: '0.5rem' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#047857' }}>
                    {lang === 'ja' ? '返送手順のご案内' : lang === 'en' ? 'Return Shipping Instructions' : 'Instruksi Pengiriman'}
                  </h4>
                  <p style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', color: '#065f46' }}>
                    {lang === 'ja' ? (
                      <>返品リクエストが承認されました。商品と同梱物を以下の住所宛てにご返送ください: <strong>Ramu Roastery 配送センター, Jl. Kopi No. 1, Jakarta Selatan</strong></>
                    ) : lang === 'en' ? (
                      <>Your claim has been approved. Please send the item and its packaging to: <strong>Ramu Roastery Warehouse, Jl. Kopi No. 1, South Jakarta</strong>.</>
                    ) : (
                      <>Komplain Anda telah disetujui. Silakan kirimkan barang beserta kelengkapannya ke alamat: <strong>Gudang Ramu Roastery, Jl. Kopi No. 1, Jakarta Selatan</strong>.</>
                    )}
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input 
                      type="text" 
                      placeholder={lang === 'ja' ? '配送伝票番号（追跡番号）を入力' : lang === 'en' ? 'Enter Courier Tracking Number' : 'Masukkan Nomor Resi Kurir'}
                      value={trackingInputs[ret.id] || ''}
                      onChange={(e) => setTrackingInputs({ ...trackingInputs, [ret.id]: e.target.value })}
                      style={{ flex: 1, padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #d1d5db' }}
                    />
                    <button 
                      onClick={() => handleSubmitTracking(ret.id)}
                      disabled={submittingTracking === ret.id}
                      style={{ padding: '0.5rem 1rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: submittingTracking === ret.id ? 'not-allowed' : 'pointer' }}
                    >
                      {submittingTracking === ret.id 
                        ? (lang === 'ja' ? '処理中...' : lang === 'en' ? 'Processing...' : 'Memproses...') 
                        : (lang === 'ja' ? '伝票番号を送信' : lang === 'en' ? 'Submit Tracking' : 'Kirim Resi')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className={styles.emptyState}>
            {tr.dash_ret_empty}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2 className={styles.modalTitle}>{tr.dash_ret_modal_title}</h2>
            <p className={styles.modalSubtitle}>{tr.dash_ret_modal_sub}</p>
            
            <form onSubmit={handleSubmitReturn}>
              <div className={styles.formGroup}>
                <label className={styles.label}>{tr.dash_ret_lbl_item}</label>
                <select 
                  className={styles.select} 
                  required
                  value={selectedItemStr}
                  onChange={(e) => setSelectedItemStr(e.target.value)}
                >
                  <option value="" disabled>
                    {lang === 'ja' ? '-- 配送完了した注文から商品を選択 --' : lang === 'en' ? '-- Select item from delivered orders --' : '-- Pilih Barang dari Pesanan Selesai --'}
                  </option>
                  {deliveredItems.map((item, idx) => (
                    <option key={idx} value={JSON.stringify(item)}>
                      [{item.orderId}] {item.name} - {item.weight}g ({item.grind})
                    </option>
                  ))}
                </select>
                {deliveredItems.length === 0 && (
                  <p style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                    {lang === 'ja' ? '現在、返品申請の対象となる配送完了注文はありません。' : lang === 'en' ? 'You do not have any completed orders available for return.' : 'Anda belum memiliki pesanan yang berstatus selesai.'}
                  </p>
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>{tr.dash_ret_lbl_reason}</label>
                <select 
                  className={styles.select} 
                  required
                  value={reasonCategory}
                  onChange={(e) => setReasonCategory(e.target.value)}
                >
                  <option value="" disabled>{lang === 'ja' ? '-- 理由を選択 --' : lang === 'en' ? '-- Select Reason --' : '-- Pilih Alasan --'}</option>
                  <option value="Produk Rusak/Bocor">{lang === 'ja' ? '商品の破損 / パッケージ漏れ' : lang === 'en' ? 'Damaged Product / Leaking Package' : 'Produk Rusak / Kemasan Bocor'}</option>
                  <option value="Salah Produk">{lang === 'ja' ? '誤った商品が届いた' : lang === 'en' ? 'Wrong Product Delivered' : 'Salah Produk yang Dikirim'}</option>
                  <option value="Barang Kurang">{lang === 'ja' ? '注文数量不足' : lang === 'en' ? 'Missing Items in Package' : 'Barang Kurang dari Jumlah Pesanan'}</option>
                  <option value="Kadaluarsa">{lang === 'ja' ? '賞味期限超過' : lang === 'en' ? 'Expired Product' : 'Produk Kadaluarsa (Expired)'}</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>{tr.dash_ret_lbl_proof}</label>
                <input 
                  type="file" 
                  className={styles.fileInput} 
                  accept="image/*,video/*" 
                  required 
                  onChange={(e) => setProofFile(e.target.files ? e.target.files[0] : null)}
                />
                <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.25rem' }}>Max 10MB. Format: JPG, PNG, MP4.</p>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>{tr.dash_ret_lbl_desc}</label>
                <textarea 
                  className={styles.textarea}
                  required
                  placeholder={lang === 'ja' ? '問題の状況を詳しくご記入ください...' : lang === 'en' ? 'Describe the issue you experienced in detail...' : 'Jelaskan secara detail masalah yang Anda alami...'}
                  value={reasonDetail}
                  onChange={(e) => setReasonDetail(e.target.value)}
                />
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.btnCancel} onClick={() => setIsModalOpen(false)}>{tr.dash_ret_btn_cancel}</button>
                <button 
                  type="submit" 
                  className={styles.btnSubmit}
                  disabled={deliveredItems.length === 0}
                >
                  {tr.dash_ret_btn_submit}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
