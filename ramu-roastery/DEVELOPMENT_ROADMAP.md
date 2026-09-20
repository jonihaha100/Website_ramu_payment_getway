# 🚀 Development Roadmap & PR (Pekerjaan Rumah) - Ramu Roastery

Dokumen ini adalah panduan dan catatan untuk pengembangan lanjutan (Homework / PR) website Ramu Roastery. Dokumen ini berisi daftar fitur yang saat ini berstatus disembunyikan (*hidden*), menggunakan data *dummy*, atau belum terintegrasi secara penuh, beserta petunjuk bagaimana cara mengaktifkannya di masa depan.

---

## 1. Fitur yang Disembunyikan (*Hidden / Disabled*)

### 📦 Halaman Lacak Pesanan Internal (`/track`)
- **Status Saat Ini:** Link menu "Lacak Pesanan" di *Navbar* telah dikomentari/disembunyikan (Lihat `src/components/Navbar/Navbar.tsx`). Endpoint `api/track` saat ini menggunakan logika *dummy* (Simulator).
- **PR Pengembangan:** 
  1. Anda membutuhkan **API Key RajaOngkir tipe Basic/Pro** atau penyedia layanan *Waybill Tracking* lainnya (seperti BinderByte / Biteship). Akun RajaOngkir *Starter* (Gratis) yang saat ini ada di `.env` tidak memiliki akses ke fitur pelacakan resi.
  2. Saat lisensi API sudah siap, perbarui file `src/app/api/track/route.ts` untuk menghapus logika simulator *dummy* dan melakukan *fetch* (HTTP GET/POST) ke server API *Tracking* asli.
  3. Setelah integrasi *backend* selesai, hapus tanda komentar pada *link* `/track` di `src/components/Navbar/Navbar.tsx` untuk memunculkannya kembali ke publik.
- **Solusi Sementara (Sudah Aktif):** Saat *user* melacak resi melalui dasbor pengguna (`/dashboard/orders`), sistem akan membuka *tab* baru langsung ke website `cekresi.com` dengan membawa parameter nomor resi.

---

## 2. Fitur yang Belum Terlaksana & Butuh Integrasi Lanjutan

### 💳 Payment Gateway (Midtrans)
- **Status Saat Ini:** Tombol "Bayar Sekarang" di keranjang masih belum terkoneksi ke *pop-up* Snap Midtrans. Alur pembayaran saat ini masih menggunakan simulasi klik.
- **PR Pengembangan:**
  1. Daftar dan dapatkan *Client Key* & *Server Key* di dasbor [Midtrans Sandbox](https://simulator.sandbox.midtrans.com/).
  2. Masukkan *keys* tersebut ke dalam file `.env` proyek.
  3. Sambungkan logika *checkout* di halaman keranjang (`src/app/checkout/page.tsx`) agar saat pengguna *checkout*, sistem memanggil *backend* untuk membuat `Snap Token` Midtrans, lalu memunculkan jendela Snap di *frontend*.

### 🏢 Sistem Harga Grosir (B2B)
- **Status Saat Ini:** Skema diskon untuk pembelian dalam jumlah besar (Grosir) atau *tier* akun khusus (B2B) belum diterapkan.
- **PR Pengembangan:**
  1. Perlu dibuatkan logika khusus di `schema.prisma`, misalnya menambahkan peran/tipe akun seperti `Role: B2B_Customer` atau di tabel produk ditambahkan kolom `wholesalePrice`.
  2. Tambahkan logika validasi di kalkulasi keranjang (`CartContext.tsx`) agar jika peran pengguna adalah B2B, atau jumlah barang melewati angka tertentu (misal >10kg), maka harga per *item* otomatis diturunkan.

### 🌐 Pengiriman ke Luar Negeri (International Shipping)
- **Status Saat Ini:** Tabel RajaOngkir di *dropdown* Checkout saat ini dirancang untuk wilayah seluruh Indonesia.
- **PR Pengembangan:**
  1. Integrasikan instruksi *"Untuk pembelian dari luar negeri, silakan hubungi via WhatsApp"* di halaman *Checkout* saat pembeli mengganti negara/provinsi ke opsi "Luar Negeri".
  2. Arahkan pesanan internasional ini agar diproses secara manual via WhatsApp Admin dengan membawa *draft* pesanan, karena RajaOngkir domestik tidak dapat menghitung biaya kirim kargo internasional otomatis.

### 🚀 Go-Live (Deployment ke Vercel)
- **Status Saat Ini:** Aplikasi masih berjalan di server pengembangan lokal (`localhost`).
- **PR Pengembangan:**
  1. *Push* semua *source code* ini ke *repository* GitHub.
  2. Sambungkan *repository* GitHub tersebut ke platform *hosting* **Vercel**.
  3. Pastikan untuk mengisi *Environment Variables* di setelan dasbor Vercel (contoh: variabel `DATABASE_URL` Supabase, `RAJAONGKIR_API_KEY`, dan `MIDTRANS_SERVER_KEY`).

---

## 3. Catatan Penting Mengenai Database (Prisma & Supabase)
- **Laporan Penjualan (Tutup Buku):** Telah kami migrasikan dari *file dummy* JSON ke tabel nyata di database PostgreSQL (Tabel `Closing`). Tidak perlu khawatir data tutup buku akan hilang saat *website* di-online-kan.
- **Integrasi Waktu (Tanggal):** Jangan lupa bahwa sistem *backend* menggunakan kolom `createdAt` dari Prisma (format Tanggal *Database*), namun sistem laporan grafik dan *frontend* telah dirancang agar aman membaca *mapping* tersebut.
- *Reminder*: Jika Anda membuat tabel baru atau mengubah tabel yang ada di `schema.prisma`, **selalu** jalankan perintah `npx prisma db push` di terminal agar struktur *database* di Supabase ikut menyesuaikan.

---
*Catatan dibuat pada: September 2026*
