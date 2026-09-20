"use client";

import { useState } from 'react';
import Link from 'next/link';
import styles from './FAQ.module.css';
import { useLang } from '../../context/LanguageContext';

interface FAQItem {
  question: string;
  answer: React.ReactNode;
}

interface FAQCategory {
  title: string;
  items: FAQItem[];
}

const faqDataId: FAQCategory[] = [
  {
    title: "Informasi Website & Akun",
    items: [
      {
        question: "Apa itu Ramu Roastery?",
        answer: "Ramu Roastery adalah perusahaan roastery kopi profesional yang fokus pada penyediaan biji kopi berkualitas tinggi untuk keperluan kedai (B2B) maupun konsumen harian (B2C). Kami melakukan kurasi, sangrai (roasting), dan distribusi langsung dari fasilitas kami."
      },
      {
        question: "Bagaimana cara membuat akun?",
        answer: "Anda dapat membuat akun dengan mengklik tombol 'Login' di sudut kanan atas layar, lalu memilih opsi 'Daftar' atau 'Sign Up'. Anda bisa mendaftar menggunakan email Anda."
      },
      {
        question: "Apakah data saya aman?",
        answer: "Tentu. Kami menjaga privasi dan keamanan data Anda sesuai dengan standar keamanan web modern. Informasi pembayaran dan kata sandi Anda dienkripsi."
      }
    ]
  },
  {
    title: "Fitur Akun & Loyalitas (Poin Ramu)",
    items: [
      {
        question: "Bagaimana cara mendapatkan dan menggunakan Poin Ramu?",
        answer: "Poin Ramu secara otomatis ditambahkan ke akun Anda setiap kali pesanan Anda selesai (berstatus Terkirim/Delivered). Setiap pembelanjaan kelipatan Rp 10.000 akan mendapatkan 1 Poin. Poin ini dapat digunakan langsung sebagai potongan harga (1 Poin = Rp 1) saat Checkout berikutnya."
      },
      {
        question: "Apa fungsi dari Buku Alamat (Daftar Alamat)?",
        answer: "Anda dapat menyimpan lebih dari satu alamat (seperti Rumah, Kantor, atau Kedai) di menu 'Daftar Alamat' pada Dasbor Anda. Saat proses Checkout, Anda cukup memilih alamat yang sudah tersimpan tanpa harus mengetik ulang dari awal."
      },
      {
        question: "Apa itu Coffee Profile?",
        answer: "Coffee Profile adalah pengaturan preferensi rasa kopi pribadi Anda. Dengan mengatur profil ini di Dasbor, sistem kami dapat memberikan rekomendasi biji kopi yang paling sesuai dengan selera Anda."
      }
    ]
  },
  {
    title: "Teknis Pemesanan (Order)",
    items: [
      {
        question: "Bagaimana alur cara memesan kopi?",
        answer: (
          <ol>
            <li>Buka menu <strong>Katalog</strong>.</li>
            <li>Pilih kopi yang Anda inginkan, lalu tentukan <strong>Berat</strong> dan <strong>Profil Gilingan</strong>.</li>
            <li>Klik <strong>Add to Cart</strong> atau <strong>Buy Now</strong>.</li>
            <li>Buka keranjang belanja Anda dan lanjutkan ke <strong>Checkout</strong>, lalu isi data dan alamat pengiriman Anda.</li>
            <li>Setelah Checkout berhasil, Anda akan diarahkan ke halaman <strong>Pesanan Saya</strong> (Dasbor).</li>
            <li><strong>PENTING:</strong> Klik tombol <strong>Bayar Sekarang</strong> pada pesanan Anda untuk menyelesaikan pembayaran agar pesanan dapat segera diproses.</li>
          </ol>
        )
      },
      {
        question: "Apa perbedaan profil gilingan (Kasar, Sedang, Halus)?",
        answer: (
          <ul>
            <li><strong>Biji Utuh (Whole Beans):</strong> Untuk Anda yang memiliki grinder sendiri dan ingin menjaga kesegaran kopi lebih lama.</li>
            <li><strong>Kasar (Coarse):</strong> Cocok untuk metode seduh French Press atau Cold Brew.</li>
            <li><strong>Sedang (Medium):</strong> Paling pas untuk metode manual brew seperti V60, Kalita, atau Aeropress.</li>
            <li><strong>Halus (Fine):</strong> Ditujukan untuk mesin Espresso atau Mokapot.</li>
          </ul>
        )
      },
      {
        question: "Metode pembayaran apa saja yang didukung?",
        answer: "Saat ini kami mendukung pembayaran melalui Transfer Bank (Virtual Account), e-Wallet (GoPay, OVO, Dana), dan QRIS."
      }
    ]
  },
  {
    title: "Jam Operasional Roastery & Jadwal Sangrai Segar",
    items: [
      {
        question: "Kapan jam operasional kerja Ramu Roastery?",
        answer: "Fasilitas sangrai dan tim Customer Service kami beroperasi aktif setiap hari Senin hingga Sabtu pukul 09:00 – 17:00 WIB. Hari Minggu dan hari libur nasional roastery tutup untuk pemeliharaan mesin sangrai."
      },
      {
        question: "Kapan jadwal roasting (sangrai) batch reguler?",
        answer: "Kami melakukan sangrai batch segar setiap hari SENIN dan KAMIS. Hal ini memastikan biji kopi yang dikirimkan selalu berada pada rentang waktu resting optimal (tidak terlalu baru dari mesin sangrai, dan tidak pernah berumur lebih dari 14 hari saat sampai di tangan Anda)."
      },
      {
        question: "Berapa batas waktu (cut-off) untuk pengiriman di hari yang sama?",
        answer: "Batas konfirmasi pembayaran untuk pengiriman pada hari yang sama adalah pukul 15:00 WIB. Pesanan yang terverifikasi setelah pukul 15:00 WIB atau pada hari Minggu akan dikirimkan pada hari kerja berikutnya."
      }
    ]
  },
  {
    title: "Pengiriman & Lacak Pesanan",
    items: [
      {
        question: "Dari mana pesanan kopi dikirim?",
        answer: "Seluruh pesanan dikirimkan langsung dari fasilitas roastery pusat kami di Kota Bandung, Jawa Barat. Kami mendukung kurir reguler (JNE, SiCepat, J&T) serta pengiriman Kargo hemat untuk pesanan besar (minimal 5kg)."
      },
      {
        question: "Bagaimana cara melacak pesanan?",
        answer: (
          <p>
            Anda dapat melihat nomor resi dan status pesanan Anda secara langsung melalui menu <Link href="/dashboard/orders" style={{ color: 'var(--primary-color)', textDecoration: 'underline' }}>Pesanan Saya</Link> di Dasbor Pengguna.
          </p>
        )
      },
      {
        question: "Apa itu opsi 'Tebeng Kirim' saat Checkout?",
        answer: "Opsi Tebeng Kirim memungkinkan Anda menggabungkan pengiriman pesanan ini dengan jadwal batch roasting terdekat (Senin atau Kamis). Sangat cocok jika Anda memesan beberapa varian secara bertahap dan ingin menghemat emisi pengiriman serta memastikan kopi dikirim bersamaan dalam batch segar."
      }
    ]
  },
  {
    title: "Manajemen Langganan (Subscription)",
    items: [
      {
        question: "Bagaimana sistem Langganan Kopi (Subscription) bekerja?",
        answer: "Sistem langganan kopi Ramu Roastery memudahkan Anda mendapatkan pasokan kopi segar otomatis tanpa perlu checkout berulang. Anda dapat memilih siklus pengiriman mingguan, dua mingguan, atau bulanan."
      },
      {
        question: "Bisakah saya menjeda atau melewati jadwal pengiriman langganan?",
        answer: "BISA! Kami menyediakan fitur Self-Service Langganan di Dasbor Pengguna. Anda dapat mengklik tombol '⏸️ Jeda Pengiriman' jika sedang bepergian, '▶️ Lanjutkan' saat siap menerima kopi lagi, atau '⏭️ Lewati Pengiriman Ini' untuk menunda 1 siklus ke batch berikutnya tanpa biaya tambahan."
      },
      {
        question: "Apa saja keuntungan menjadi VIP Subscriber?",
        answer: "Pelanggan langganan aktif otomatis mendapatkan status VIP Member: Bebas Biaya Layanan Aplikasi (Rp 0) di setiap transaksi checkout, subsidi gratis ongkir hingga Rp 50.000, serta akses prioritas batch sangrai terbatas."
      }
    ]
  },
  {
    title: "Kemitraan Kedai & Grosir B2B",
    items: [
      {
        question: "Apakah Ramu Roastery melayani pasokan biji kopi untuk Kedai / Kafe (B2B)?",
        answer: "Ya, kami bermitra dengan puluhan kedai kopi di seluruh Indonesia. Kami menyediakan harga grosir khusus per kg untuk house blend espresso maupun single origin filter dengan standarisasi profil sangrai konsisten."
      },
      {
        question: "Apa itu B2B Starter Box (100% Rebate)?",
        answer: "B2B Starter Box adalah paket sampel kurasi 4 varian kopi (House Blend, Java Preanger, Gayo, Gn. Halu masing-masing 100g) seharga Rp 120.000. Biaya ini 100% kami kembalikan sebagai voucher potongan belanja untuk pesanan grosir pertama Anda minimal 5kg. Zero risk untuk uji coba rasa di mesin kedai Anda!"
      },
      {
        question: "Apakah tersedia pengiriman kargo hemat untuk pesanan grosir?",
        answer: "Tentu! Untuk pesanan 5kg ke atas, sistem kami otomatis menyediakan opsi pengiriman Kargo dengan tarif flat per kg yang jauh lebih ekonomis dibandingkan ongkir ekspedisi reguler."
      }
    ]
  },
  {
    title: "Kebijakan Garansi Kesegaran & Retur",
    items: [
      {
        question: "Apa garansi kualitas dan kesegaran biji kopi Ramu?",
        answer: "Kami menjamin 100% kesegaran biji kopi hasil sangrai batch resmi kami. Jika terjadi cacat sangrai (under-developed/burnt) atau kemasan sobek saat pengiriman, kami akan mengirimkan pengganti baru tanpa biaya tambahan."
      },
      {
        question: "Bagaimana cara mengajukan pengembalian (Return Ticket)?",
        answer: "Pengajuan retur dapat dilakukan langsung via menu Dasbor Pengguna > Retur & Komplain maksimal 2x24 jam setelah status pesanan dinyatakan terkirim. Harap sertakan foto label batch dan video unboxing singkat."
      }
    ]
  }
];

