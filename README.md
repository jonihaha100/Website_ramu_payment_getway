# Ramu Roastery — Platform Kopi Spesialti & Payment Gateway

Platform e-commerce kopi artisanal, kurasi profil rasa kopi (*Coffee Taste Profiling*), B2B custom sourcing, dan gateway pembayaran multi-metode dengan dukungan multi-bahasa (Indonesia, Inggris, Jepang).

---

## 📖 Dokumentasi Arsitektur & Memori Proyek
Proyek ini dibangun dengan kolaborasi strategis antara User dan Agen AI dengan prinsip:
> *"Kode menunjukkan apa yang terjadi. Dokumentasi menunjukkan kenapa itu terjadi."*

Dokumentasi lengkap mengenai keputusan arsitektur, pengamanan sistem, dan filosofi pengembangan tersimpan di:
* 🧭 [PROJECT_MEMORY.md](PROJECT_MEMORY.md) — Rekam jejak abadi "Apa" dan "Kenapa" di balik setiap keputusan teknis.
* 🤖 [AGENTS.md](AGENTS.md) — Panduan dan batasan wajib bagi agen AI masa depan yang mengelola repositori ini.

---

## 🛠️ Stack Teknologi
* **Framework**: Next.js 14 (App Router) + TypeScript
* **Database & ORM**: PostgreSQL + Prisma ORM
* **Keamanan**: HMAC-SHA256 Signed Tokens, HttpOnly Cookies, Server-Side Edge Middleware, Anti-IDOR, Data Sanitization
* **Styling**: Vanilla CSS Modules (Glassmorphism, Dark/Warm Palette)
* **Keamanan AI**: NVIDIA SkillSpector Scanner