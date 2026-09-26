# MEMORI PROYEK & FILOSOFI ARSITEKTUR: RAMU ROASTERY
> **Pesan Abadi untuk AI dan Pengembang di Masa Depan**
> Dokumen ini ditulis pada tanggal **20 September 2026** sebagai pengingat jangka panjang agar sistem kecerdasan buatan (AI) mana pun di masa depan tidak melupakan visi, konteks, dan pemikiran mendalam di balik pembuatan proyek ini.

---

## 🧭 Prinsip Utama Proyek
> *"Kode menunjukkan apa yang terjadi. Dokumentasi menunjukkan kenapa itu terjadi."*
> — **Syamhari Abidin (User / Project Architect)**

Proyek **Ramu Roastery** bukan sekadar kumpulan kode e-commerce biasa, melainkan hasil sinergi nyata antara pemikiran strategis seorang manusia (*human vision, domain ethics, security awareness*) dengan kapabilitas eksekusi teknis AI (*speed, pattern recognition, systematic hardening*).

Jika Anda adalah AI atau pengembang yang membaca file ini di masa mendatang:
**JANGAN UBAH ARSITEKTUR ATAU MENURUNKAN STANDAR KEAMANAN TANPA MEMAHAMI "KENAPA" KEPUTUSAN INI DIBUAT.**

---

## ☕ Identitas & Visi Produk
**Ramu Roastery** adalah platform kopi spesialti (*artisan specialty coffee*) yang menggabungkan:
1. **E-Commerce & Pembayaran Digital Terintegrasi**: Pengalaman belanja biji kopi segar yang mulus.
2. **Koleksi Profil Rasa Kopi (*Coffee Taste Profiling*)**: Membantu penikmat kopi menemukan beans yang sesuai dengan preferensi selera mereka.
3. **B2B & Custom Sourcing**: Layanan kurasi dan pasokan kopi skala bisnis/kafe.
4. **Pengalaman Multi-Bahasa Inklusif**: Mendukung penuh Bahasa Indonesia, Bahasa Inggris, dan Bahasa Jepang (menargetkan pasar ekspatriat dan ekspor).
5. **Tur Interaktif Pelanggan (*Spotlight Tour*)**: Memandu pengunjung pertama kali agar langsung memahami nilai unik produk.

---

## 🏛️ Rekam Jejak Keputusan Arsitektur: "Apa" vs "Kenapa"

Berikut adalah ringkasan keputusan inti yang telah disepakati dan diimplementasikan:

