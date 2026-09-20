# PANDUAN STANDAR LOKALISASI BAHASA JEPANG (BENCHMARK: RAKUTEN JAPAN)
**Ramu Roastery Company — E-Commerce Platform**
*Referensi Acuan Baku: [https://www.rakuten.co.jp/](https://www.rakuten.co.jp/)*

---

## 1. Pendahuluan & Prinsip Dasar

Dokumen ini adalah **panduan acuan resmi (guide & benchmark)** dalam penulisan, penerjemahan, dan pengelolaan antarmuka berbahasa Jepang pada seluruh platform Ramu Roastery Company. Acuan utama yang digunakan adalah platform e-commerce nomor 1 di Jepang: **Rakuten Ichiba (楽天市場 / rakuten.co.jp)**.

### Prinsip Utama Bahasa Jepang E-Commerce (Rakuten Style)
1. **Nada Bahasa Sopan & Profesional (*Teineigo* 丁寧語 & *Kenjougo* 謙譲語):**
   - Menggunakan akhiran `〜です` / `〜ます` serta bentuk penghormatan seperti `〜ております`, `誠にありがとうございます`, `〜いただけますと幸いです`.
   - Hindari bahasa percakapan santai (*tameguchi*) atau terjemahan mesin harfiah (*literal Google Translate*).
2. **Penegasan Entitas Menggunakan Tanda Kurung Siku Tebal `【 】` (*Sumitsukikakko*):**
   - Dalam standar e-commerce Jepang (Rakuten, Amazon JP), nomor pesanan, status, nama produk, dan tag penting selalu diapit `【 】` agar mudah dibaca sekilas oleh pembeli.
   - Contoh: `ご注文番号【RAMU-44205】のお荷物を発送いたしました。`
3. **Format Tanggal & Waktu Standar Jepang (`ja-JP`):**
   - Format: `YYYY年M月D日 HH:mm` (Contoh: `2026年9月20日 15:45`).
   - Jangan gunakan format Indonesia (`DD/MM/YYYY, HH.mm`) atau format strip tanpa kanji jika berada dalam mode bahasa Jepang.
4. **Pemisahan Mata Uang & Angka:**
   - Mata uang IDR ditulis `Rp 150.000` dengan pemisah ribuan titik atau `150,000円` jika Yen.
   - Persentase diskon: `15% OFF` atau `15% 割引`.

---

## 2. Hal-Hal Penting yang Wajib Diperhatikan (*Critical Checklist*)

Sebelum melakukan push atau merilis fitur baru, pastikan hal-hal berikut telah terpenuhi:

| No | Hal yang Harus Diperhatikan | Risiko Jika Terlewat | Solusi & Standar Ramu Roastery |
|---|---|---|---|
| **1** | **Notifikasi & Status Backend** | Notifikasi di lonceng Navbar / pop-up Toast muncul dalam Bahasa Indonesia padahal user sedang membuka versi Jepang. | Gunakan helper `localizeNotification(notif.title, notif.desc, lang)` dari `@/utils/localizeNotification`. Jangan render `notif.title` dan `notif.desc` secara mentah. |
| **2** | **Format Tanggal / Jam** | Tanggal notifikasi muncul format `13/09/2026, 20.06.18` (locale `id-ID`). | Gunakan helper `formatNotificationDate(notif.time, lang)` yang otomatis mengubah ke locale `ja-JP`. |
| **3** | **String Campuran Dinamis** | Kalimat Jepang disisipi variabel bahasa Indonesia (contoh: `ご注文に使える特別割引: Diskon 15% untuk Semua Varian Kopi。`). | Format variabel dinamis sesuai bahasa aktif (contoh: `全コーヒー商品 15% OFF`). |
| **4** | **Pesan Error / Validasi Form** | Alert / pesan error di checkout tampil bahasa Inggris/Indonesia (contoh: `"Kode promo tidak ditemukan"`). | Sediakan terjemahan error spesifik: `"指定されたクーポンコードが見つかりません"`. |
| **5** | **Link WhatsApp Otomatis** | Pesan draft WhatsApp otomatis terisi teks Indonesia saat customer Jepang klik tombol kontak/custom sourcing. | Siapkan template pesan WhatsApp multi-bahasa dengan sapaan sopan Jepang. |

---

## 3. Kamus Istilah Resmi (Glossary Matrix)

### A. Notifikasi & Status Pesanan (注文状況・通知)

| Konteks / Kondisi | Bahasa Indonesia | English | Standar Rakuten Japan (日本語) |
|---|---|---|---|
| **Menu Notifikasi** | Notifikasi | Notifications | **お知らせ / 通知** |
| **Tandai Dibaca** | Tandai semua dibaca | Mark all as read | **すべて既読にする** |
| **Notifikasi Kosong** | Tidak ada notifikasi baru | No new notifications | **新しいお知らせはありません** |
| **Update Pesanan** | Update Status Pesanan | Order Status Update | **【Ramu】ご注文状況の更新** |
| **Status: Pending** | Menunggu Pembayaran | Pending Payment | **お支払い待ち / 決済確認中** |
| **Status: Processing** | Sedang Diproses (Roasting) | Processing / Roasting | **発送準備中 / 焙煎中** |
| **Status: Shipped** | Sedang Dikirim | Shipped | **商品発送完了のお知らせ** |
| **Status: Delivered** | Telah Sampai / Diterima | Delivered | **商品お届け完了のお知らせ** |
| **Status: Completed** | Transaksi Selesai | Completed | **お取引完了・レビューのお願い** |
| **Status: Cancelled** | Dibatalkan Otomatis | Auto-Cancelled | **ご注文自動キャンセルのお知らせ** |
| **Pembayaran Masuk** | Pembayaran Dikonfirmasi | Payment Confirmed | **お支払い確認完了のお知らせ** |

### B. Template Narasi Notifikasi Otomatis (Notif Descriptions)

| Tipe Notifikasi | Narasi Asli (ID) | Narasi Standar Rakuten Japan (JA) |
|---|---|---|
| **Pending** | `Pesanan RAMU-XXXX Anda sekarang berstatus: Pending.` | `ご注文番号【RAMU-XXXX】のお支払いをお待ちしております。` |
| **Processing** | `Pesanan RAMU-XXXX Anda sekarang berstatus: Processing.` | `ご注文番号【RAMU-XXXX】の焙煎・発送準備を開始いたしました。` |
| **Shipped** | `Pesanan RAMU-XXXX telah dikirim dengan resi JNT123` | `ご注文番号【RAMU-XXXX】のお荷物を発送いたしました。送り状伝票番号: JNT123` |
| **Delivered** | `Pesanan RAMU-XXXX telah tiba di tujuan...` | `ご注文番号【RAMU-XXXX】のお荷物が到着いたしました。内容をご確認の上、受取完了のお手続きをお願いいたします。` |
| **Completed** | `Pesanan RAMU-XXXX Anda sekarang berstatus: Completed.` | `ご注文番号【RAMU-XXXX】のお取引が完了いたしました。ご利用誠にありがとうございました。` |
| **Cancelled** | `Batas waktu pembayaran 24 jam untuk pesanan RAMU-XXXX telah berakhir.` | `ご注文番号【RAMU-XXXX】のお支払い期日（24時間）が経過したため、自動キャンセルとなりました。在庫は元に戻されました。` |
| **Retur Disetujui** | `Permintaan retur untuk pesanan RAMU-XXXX telah disetujui.` | `ご注文番号【RAMU-XXXX】の返品申請が承認されました。弊社ロースタリーまで着払いにてご返送ください。` |
| **Retur Ditolak** | `Permintaan retur untuk pesanan RAMU-XXXX ditolak.` | `ご注文番号【RAMU-XXXX】の返品申請は確認の結果、規定を満たさないため却下となりました。` |
| **Retur Selesai** | `Permintaan pengembalian/retur telah selesai diproses.` | `ご注文番号【RAMU-XXXX】の返品・交換のお手続きがすべて完了いたしました。` |
| **Langganan** | `Paket X (Pengiriman ke-1 dari 4) sedang diproses...` | `定期便【X】（第1回／全4回）の発送準備を開始いたしました。次回お届け予定日をご確認ください。` |

### C. Navigasi & Tombol Aksi (ナビゲーション・操作)

| Bahasa Indonesia | English | Standar Rakuten Japan (日本語) |
|---|---|---|
| Keranjang Belanja | Shopping Cart | **お買い物かご / ショッピングカート** |
| Tambah ke Keranjang | Add to Cart | **買い物かごに追加** |
| Beli Sekarang | Buy Now | **今すぐ購入** |
| Bayar Langsung / Checkout | Checkout | **レジへ進む / ご注文手続き** |
| Wishlist / Simpan | Wishlist / Save | **お気に入りに追加** |
| Ulasan Pelanggan | Customer Reviews | **お客様の声・レビュー** |
| Tulis Ulasan | Write a Review | **レビューを投稿する** |
| Kode Promo / Kupon | Promo Code / Coupon | **クーポンコード** |
| Terapkan Kupon | Apply Coupon | **クーポンを適用** |
| Batalkan Kupon | Cancel / Remove | **解除** |
| Rincian Pembayaran | Order Summary | **ご注文明細** |
| Subtotal | Subtotal | **小計** |
| Ongkos Kirim | Shipping Fee | **送料** |
| Bebas Ongkir | Free Shipping | **送料無料** |
| Total Pembayaran | Grand Total | **合計お支払い金額** |

### D. Kopi & Spesifikasi Roastery (珈琲・焙煎仕様)

| Istilah Kopi | Standar Rakuten Japan (日本語) | Keterangan Tambahan |
|---|---|---|
| **Biji Utuh** | **豆のまま (Whole Bean)** | Rekomendasi kesegaran terbaik |
| **Gilingan Kasar** | **粗挽き (Coarse)** | Untuk French Press / Cold Brew |
| **Gilingan Sedang** | **中挽き (Medium)** | Untuk V60 / Kalita Wave / Drip |
| **Gilingan Halus** | **細挽き (Fine)** | Untuk Espresso / Moka Pot |
| **Proses Wash** | **ウォッシュト (Washed)** | Karakter clean & cerah |
| **Proses Natural** | **ナチュラル (Natural)** | Karakter fruity & manis legit |
| **Proses Honey** | **ハニー (Honey)** | Karakter madu & sweetness tebal |
| **Proses Anaerob** | **アナエロビック (Anaerobic)** | Karakter kompleks & winey |

---

## 4. Arsitektur Teknis Helper Lokalisasi

Untuk memastikan sistem tidak pernah menampilkan notifikasi bercampur bahasa, seluruh pemanggilan notifikasi menggunakan modul:
`src/utils/localizeNotification.ts`

### Cara Penggunaan di Komponen:
```tsx
import { localizeNotification, formatNotificationDate } from "@/utils/localizeNotification";
import { useLang } from "@/context/LanguageContext";

export default function MyComponent({ notif }) {
  const { lang } = useLang();

  // 1. Dapatkan judul dan deskripsi yang otomatis disesuaikan dengan bahasa aktif
  const { title, desc } = localizeNotification(notif.title, notif.desc, lang);

  // 2. Format waktu sesuai locale resmi negara (ja-JP untuk Jepang)
  const formattedDate = formatNotificationDate(notif.time, lang);

  return (
    <div>
      <h4>{title}</h4>
      <p>{desc}</p>
      <small>{formattedDate}</small>
    </div>
  );
}
```

---

## 5. Ringkasan Evaluasi & Jaminan Kualitas

Dengan menerapkan panduan ini:
1. **100% Notifikasi Terdidik**: Seluruh notifikasi lama di database (`db.json`) maupun notifikasi baru yang di-generate backend secara otomatis tampil dalam Bahasa Jepang standar Rakuten.
2. **Bebas Teks Campuran**: Modal promo, error form checkout, dan template WhatsApp telah dialihbahasakan secara menyeluruh tanpa menyisakan kalimat campur aduk.
3. **Standar Industri Teruji**: Pembeli asal Jepang akan merasakan pengalaman belanja yang akrab, terpercaya, dan setaraf dengan platform e-commerce papan atas di Jepang (*Rakuten Ichiba*).