const faqDataEn: FAQCategory[] = [
  {
    title: "Website & Account Information",
    items: [
      {
        question: "What is Ramu Roastery?",
        answer: "Ramu Roastery is a specialty coffee roastery dedicated to providing consistently fresh coffee beans for cafes (B2B) and home brewers (B2C). We roast and ship directly from our Bandung facility."
      },
      {
        question: "How do I create an account?",
        answer: "Click the 'Login' button in the top navigation, then choose 'Sign Up'. You can register with your email address in seconds."
      },
      {
        question: "Is my data secure?",
        answer: "Absolutely. All transactions and personal data are encrypted following modern web standards."
      }
    ]
  },
  {
    title: "Roastery Hours & Fresh Roasting Schedule",
    items: [
      {
        question: "What are Ramu Roastery's operational hours?",
        answer: "Our roastery and Customer Support team operate Monday through Saturday, from 09:00 to 17:00 WIB (UTC+7). The facility is closed on Sundays for roaster maintenance."
      },
      {
        question: "When are the fresh roasting batch days?",
        answer: "We roast fresh production batches every MONDAY and THURSDAY. This guarantees that your beans arrive in their optimal resting window (typically 5–14 days off roast)."
      },
      {
        question: "What is the cut-off time for same-day dispatch?",
        answer: "Payment confirmation cut-off is 15:00 WIB. Orders confirmed after 15:00 WIB are dispatched on the next working day."
      }
    ]
  },
  {
    title: "Account Features & Loyalty (Ramu Points)",
    items: [
      {
        question: "How do I earn and use Ramu Points?",
        answer: "Points are automatically credited when your order is delivered. You earn 1 point per Rp 10,000 spent, and 1 point equals Rp 1 direct deduction on your next checkout."
      },
      {
        question: "What is the Address Book for?",
        answer: "You can save multiple shipping destinations (Home, Office, Cafe) in your Address Book for swift 1-click checkout."
      }
    ]
  },
  {
    title: "Ordering & Grind Profiles",
    items: [
      {
        question: "What grind size should I choose?",
        answer: (
          <ul>
            <li><strong>Whole Bean (Biji Utuh):</strong> Highly recommended! Keeps coffee fresh longer and allows you to grind right before brewing.</li>
            <li><strong>Coarse:</strong> Best for Cold Brew and French Press.</li>
            <li><strong>Medium:</strong> Ideal for V60, Kalita Wave, Aeropress, and automated drip brewers.</li>
            <li><strong>Fine:</strong> Calibrated for home espresso machines, Mokapots, or Ibrik.</li>
          </ul>
        )
      }
    ]
  },
  {
    title: "Subscription Management",
    items: [
      {
        question: "Can I pause, resume, or skip my subscription deliveries?",
        answer: "YES! You have full self-service control. Visit User Dashboard > My Subscriptions to Pause, Resume, or Skip a delivery cycle whenever you are away."
      },
      {
        question: "What are the perks of being a VIP Subscriber?",
        answer: "Active subscribers enjoy Rp 0 Admin Fee on every purchase, up to Rp 50,000 free shipping subsidy, and priority access to limited microlot releases."
      }
    ]
  },
  {
    title: "B2B Wholesale & Cafe Partnership",
    items: [
      {
        question: "Do you supply coffee for cafes and restaurants?",
        answer: "Yes! We provide bulk pricing per kilogram for espresso blends and single origins with standardized roasting profiles."
      },
      {
        question: "What is the B2B Starter Box (100% Rebate)?",
        answer: "Order our 4-variety 100g sample kit for Rp 120,000. When you place your first 5kg wholesale order, we credit back the full Rp 120,000 as a discount voucher."
      },
      {
        question: "Is cargo shipping available for wholesale orders?",
        answer: "Yes, orders of 5kg and above automatically unlock cost-effective regional Cargo rates."
      }
    ]
  }
];