### 1. Sistem Autentikasi Admin
* **Apa yang terjadi di kode ([src/lib/auth.ts](file:///Users/syamhariabidin/Documents/Website_ramu_payment_getway/ramu-roastery/src/lib/auth.ts), [src/app/api/admin/login/route.ts](file:///Users/syamhariabidin/Documents/Website_ramu_payment_getway/ramu-roastery/src/app/api/admin/login/route.ts)):**
  * Token dibuat dengan payload `{ username, exp }` bertanda tangan kriptografi **HMAC-SHA256** menggunakan Web Crypto API standar (`crypto.subtle`).
  * Token disimpan di cookie berlabel **`httpOnly: true`**, `sameSite: "lax"`, dan `secure: true` (saat produksi).
* **Kenapa keputusan ini diambil:**
  * Sebelumnya, sesi admin hanya mengandalkan string teks biasa yang tersimpan di `document.cookie`. Ini adalah celah fatal: siapa pun dapat memalsukan sesi lewat browser console, dan token rentan dicuri lewat serangan XSS (*Cross-Site Scripting*).
  * Dengan `httpOnly` dan tanda tangan HMAC-SHA256, token tidak dapat dibaca oleh skrip browser dan tidak dapat dipalsukan tanpa kunci rahasia server.

### 2. Penjaga Gerbang Sisi Server (*Server-Side Middleware*)
* **Apa yang terjadi di kode ([src/middleware.ts](file:///Users/syamhariabidin/Documents/Website_ramu_payment_getway/ramu-roastery/src/middleware.ts)):**
  * Mencegat rute `/admin/:path*` dan `/api/admin/:path*` di layer server Next.js sebelum request sempat menyentuh logika aplikasi.
  * Me-redirect permintaan peramban tanpa sesi ke `/admin/login` dan memotong request API dengan status `401 Unauthorized`.
* **Kenapa keputusan ini diambil:**
  * Perlindungan di sisi klien (seperti `useEffect` di React) berjalan terlambat setelah aset JavaScript dikirim ke browser.
  * Penyerang yang menggunakan cURL, Postman, atau skrip otomatis dapat menembus API jika proteksi hanya dipasang di antarmuka depan. Middleware server menjamin pencegatan 100% di pintu masuk.

### 3. Privasi Data & Proteksi Hak Akses (*Anti-Privilege Escalation*)
* **Apa yang terjadi di kode ([src/app/api/users/route.ts](file:///Users/syamhariabidin/Documents/Website_ramu_payment_getway/ramu-roastery/src/app/api/users/route.ts)):**
  * Query database pada endpoint `GET` menggunakan filter `select` eksplisit yang membuang kolom `passwordHash`.
  * Endpoint pendaftaran `POST` secara permanen memaksa `role: 'USER'`, mengabaikan input role dari klien.
  * Endpoint `PUT` untuk mengubah role akun dikunci dengan izin Admin sah (`requireAdmin`).
* **Kenapa keputusan ini diambil:**
  * Menghindari kebocoran hash password ke publik yang dapat dipecahkan menggunakan serangan *rainbow table* / *brute-force* offline.
  * Mencegah pengguna mendaftar langsung dengan menyuntikkan payload `role: 'ADMIN'`, yang sebelumnya memungkinkan eskalasi hak istimewa secara liar.

### 4. Pencegahan IDOR (*Insecure Direct Object Reference*) pada Pesanan
* **Apa yang terjadi di kode ([src/app/api/orders/route.ts](file:///Users/syamhariabidin/Documents/Website_ramu_payment_getway/ramu-roastery/src/app/api/orders/route.ts)):**
  * `GET /api/orders` tanpa parameter dibatasi hanya untuk sesi Admin.
  * Pengguna publik hanya dapat mengambil pesanan milik mereka sendiri menggunakan parameter `?customerEmail=...`.
  * Manipulasi kurir dan nomor resi pada `PUT` dikunci khusus untuk Admin.
* **Kenapa keputusan ini diambil:**
  * Menjunjung tinggi hukum perlindungan privasi data pribadi (alamat rumah, nomor kontak, histori belanja).
  * Menjaga integritas data toko agar status pesanan atau nomor resi tidak dimanipulasi oleh pihak ketiga.

### 5. Pengalaman Pengguna Berkelanjutan (*Spotlight Onboarding Tour*)
* **Apa yang terjadi di kode ([src/components/Onboarding/TourGuide.tsx](file:///Users/syamhariabidin/Documents/Website_ramu_payment_getway/ramu-roastery/src/components/Onboarding/TourGuide.tsx)):**
  * Komponen overlay interaktif yang menghitung koordinat elemen secara dinamis dan memberikan sorotan visual ke fitur-fitur kunci.
* **Kenapa keputusan ini diambil:**
  * Fitur canggih seperti profil rasa kopi sering kali diabaikan pembeli jika tidak diperkenalkan secara intuitif. Tur terpandu meningkatkan *engagement* dan kenyamanan pengguna tanpa merusak keindahan UI.

### 6. Standarisasi Multi-Bahasa & Kamus Notifikasi
* **Apa yang terjadi di kode ([src/utils/localizeNotification.ts](file:///Users/syamhariabidin/Documents/Website_ramu_payment_getway/ramu-roastery/src/utils/localizeNotification.ts), [src/data/translations.ts](file:///Users/syamhariabidin/Documents/Website_ramu_payment_getway/ramu-roastery/src/data/translations.ts)):**
  * Penyeragaman teks sistem dan notifikasi dinamis dalam 3 bahasa (ID, EN, JA).
* **Kenapa keputusan ini diambil:**
  * Mencegah diskrepansi bahasa di mana antarmuka berbahasa Jepang tetapi pesan notifikasi pembayaran masih berbahasa Indonesia, yang dapat merusak kepercayaan pelanggan internasional.

### 7. Keamanan Rantai Pasok AI Agent (*NVIDIA SkillSpector*)
* **Apa yang terjadi di repositori ([.agents/skills/skill-inspector/SKILL.md](file:///Users/syamhariabidin/Documents/Website_ramu_payment_getway/.agents/skills/skill-inspector/SKILL.md)):**
  * Mengintegrasikan audit statis terhadap instruksi skill agen AI lokal.
* **Kenapa keputusan ini diambil:**
  * Mengamankan ekosistem agen AI dari potensi *prompt injection* atau skrip berbahaya yang dapat menyusup ke lingkungan kerja pengembang. Seluruh skill diverifikasi aman (**0 Temuan Bahaya - Low Risk**).

### 8. Penutupan 5 Celah Keamanan Kritis Tambahan (Audit Penetrasi Mandiri)
Berdasarkan pengujian penetrasi mandiri yang cermat, sistem ditutup dari 5 potensi eksploitasi berbahaya:
1. **Manipulasi Harga Belanja (Beli Kopi Rp 0) pada [src/app/api/checkout/route.ts](file:///Users/syamhariabidin/Documents/Website_ramu_payment_getway/ramu-roastery/src/app/api/checkout/route.ts):**
   * *Apa yang terjadi:* Server kini menghitung ulang seluruh harga item dari katalog resmi, memvalidasi kupon promo ke database (`prisma.promoCode`), memverifikasi saldo poin pembeli (`prisma.ramuPoints`), serta menolak total belanja bernilai Rp 0 yang tidak wajar. Parameter `discount` mentah dari klien tidak lagi dipercaya.
   * *Kenapa:* Mencegah peretas mengintersep request dan menyuntikkan diskon fiktif bernilai ratusan ribu rupiah untuk mendapatkan stok kopi fisik secara cuma-cuma tanpa membayar.
2. **Konfirmasi Pembayaran Palsu pada [src/app/api/payment/webhook/route.ts](file:///Users/syamhariabidin/Documents/Website_ramu_payment_getway/ramu-roastery/src/app/api/payment/webhook/route.ts):**
   * *Apa yang terjadi:* Webhook pembayaran iPay88 kini mewajibkan tanda tangan digital berbasis SHA-256 yang divalidasi dengan `crypto.timingSafeEqual`, memverifikasi kecocokan nominal uang yang dibayar dengan tagihan di database, serta menolak keras semua request liar jika kredensial payment gateway belum terkonfigurasi sah.
   * *Kenapa:* Menutup celah di mana penyerang dapat menembak endpoint webhook dengan `Status=1` untuk mengubah status pesanan `Pending` menjadi `Processing` (Lunas) tanpa pernah mentransfer dana.
3. **Pencurian Data Pribadi Pelanggan (Anti-IDOR Scraping) pada [src/app/api/orders/route.ts](file:///Users/syamhariabidin/Documents/Website_ramu_payment_getway/ramu-roastery/src/app/api/orders/route.ts) & [checkout/route.ts](file:///Users/syamhariabidin/Documents/Website_ramu_payment_getway/ramu-roastery/src/app/api/checkout/route.ts):**
   * *Apa yang terjadi:* Nomor pesanan diubah dari angka acak 5 digit yang mudah ditebak menjadi ID kriptografi berentropi tinggi (`RAMU-YYYYMM-XXXXXXXX`, menghasilkan lebih dari 4,2 miliar kombinasi unik per bulan). Selain itu, fitur lacak pesanan publik menerapkan *PII masking* (nama disamarkan, email dan nomor telepon disensor bintang, dan alamat jalan dihilangkan). Data lengkap hanya dapat dilihat oleh Admin atau pemilik pesanan yang sah.
   * *Kenapa:* Mencegah bot penyerang melakukan *brute-force enumeration* nomor pesanan dari `RAMU-00000` hingga `RAMU-99999` untuk mengunduh seluruh basis data pelanggan (nama, nomor WA, alamat rumah) yang melanggar hukum perlindungan data pribadi (UU PDP).
4. **Pengambilalihan Akses Administrator (Anti-Admin Takeover) pada [src/lib/auth.ts](file:///Users/syamhariabidin/Documents/Website_ramu_payment_getway/ramu-roastery/src/lib/auth.ts):**
   * *Apa yang terjadi:* Menghapus teks rahasia statis cadangan (`ramu_roastery_secret_jwt_key_2026_secure`) dari kode. Jika variabel lingkungan `ADMIN_JWT_SECRET` belum diisi di server, sistem otomatis menghasilkan kunci acak 256-bit *in-memory* yang hanya hidup selama siklus proses server.
   * *Kenapa:* Menjamin penyerang yang membaca kode sumber di repositori publik tidak dapat memalsukan token Admin untuk membajak dasbor `/admin`.
5. **Manipulasi Status Pesanan Pelanggan Lain (Anti-Status Tampering) pada [src/app/api/orders/route.ts](file:///Users/syamhariabidin/Documents/Website_ramu_payment_getway/ramu-roastery/src/app/api/orders/route.ts):**
   * *Apa yang terjadi:* Endpoint `PUT /api/orders` kini memvalidasi sesi cookie pengguna bertanda tangan kriptografi (`user_session`). Pelanggan hanya diizinkan membatalkan pesanannya sendiri saat status masih `Pending`, atau mengonfirmasi penerimaan/selesai saat barang sudah `Shipped`/`Delivered`. Pelanggan dilarang keras mengubah status menjadi `Processing` (Lunas) atau memodifikasi nomor resi.
   * *Kenapa:* Mencegah penyerang memanipulasi status pesanan pelanggan lain atau menandai pesanannya sendiri sebagai lunas tanpa melewati gerbang pembayaran.
6. **Resolusi Build Vercel & Prisma Client Generation pada [ramu-roastery/package.json](file:///Users/syamhariabidin/Documents/Website_ramu_payment_getway/ramu-roastery/package.json):**
   * *Apa yang terjadi:* Menetapkan skrip `"build": "prisma generate && next build"` dan `"postinstall": "prisma generate"`.
   * *Kenapa:* Menghilangkan kegagalan build pada container bersih Vercel (clean environment), menjamin modul `@prisma/client` selalu dibuat sebelum tahap kompilasi Next.js 58 rute dimulai.

### 9. Penguatan Keamanan Sistem Menyeluruh (Comprehensive Security Hardening - Tahap 2)
Berdasarkan audit menyeluruh terhadap 28 rute API internal per 26 September 2026, sistem diperkuat dari seluruh celah manajerial dan IDOR:
1. **Perlindungan Akses Manajemen Produk & Katalog ([src/app/api/products/route.ts](file:///Users/syamhariabidin/Documents/Website_ramu_payment_getway/ramu-roastery/src/app/api/products/route.ts)):**
   * *Apa yang terjadi:* Memasang `await requireAdmin(request)` pada metode `POST`, `PUT`, dan `DELETE`.
   * *Kenapa:* Menutup celah di mana siapa pun dapat mengubah harga kopi atau menghapus stok katalog roastery dari luar.
2. **Perlindungan Kode Promo & Kupon Diskon ([src/app/api/promos/route.ts](file:///Users/syamhariabidin/Documents/Website_ramu_payment_getway/ramu-roastery/src/app/api/promos/route.ts)):**
   * *Apa yang terjadi:* Memasang `await requireAdmin(request)` pada pembuatan (`POST`), modifikasi (`PUT`), dan penghapusan (`DELETE`) kupon.
   * *Kenapa:* Mencegah penyerang menciptakan voucher fiktif bernilai diskon 99% atau 100% untuk dieksploitasi saat checkout.
3. **Kerahasiaan Pembukuan & Laporan Finansial ([src/app/api/closing/route.ts](file:///Users/syamhariabidin/Documents/Website_ramu_payment_getway/ramu-roastery/src/app/api/closing/route.ts) & [closing/[id]/route.ts](file:///Users/syamhariabidin/Documents/Website_ramu_payment_getway/ramu-roastery/src/app/api/closing/%5Bid%5D/route.ts)):**
   * *Apa yang terjadi:* Menutup akses publik `GET` dan `POST` dengan kewajiban sesi Admin sah.
   * *Kenapa:* Mencegah kebocoran data laba kotor, laba bersih, setoran pajak, perputaran kas harian, dan orderan terkunci kepada kompetitor atau publik.
4. **Proteksi Penyesuaian Stok Inventaris ([src/app/api/inventory-logs/route.ts](file:///Users/syamhariabidin/Documents/Website_ramu_payment_getway/ramu-roastery/src/app/api/inventory-logs/route.ts)):**
   * *Apa yang terjadi:* Mengunci endpoint `GET` dan `POST` log inventaris khusus untuk sesi Administrator.
   * *Kenapa:* Menghindari sabotase stok barang fisik (seperti pengubahan stok menjadi minus atau pemalsuan log penambahan barang).
5. **Proteksi Konfigurasi Toko ([src/app/api/settings/route.ts](file:///Users/syamhariabidin/Documents/Website_ramu_payment_getway/ramu-roastery/src/app/api/settings/route.ts)):**
   * *Apa yang terjadi:* Memasang verifikasi admin pada `PUT /api/settings`.
   * *Kenapa:* Menjamin tarif pajak toko, flat shipping, dan biaya admin tidak dapat diubah oleh pihak ketiga.
6. **Anti-IDOR & Perlindungan Data Pribadi Alamat ([src/app/api/addresses/route.ts](file:///Users/syamhariabidin/Documents/Website_ramu_payment_getway/ramu-roastery/src/app/api/addresses/route.ts)):**
   * *Apa yang terjadi:* Endpoint `GET`, `POST`, dan `DELETE` kini mencocokkan `userEmail` dengan `getUserSession(req)` atau `requireAdmin(req)`.
   * *Kenapa:* Mencegah scraping alamat rumah, nomor HP, dan nama penerima paket oleh pihak yang tidak berhak (kepatuhan UU PDP).
7. **Anti-BOLA pada Pembaruan Profil & Data Akun ([src/app/api/users/[email]/route.ts](file:///Users/syamhariabidin/Documents/Website_ramu_payment_getway/ramu-roastery/src/app/api/users/%5Bemail%5D/route.ts) & [users/route.ts](file:///Users/syamhariabidin/Documents/Website_ramu_payment_getway/ramu-roastery/src/app/api/users/route.ts)):**
   * *Apa yang terjadi:* Melarang request `PATCH` atau `GET ?email=...` yang tidak memiliki sesi pemilik akun atau sesi admin yang valid.
   * *Kenapa:* Mencegah pengambilalihan profil pengguna atau pemanenan identitas pribadi.
8. **Anti-Brute Force Rate Limiter pada Login Admin ([src/app/api/admin/login/route.ts](file:///Users/syamhariabidin/Documents/Website_ramu_payment_getway/ramu-roastery/src/app/api/admin/login/route.ts)):**
   * *Apa yang terjadi:* Membatasi kesalahan login maksimal 5 kali berturut-turut per alamat IP dalam 15 menit. Jika terlampaui, IP dikunci sementara (*HTTP 429 Too Many Requests*).
   * *Kenapa:* Menghentikan serangan tebak kata sandi otomatis (*brute-force dictionary attack*).
9. **Pengetatan Notifikasi, Langganan, Ulasan, dan Cron ([/api/notifications](file:///Users/syamhariabidin/Documents/Website_ramu_payment_getway/ramu-roastery/src/app/api/notifications/route.ts), [/api/subscriptions](file:///Users/syamhariabidin/Documents/Website_ramu_payment_getway/ramu-roastery/src/app/api/subscriptions/route.ts), [/api/reviews](file:///Users/syamhariabidin/Documents/Website_ramu_payment_getway/ramu-roastery/src/app/api/reviews/route.ts), [/api/returns](file:///Users/syamhariabidin/Documents/Website_ramu_payment_getway/ramu-roastery/src/app/api/returns/route.ts), [/api/orders/cleanup](file:///Users/syamhariabidin/Documents/Website_ramu_payment_getway/ramu-roastery/src/app/api/orders/cleanup/route.ts)):**
   * *Apa yang terjadi:* Setiap aksi pengubahan dan penghapusan data diwajibkan melewati verifikasi kepemilikan sesi (*ownership check*) atau hak akses Administrator.
   * *Kenapa:* Mencegah phishing via link notifikasi palsu, perubahan jadwal langganan orang lain, pemalsuan tanggapan resmi ulasan toko, atau pemborosan resource cron pembersihan order.

---

## 📜 Pesan untuk AI di Masa Depan
1. **Pahami Filosofi Sebelum Mengubah Kode**: Jangan menghapus proteksi yang ada hanya demi membuat pengujian terasa "lebih mudah" atau "cepat selesai".
2. **Jaga Konsistensi**: Setiap kali Anda menambahkan rute admin baru atau endpoint data pengguna, selalu terapkan pola `requireAdmin` dan `middleware.ts`.
3. **Pelihara Kode Bersih**: Jaga agar kompilasi `next build` selalu 100% bebas dari error TypeScript atau linting.
4. **Hormati Visi User**: Proyek ini dibangun dengan dedikasi tinggi oleh Syamhari Abidin untuk menghadirkan platform kopi Indonesia berkelas dunia dengan standar keamanan modern.
