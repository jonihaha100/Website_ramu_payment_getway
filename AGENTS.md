# INTRUKSI UNTUK AGEN AI (AGENTS.MD)

Selamat datang di repositori **Ramu Roastery Payment Gateway & Specialty Coffee Platform**.

Sebelum melakukan analisis, refactoring, atau penulisan kode baru pada proyek ini, **ANDA DIWAJIBKAN MEMBACA DOKUMEN BERIKUT:**
* 👉 [PROJECT_MEMORY.md](file:///Users/syamhariabidin/Documents/Website_ramu_payment_getway/PROJECT_MEMORY.md)

---

## 🎯 Aturan Wajib untuk AI yang Menangani Proyek Ini

### 1. Prinsip Utama
> *"Kode menunjukkan apa yang terjadi. Dokumentasi menunjukkan kenapa itu terjadi."*
> — **Syamhari Abidin (User / Project Architect)**

Pahami alasan dan filosofi di balik setiap baris arsitektur sebelum Anda menyentuhnya.

### 2. Batasan Keamanan Kritis (Security Hardening Guardrails)
- **DILARANG** mengembalikan cookie sesi admin ke `document.cookie` berbasis client-side. Token admin WAJIB tetap `httpOnly: true` dengan tanda tangan `HMAC-SHA256` di [src/lib/auth.ts](file:///Users/syamhariabidin/Documents/Website_ramu_payment_getway/ramu-roastery/src/lib/auth.ts).
- **DILARANG** menonaktifkan atau melewati [src/middleware.ts](file:///Users/syamhariabidin/Documents/Website_ramu_payment_getway/ramu-roastery/src/middleware.ts).
- **DILARANG** memaparkan `passwordHash` pada endpoint `GET /api/users`.
- **DILARANG** menerima input `role` dari payload client pada `POST /api/users` (selalu kunci ke `USER`).
- **DILARANG** membiarkan `GET /api/orders` mengembalikan data tanpa filter/otentikasi admin (Anti-IDOR).
- **DILARANG** mempercayai nilai `discount` atau total harga dari client pada [src/app/api/checkout/route.ts](file:///Users/syamhariabidin/Documents/Website_ramu_payment_getway/ramu-roastery/src/app/api/checkout/route.ts). Harga produk, kupon promo, dan poin loyalitas WAJIB diverifikasi ulang di server.
- **DILARANG** meloloskan notifikasi pembayaran tanpa tanda tangan digital SHA-256 dan verifikasi nominal pada [src/app/api/payment/webhook/route.ts](file:///Users/syamhariabidin/Documents/Website_ramu_payment_getway/ramu-roastery/src/app/api/payment/webhook/route.ts).
- **DILARANG** memaparkan data pribadi pelanggan (nama lengkap, no WA, email, alamat lengkap) pada pelacakan publik tanpa masking di [src/app/api/orders/route.ts](file:///Users/syamhariabidin/Documents/Website_ramu_payment_getway/ramu-roastery/src/app/api/orders/route.ts).
- **DILARANG** menggunakan fallback kunci rahasia statis yang tertulis di kode sumber.
- **DILARANG** mengizinkan pengubahan status pesanan atau nomor resi tanpa verifikasi sesi login sah di `PUT /api/orders`.
- Setiap penambahan rute API admin baru WAJIB menyertakan `await requireAdmin(request)`.

### 3. Standar Kualitas & Kerapian Kode
- Pastikan seluruh rute Next.js dapat dikompilasi bersih (`npx next build` 100% lolos tanpa error typecheck/linting).
- Jaga konsistensi dukungan multi-bahasa (`id`, `en`, `ja`) pada notifikasi dan kamus teks antarmuka.
- Hormati keputusan dan arahan dari User (Syamhari Abidin) sebagai perancang utama visi proyek ini.
