export interface Coffee {
  id: string;
  name: string;
  category: "Espresso" | "Filter";
  process: "Wash" | "Natural" | "Honey" | "Anaerobic";
  origin: string;
  tastingNotes: string[];
  description: string;
  pricePerKg: number;
  stock: number;
  imageUrl?: string;
  sizes?: number[];
  prices?: Record<number, number>;
  b2bPricePerKg?: number;
}

export const coffees: Coffee[] = [
  {
    "id": "fullwash-gn-halu",
    "name": "Fullwash Gn. Halu",
    "category": "Filter",
    "process": "Wash",
    "origin": "Gunung Halu, Jawa Barat",
    "tastingNotes": [
      "Sugar Cane",
      "Green Apple",
      "Herbs"
    ],
    "description": "Biji kopi single origin dengan karakter rasa yang clean dan cerah. Sentuhan manis tebu alami berpadu harmonis dengan kesegaran apel hijau dan aroma herbal yang menyegarkan.",
    "pricePerKg": 528000,
    "stock": 50000,
    "imageUrl": "/images/java_preanger.jpg",
    "sizes": [
      150,
      250
    ],
    "prices": {
      "150": 94000,
      "250": 132000
    }
  },
  {
    "id": "honey-gn-halu",
    "name": "Honey Gn. Halu",
    "category": "Filter",
    "process": "Honey",
    "origin": "Gunung Halu, Jawa Barat",
    "tastingNotes": [
      "Brown Sugar",
      "Guava",
      "Hint Of Lime"
    ],
    "description": "Proses olah honey menghasilkan rasa manis brown sugar yang legit dan kental, berpadu dengan keunikan buah jambu biji manis serta aksen jeruk nipis segar di akhir sesapan.",
    "pricePerKg": 616000,
    "stock": 45000,
    "imageUrl": "/images/gayo_natural.jpg",
    "sizes": [
      150,
      250
    ],
    "prices": {
      "150": 110000,
      "250": 154000
    }
  },
  {
    "id": "natural-gn-halu",
    "name": "Natural Gn. Halu",
    "category": "Filter",
    "process": "Natural",
    "origin": "Gunung Halu, Jawa Barat",
    "tastingNotes": [
      "Pear",
      "Sugar Cane",
      "Cinnamon"
    ],
    "description": "Karakter buah pir matang yang manis dan berair (juicy), diperkaya dengan kehangatan aroma kayu manis dan kemanisan tebu yang melekat panjang.",
    "pricePerKg": 660000,
    "stock": 35000,
    "imageUrl": "/images/bali_kintamani.jpg",
    "sizes": [
      150,
      250
    ],
    "prices": {
      "150": 132000,
      "250": 165000
    }
  },
  {
    "id": "natural-palasari",
    "name": "Natural Palasari",
    "category": "Filter",
    "process": "Natural",
    "origin": "Palasari, Jawa Barat",
    "tastingNotes": [
      "Brown Sugar",
      "Lime",
      "Spice"
    ],
    "description": "Biji kopi eksotis dari Palasari dengan pemrosesan natural yang rapi. Manis gula merah kental dipadukan dengan keasaman segar jeruk nipis dan sentuhan rempah aromatik.",
    "pricePerKg": 616000,
    "stock": 40000,
    "imageUrl": "/images/toraja_sapan.jpg",
    "sizes": [
      150,
      250
    ],
    "prices": {
      "150": 116000,
      "250": 154000
    }
  },
  {
    "id": "natural-kareumbi",
    "name": "Natural Kareumbi",
    "category": "Filter",
    "process": "Natural",
    "origin": "Gunung Kareumbi, Jawa Barat",
    "tastingNotes": [
      "Brown Sugar",
      "Longan"
    ],
    "description": "Ciri khas buah kelengkeng (longan) yang manis lembut dan floral, dibalut aroma karamel brown sugar yang bulat dan menenangkan di lidah.",
    "pricePerKg": 616000,
    "stock": 40000,
    "imageUrl": "/images/gayo_natural.jpg",
    "sizes": [
      150,
      250
    ],
    "prices": {
      "150": 116000,
      "250": 154000
    }
  },
  {
    "id": "fullwash-kareumbi",
    "name": "Fullwash Kareumbi",
    "category": "Filter",
    "process": "Wash",
    "origin": "Gunung Kareumbi, Jawa Barat",
    "tastingNotes": [
      "Sugar Cane",
      "Sweet Lime",
      "Tea Like"
    ],
    "description": "Sensasi seduhan jernih dan ringan menyerupai teh herbal premium. Menghadirkan rasa manis tebu murni dan kesegaran jeruk nipis manis yang sangat menawan.",
    "pricePerKg": 528000,
    "stock": 50000,
    "imageUrl": "/images/java_preanger.jpg",
    "sizes": [
      150,
      250
    ],
    "prices": {
      "150": 94000,
      "250": 132000
    }
  },
  {
    "id": "fullwash-palasari",
    "name": "Fullwash Palasari",
    "category": "Filter",
    "process": "Wash",
    "origin": "Palasari, Jawa Barat",
    "tastingNotes": [
      "Brown Sugar",
      "Floral",
      "Choco"
    ],
    "description": "Kombinasi klasik aroma floral melati yang wangi semerbak, diiringi manis brown sugar dan kelembutan rasa cokelat susu pada ujung sesapan.",
    "pricePerKg": 528000,
    "stock": 50000,
    "imageUrl": "/images/hero_bg.jpg",
    "sizes": [
      150,
      250
    ],
    "prices": {
      "150": 94000,
      "250": 132000
    }
  },
  {
    "id": "arabica-fullwash-halu",
    "name": "Arabica Fullwash Halu",
    "category": "Espresso",
    "process": "Wash",
    "origin": "Gunung Halu, Jawa Barat",
    "tastingNotes": [
      "Chocolate",
      "Brown Sugar",
      "Clean"
    ],
    "description": "Single origin espresso roast yang sangat bersih dengan tingkat kemanisan karamel tinggi. Sangat nikmat untuk espresso murni, americano, maupun filter roast pencinta body tebal.",
    "pricePerKg": 352000,
    "stock": 75000,
    "imageUrl": "/images/signature_blend.jpg",
    "sizes": [
      250,
      500,
      1000
    ],
    "prices": {
      "250": 132000,
      "500": 198000,
      "1000": 352000
    }
  },
  {
    "id": "selaras-blend",
    "name": "Selaras Blend (70 A : 30 R)",
    "category": "Espresso",
    "process": "Wash",
    "origin": "Jawa Barat & Sumatera",
    "tastingNotes": [
      "Nutty",
      "Dark Choco",
      "Caramel"
    ],
    "description": "Racikan andalan 70% Arabika dan 30% Robusta pilihan. Karakter cokelat pekat, gurih kacang sangrai, dan manis karamel yang membelah susu dengan sempurna.",
    "pricePerKg": 286000,
    "stock": 100000,
    "imageUrl": "/images/signature_blend.jpg",
    "sizes": [
      250,
      500,
      1000
    ],
    "prices": {
      "250": 110000,
      "500": 165000,
      "1000": 286000
    }
  },
  {
    "id": "harmony-blend",
    "name": "Harmony Blend (50 A : 50 R)",
    "category": "Espresso",
    "process": "Natural",
    "origin": "Jawa Barat & Jawa Tengah",
    "tastingNotes": [
      "Bold",
      "Dark Chocolate",
      "Toasted Nut"
    ],
    "description": "Keseimbangan sejati antara keharuman 50% Arabika dan ketebalan 50% Robusta. Crema tebal, aroma sangrai kuat, pilihan paling ekonomis dan mantap untuk kedai kopi susu kekinian.",
    "pricePerKg": 264000,
    "stock": 90000,
    "imageUrl": "/images/lampung_robusta.jpg",
    "sizes": [
      250,
      500,
      1000
    ],
    "prices": {
      "250": 105000,
      "500": 154000,
      "1000": 264000
    }
  },
  {
    "id": "bumi-blend",
    "name": "Bumi Blend (30 A : 70 R)",
    "category": "Espresso",
    "process": "Natural",
    "origin": "Jawa Barat & Sumatera",
    "tastingNotes": [
      "Earthy",
      "Strong Body",
      "Cocoa"
    ],
    "description": "Racikan 30% Arabika dan 70% Robusta untuk karakter ekstra bold dan kafein mantap. Rasa kakao pekat dan aroma rempah earthy yang tetap dominan meski dicampur susu dan krimer kental.",
    "pricePerKg": 220000,
    "stock": 80000,
    "imageUrl": "/images/lampung_robusta.jpg",
    "sizes": [
      250,
      500,
      1000
    ],
    "prices": {
      "250": 94000,
      "500": 132000,
      "1000": 220000
    }
  },
  {
    "id": "full-robusta",
    "name": "Full Robusta",
    "category": "Espresso",
    "process": "Natural",
    "origin": "Jawa Barat",
    "tastingNotes": [
      "Bold",
      "Cacao Nibs",
      "Smoky"
    ],
    "description": "100% Biji kopi Robusta petik merah kualitas pilihan. Menghasilkan body yang sangat tebal, crema melimpah, dan rasa pahit cokelat bersih tanpa aftertaste sepat.",
    "pricePerKg": 198000,
    "stock": 120000,
    "imageUrl": "/images/lampung_robusta.jpg",
    "sizes": [
      250,
      500,
      1000
    ],
    "prices": {
      "250": 83000,
      "500": 121000,
      "1000": 198000
    }
  },
  {
    "id": "arabica-natural-halu",
    "name": "Arabica Natural Halu",
    "category": "Espresso",
    "process": "Natural",
    "origin": "Gunung Halu, Jawa Barat",
    "tastingNotes": [
      "Sweet Berries",
      "Brown Sugar",
      "Winey"
    ],
    "description": "Espresso roast khusus untuk biji kopi Natural Gunung Halu. Menyajikan sensasi kopi susu dengan sentuhan buah berry manis mirip strawberry cheesecake.",
    "pricePerKg": 473000,
    "stock": 45000,
    "imageUrl": "/images/bali_kintamani.jpg",
    "sizes": [
      250,
      500,
      1000
    ],
    "prices": {
      "250": 165000,
      "500": 259000,
      "1000": 473000
    }
  },
  {
    "id": "arabica-honey-halu",
    "name": "Arabica Honey Halu",
    "category": "Espresso",
    "process": "Honey",
    "origin": "Gunung Halu, Jawa Barat",
    "tastingNotes": [
      "Honey",
      "Citrus",
      "Vanilla"
    ],
    "description": "Biji kopi Honey Gunung Halu yang disangrai untuk profil espresso. Rasa manis madu alami yang kental, aroma vanila harum, serta keasaman citrus lembut seimbang.",
    "pricePerKg": 462000,
    "stock": 45000,
    "imageUrl": "/images/gayo_natural.jpg",
    "sizes": [
      250,
      500,
      1000
    ],
    "prices": {
      "250": 154000,
      "500": 253000,
      "1000": 462000
    }
  },
  {
    "id": "arabica-palasari",
    "name": "Arabica Palasari",
    "category": "Espresso",
    "process": "Wash",
    "origin": "Palasari, Jawa Barat",
    "tastingNotes": [
      "Caramel",
      "Milk Chocolate",
      "Floral"
    ],
    "description": "Arabika Palasari yang diracik untuk kebutuhan espresso bar. Keseimbangan rasa klasik karamel manis, cokelat susu lembut, dan aroma bunga yang harum di setiap cangkir.",
    "pricePerKg": 352000,
    "stock": 50000,
    "imageUrl": "/images/toraja_sapan.jpg",
    "sizes": [
      250,
      500,
      1000
    ],
    "prices": {
      "250": 132000,
      "500": 198000,
      "1000": 352000
    }
  }
];

