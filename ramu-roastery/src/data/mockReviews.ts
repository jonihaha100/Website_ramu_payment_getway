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
    id: "REV-001",
    orderId: "ORD-2026-004",
    productId: "gayo-natural",
    productName: "Gayo Natural",
    customerName: "Diana Putri",
    rating: 5,
    comment: "Kopinya enak banget, aromanya fruity pas diseduh pakai V60. Pengiriman juga super cepat!",
    date: "2026-06-12T14:30:00Z",
    status: "Published",
    variant: "Membeli: 200g - Biji Utuh",
    photos: ["https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80&w=200"],
  },
  {
    id: "REV-002",
    orderId: "ORD-2026-003",
    productId: "robusta-dampit",
    productName: "Robusta Dampit",
    customerName: "Ahmad Faisal",
    rating: 4,
    comment: "Rasa kopinya mantap dan bold, cocok untuk bikin es kopi susu kekinian. Sayang packaging agak penyok sedikit saat tiba.",
    date: "2026-07-16T09:15:00Z",
    status: "Published",
    reply: "Halo Kak Ahmad, mohon maaf atas kendala packaging penyok. Kami akan tingkatkan keamanan packing dengan bubble wrap lebih tebal ke depannya. Terima kasih atas ulasannya!",
    variant: "Membeli: 500g - Giling Kasar",
  },
  {
    id: "REV-003",
    orderId: "ORD-2025-006",
    productId: "toraja-anaerobic",
    productName: "Toraja Anaerobic",
    customerName: "Rina Wijaya",
    rating: 2,
    comment: "Kopinya terlalu asam untuk lambung saya, padahal sudah saya seduh sesuai panduan.",
    date: "2025-11-06T11:00:00Z",
    status: "Published",
    variant: "Membeli: 200g - Giling Sedang",
    photos: ["https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=200"]
  }
];
