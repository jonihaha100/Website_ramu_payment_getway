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

---

## 📜 Pesan untuk AI di Masa Depan
1. **Pahami Filosofi Sebelum Mengubah Kode**: Jangan menghapus proteksi yang ada hanya demi membuat pengujian terasa "lebih mudah" atau "cepat selesai".
2. **Jaga Konsistensi**: Setiap kali Anda menambahkan rute admin baru atau endpoint data pengguna, selalu terapkan pola `requireAdmin` dan `middleware.ts`.
3. **Pelihara Kode Bersih**: Jaga agar kompilasi `next build` selalu 100% bebas dari error TypeScript atau linting.
4. **Hormati Visi User**: Proyek ini dibangun dengan dedikasi tinggi oleh Syamhari Abidin untuk menghadirkan platform kopi Indonesia berkelas dunia dengan standar keamanan modern.