export const coffeeTranslationsJa: Record<string, {
  name?: string;
  origin?: string;
  tastingNotes?: string[];
  description: string;
}> = {
  "fullwash-gn-halu": {
    origin: "西ジャワ州 ハル山",
    tastingNotes: ["サトウキビ", "青リンゴ", "ハーブ"],
    description: "クリーンで明るい風味が際立つシングルオリジン。サトウキビの自然な甘みと、青リンゴの瑞々しい爽やかさ、清涼感のあるハーブのアロマが調和した一杯です。"
  },
  "honey-gn-halu": {
    origin: "西ジャワ州 ハル山",
    tastingNotes: ["黒糖", "グアバ", "ライムのニュアンス"],
    description: "ハニープロセス特有の濃厚でとろけるような黒糖の甘み。甘酸っぱいグアバの果実味に、後味をすっきりと引き締めるフレッシュライムのアクセント。"
  },
  "natural-gn-halu": {
    origin: "西ジャワ州 ハル山",
    tastingNotes: ["洋梨", "サトウキビ", "シナモン"],
    description: "完熟した洋梨のようなジューシーで甘やかな口当たり。シナモンを思わせる心地よいスパイス感と、長く続くサトウキビの余韻をお楽しみいただけます。"
  },
  "natural-palasari": {
    origin: "西ジャワ州 パラサリ",
    tastingNotes: ["黒糖", "ライム", "アロマスパイス"],
    description: "パラサリ農園の厳選ナチュラルロット。芳醇な黒糖のコクに、キレのあるライムの酸味とエキゾチックなスパイス香が絶妙に溶け合います。"
  },
  "natural-kareumbi": {
    origin: "西ジャワ州 カレウンビ山",
    tastingNotes: ["黒糖", "リュウガン (竜眼)"],
    description: "リュウガン果実のような上品で華やかな甘み。丸みのあるキャラメル・黒糖のアロマが口いっぱいに広がり、安らぎのひとときをもたらします。"
  },
  "fullwash-kareumbi": {
    origin: "西ジャワ州 カレウンビ山",
    tastingNotes: ["サトウキビ", "スイートライム", "ティーライク"],
    description: "高級ハーブティーのように澄み渡る軽やかなマウスフィール。澄んだサトウキビのピュアな甘さと、甘酸っぱいスイートライムの瑞々しさが魅力。"
  },
  "fullwash-palasari": {
    origin: "西ジャワ州 パラサリ",
    tastingNotes: ["黒糖", "フローラル", "ミルクチョコ"],
    description: "ジャスミンのような優美な花の香りに、黒糖の深みと滑らかなミルクチョコレートの甘みが重なり合う、クラシックで優雅なブレンド。"
  },
  "arabica-fullwash-halu": {
    origin: "西ジャワ州 ハル山",
    tastingNotes: ["チョコレート", "黒糖", "クリーンカップ"],
    description: "エスプレッソ用に深みを持たせたシングルオリジン。キャラメルのような豊かな甘さとクリーンな後味で、ストレートはもちろんアメリカーノにも最適です。"
  },
  "selaras-blend": {
    origin: "西ジャワ＆スマトラ",
    tastingNotes: ["ナッツ", "ダークチョコ", "キャラメル"],
    description: "アラビカ70%・ロブスタ30%の看板ブレンド。濃厚なダークチョコと香ばしいローストナッツ、キャラメルの甘みがミルクのコクに負けず引き立ちます。"
  },
  "harmony-blend": {
    origin: "西ジャワ＆中部ジャワ",
    tastingNotes: ["ボールド", "ダークチョコレート", "トーストナッツ"],
    description: "アラビカの華やかさとロブスタの力強いコクが1:1で調和。厚みのあるクレマと芳醇なロースト香で、アイスラテやミルクビバレッジに絶大な人気を誇ります。"
  },
  "bumi-blend": {
    origin: "西ジャワ＆スマトラ",
    tastingNotes: ["アーシー", "ストロングボディ", "カカオ"],
    description: "アラビカ30%・ロブスタ70%による濃厚でストロングなブレンド。深煎りカカオと大地の力強さを感じるアロマが、コンデンスミルクとも抜群の相性。"
  },
  "full-robusta": {
    origin: "西ジャワ",
    tastingNotes: ["ボールド", "カカオニブ", "スモーキー"],
    description: "完熟赤実のみをハンドピックした100%ファインロブスタ。圧倒的な厚みのクレマと、渋みのない澄んだダークチョコのビター感が特徴です。"
  },
  "arabica-natural-halu": {
    origin: "西ジャワ州 ハル山",
    tastingNotes: ["ベリー", "黒糖", "ワイニー"],
    description: "ハル山ナチュラルのエスプレッソプロファイル。ストロベリーチーズケーキを思わせる芳醇なベリー感とワイニーなアロマがカフェラテを極上に仕立てます。"
  },
  "arabica-honey-halu": {
    origin: "西ジャワ州 ハル山",
    tastingNotes: ["ハチミツ", "シトラス", "バニラ"],
    description: "ハニープロセスの甘みを凝縮したエスプレッソ焙煎。天然ハチミツのとろける甘さとバニラの優雅な香り、穏やかなシトラスの酸味が一体となります。"
  },
  "arabica-palasari": {
    origin: "西ジャワ州 パラサリ",
    tastingNotes: ["キャラメル", "ミルクチョコ", "フローラル"],
    description: "カフェバーで使いやすい万能アラビカ。リッチなキャラメルとミルクチョコレート、上品な花の香りが溶け合い、毎日の抽出を心地よく彩ります。"
  }
};

export function getLocalizedCoffee(coffee: Coffee, lang: string): Coffee {
  if (lang === 'ja') {
    const trJa = coffeeTranslationsJa[coffee.id];
    if (trJa) {
      return {
        ...coffee,
        origin: trJa.origin || coffee.origin,
        description: trJa.description || coffee.description,
        tastingNotes: trJa.tastingNotes || coffee.tastingNotes,
      };
    }
  }
  return coffee;
}