const faqDataJa: FAQCategory[] = [
  {
    title: "ウェブサイトおよびアカウント情報",
    items: [
      {
        question: "ラム・ロースタリー（Ramu Roastery）とはどのようなブランドですか？",
        answer: "ラム・ロースタリーは、カフェや飲食店向けの業務用卸売（B2B）および一般のご家庭向け（B2C）に高品質なスペシャルティコーヒー豆を提供するプロフェッショナルロースタリーです。インドネシア・バンドンの自社焙煎所より、選別・焙煎・パッキングを行い産地直送でお届けしています。"
      },
      {
        question: "アカウントの作成方法は？",
        answer: "画面右上の「ログイン」ボタンをクリックし、「新規登録（Sign Up）」を選択してください。メールアドレスを入力するだけで数秒でアカウントを開設いただけます。"
      },
      {
        question: "個人情報のセキュリティは安全ですか？",
        answer: "はい。お客様のプライバシーと決済情報は最新のWebセキュリティ基準（SSL暗号化）に準拠して厳格に保護されています。"
      }
    ]
  },
  {
    title: "ロースタリー営業時間と焙煎スケジュール",
    items: [
      {
        question: "営業時間とサポート対応時間は？",
        answer: "焙煎施設およびカスタマーサポートは、月曜日から土曜日の 09:00〜17:00 WIB（インドネシア西部時間）まで稼働しております。日曜日は焙煎機の定期メンテナンスのため休業となります。"
      },
      {
        question: "新鮮な焙煎バッチ（Roast Day）はいつですか？",
        answer: "毎週【月曜日】と【木曜日】にフレッシュな焙煎バッチを焼き上げています。これにより、お手元に届いた時点で最も香りが開き最適なエイジング期間（焙煎後5〜14日前後）となるよう管理しています。"
      },
      {
        question: "当日発送の締め切り時間は？",
        answer: "当日発送の決済確認締め切りは 15:00 WIB となっております。15:00 以降のご注文は翌営業日または直近の焙煎バッチ日に発送されます。"
      }
    ]
  },
  {
    title: "ロイヤルティプログラム（ラムポイント）とアドレス帳",
    items: [
      {
        question: "ラムポイントの貯め方と使い方は？",
        answer: "ご注文の配達完了時に自動的にアカウントへ付与されます。お買い物 Rp 10.000 ごとに 1 ポイントが貯まり、次回以降のチェックアウト時に 1 ポイント＝Rp 1（または100ポイント単位で割引）としてご利用いただけます。"
      },
      {
        question: "アドレス帳（保存されたお届け先）の利点は何ですか？",
        answer: "ご自宅、オフィス、店舗など複数の配送先住所をマイページのアドレス帳に登録しておくことで、次回から1クリックで選択できるようになります。"
      }
    ]
  },
  {
    title: "ご注文方法と挽き目の目安",
    items: [
      {
        question: "どの挽き目（グラインド）を選べばよいですか？",
        answer: (
          <ul>
            <li><strong>豆のまま（Whole Beans）:</strong> 最もおすすめ！風味とアロマを最も長く保ち、抽出直前に挽くことで最高の味わいを楽しめます。</li>
            <li><strong>粗挽き（Coarse）:</strong> コールドブリュー（水出し）やフレンチプレスに最適です。</li>
            <li><strong>中挽き（Medium）:</strong> V60、カリタウェーブ、エアロプレス、一般的なペーパードリップにぴったりです。</li>
            <li><strong>極細挽き（Fine）:</strong> エスプレッソマシン、直火式モカポット（マキネッタ）用です。</li>
          </ul>
        )
      },
      {
        question: "日本など海外への国際配送は可能ですか？",
        answer: "はい！日本を含む世界各国への国際配送および輸出オーダーを承っております。海外発送の送料・日数のお見積もりは、チェックアウト画面の「WhatsAppでお問い合わせ」よりお気軽にご連絡ください。"
      }
    ]
  },
  {
    title: "定期便（サブスクリプション）管理",
    items: [
      {
        question: "定期便のスキップや一時停止はできますか？",
        answer: "はい、マイページ（ダッシュボード）よりいつでもご自身で「一時停止」「再開」「次回配送のスキップ」をお手続きいただけます。追加料金は一切かかりません。"
      },
      {
        question: "VIP会員の特典は何ですか？",
        answer: "定期便をご契約中のお客様は自動的にVIPステータスとなり、すべての注文で決済手数料無料（Rp 0）、送料無料クーポン補助、限定マイクロロット豆の優先先行予約をご利用いただけます。"
      }
    ]
  },
  {
    title: "カフェ・業務用卸売パートナーシップ（B2B）",
    items: [
      {
        question: "カフェやレストラン向けの業務用卸売は行っていますか？",
        answer: "はい、インドネシア国内外の多数のカフェ・飲食店様と提携しております。安定した焙煎プロファイルを維持したハウスブレンドやシングルオリジンを、業務用卸売価格（kg単位）でご提供します。"
      },
      {
        question: "B2Bスターターボックス（100%キャッシュバック）とは？",
        answer: "4種類の人気銘柄（各100g）のテイスティングセットを Rp 120.000 にてご提供。初回 5kg 以上の業務用発注時に、この代金が全額割引クーポンとして還元される実質無料のお試し制度です。"
      }
    ]
  },
  {
    title: "品質鮮度保証と返品ポリシー",
    items: [
      {
        question: "品質保証について教えてください",
        answer: "当店は100%新鮮な焙煎豆の品質をお約束します。万が一、配送中の破損や焙煎上の不具合があった場合は、無償で再送または交換対応をいたします。配達完了後2日以内にマイページよりお申し出ください。"
      }
    ]
  }
];

