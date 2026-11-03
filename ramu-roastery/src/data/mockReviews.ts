export type ReviewStatus = 'Published' | 'Hidden';

export interface Review {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  customerName: string;
  rating: number; // 1 to 5
  comment: string;
  date: string;
  status: ReviewStatus;
  reply?: string;
  photos?: string[];
  videos?: string[];
  variant?: string;
}

export const mockReviews: Review[] = [
  {
    id: "REV-1788358034014",
    orderId: "RAMU-38726",
    productId: "house-blend-espresso",
    productName: "House Blend Espresso",
    customerName: "Siti Rahma",
    rating: 5,
    comment: "Kualitas biji sangat konsisten. Aroma sangrai segar tercium kuat saat kemasan dibuka. Crema tebal dan karakter cokelat karamelnya sangat seimbang untuk seduhan harian.",
    date: "2026-09-02T14:07:14.014Z",
    status: "Published",
    variant: "200g • Biji Utuh",
    photos: ["https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400"],
    reply: "Terima kasih banyak atas ulasannya, Kak Siti! Senang sekali House Blend kami cocok menemani rutinitas seduh Anda. Salam hangat dari roastery kami."
  },
  {
    id: "REV-001",
    orderId: "ORD-2026-004",
    productId: "gayo-natural",
    productName: "Gayo Natural",
    customerName: "Diana Putri",
    rating: 5,
    comment: "Kopinya enak banget, notes fruity buah persik dan madunya keluar jelas pas diseduh pakai V60. Pengiriman cepat dan roast date tertera jelas di kemasan.",
    date: "2026-06-12T14:30:00Z",
    status: "Published",
    variant: "200g • Biji Utuh",
    photos: ["https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80&w=400"],
    reply: "Terima kasih atas ulasan hangatnya, Kak Diana! Gayo Natural memang salah satu lot favorit dengan proses penjemuran alami yang teliti. Selamat menyeduh!"
  },
  {
    id: "REV-002",
    orderId: "ORD-2026-003",
    productId: "robusta-dampit",
    productName: "Robusta Dampit",
    customerName: "Ahmad Faisal",
    rating: 5,
    comment: "Rasa kopinya mantap dan bold, body tebal dengan bitterness yang bersih tanpa aftertaste kasar. Sangat cocok untuk bahan es kopi susu kekinian.",
    date: "2026-07-16T09:15:00Z",
    status: "Published",
    variant: "500g • Giling Kasar",
    photos: ["https://images.unsplash.com/photo-1511920170033-f8396924c348?w=400"],
    reply: "Terima kasih banyak atas ulasan dan apresiasinya, Kak Ahmad! Kami senang Robusta Dampit memberikan ekstraksi body yang solid untuk resep kopi susu Anda."
  },
  {
    id: "REV-003",
    orderId: "ORD-2025-006",
    productId: "toraja-anaerobic",
    productName: "Toraja Anaerobic",
    customerName: "Rina Wijaya",
    rating: 4,
    comment: "Karakter rasa unik dan kompleks, acidity cerah khas fermentasi anaerobik. Perlu sedikit penyesuaian rasio seduh agar manisnya maksimal.",
    date: "2025-11-06T11:00:00Z",
    status: "Published",
    variant: "200g • Giling Sedang",
    photos: ["https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=200"]
  }
];