function AccordionItem({ item }: { item: FAQItem }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={styles.accordionItem}>
      <button 
        className={styles.accordionHeader} 
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        {item.question}
        <svg 
          className={`${styles.icon} ${isOpen ? styles.iconOpen : ''}`} 
          width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
      {isOpen && (
        <div className={styles.accordionContent}>
          {item.answer}
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
  const { lang } = useLang();
  
  const faqData = lang === 'ja' ? faqDataJa : (lang === 'en' ? faqDataEn : faqDataId);
  const pageTitle = lang === 'ja'
    ? "よくあるご質問（FAQ）"
    : (lang === 'en' ? "Help Center (FAQ)" : "Pusat Bantuan (FAQ)");
  const pageSubtitle = lang === 'ja'
    ? "ご注文方法、配送日程、焙煎スケジュール、およびラム・ロースタリーの各種ポリシーについてのご案内です。"
    : (lang === 'en' 
      ? "Find answers to questions about ordering, shipping details, and Ramu Roastery policies." 
      : "Temukan jawaban atas pertanyaan seputar cara pemesanan, teknis pengiriman, dan kebijakan Ramu Roastery.");
  const supportTitle = lang === 'ja'
    ? "ご不明な点はございますか？"
    : (lang === 'en' ? "Still Need Help?" : "Masih Butuh Bantuan?");
  const supportText = lang === 'ja'
    ? "専任のサポートチームがおすすめの豆のご相談やご注文のサポートを承っております。"
    : (lang === 'en' 
      ? "Our support team is ready to help you resolve technical issues or provide the best coffee recommendations." 
      : "Tim support kami siap membantu Anda menyelesaikan kendala teknis maupun memberikan rekomendasi kopi terbaik.");
  const waText = lang === 'ja'
    ? "WhatsAppで問い合わせる"
    : (lang === 'en' ? "Contact via WhatsApp" : "Hubungi via WhatsApp");

  return (
    <main className={styles.faqPage}>
      <div className="container" style={{ maxWidth: '800px' }}>
        <h1 className={styles.title}>{pageTitle}</h1>
        <p className={styles.subtitle}>{pageSubtitle}</p>

        {faqData.map((category, index) => (
          <div key={index} className={styles.categoryGroup}>
            <h2 className={styles.categoryTitle}>{category.title}</h2>
            {category.items.map((item, idx) => (
              <AccordionItem key={idx} item={item} />
            ))}
          </div>
        ))}

        <div style={{ 
          textAlign: 'center', 
          marginTop: '4rem', 
          padding: '3rem 2rem', 
          background: 'linear-gradient(135deg, var(--accent-color) 0%, var(--accent-hover) 100%)', 
          borderRadius: 'var(--radius-lg)', 
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
        }}>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#ffffff', fontWeight: 'bold' }}>{supportTitle}</h3>
          <p style={{ color: '#f3f4f6', marginBottom: '2rem', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto 2rem auto', lineHeight: '1.6' }}>{supportText}</p>
          <a href="https://wa.me/6280000000000" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', backgroundColor: '#ffffff', color: 'var(--accent-color)', fontWeight: 'bold', padding: '0.75rem 2rem', borderRadius: '9999px', textDecoration: 'none', transition: 'all 0.2s ease', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
            {waText}
          </a>
        </div>
      </div>
    </main>
  );
}
