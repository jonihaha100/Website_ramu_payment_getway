export type ReturnStatus = 'Pending' | 'Approved' | 'Rejected' | 'Resolved';
export type ReturnReason = 'Barang Rusak' | 'Produk Tidak Sesuai' | 'Barang Kurang' | 'Kualitas Buruk';

export interface ReturnRequest {
  id: string;
  orderId: string;
  customerName: string;
  reason: ReturnReason;
  description: string;
  proofImageUrl: string;
  dateRequested: string;
  status: ReturnStatus;
  adminNotes?: string;
}

export const mockReturns: ReturnRequest[] = [
  {
    id: "RET-2026-001",
    orderId: "ORD-2026-005",
    customerName: "Eko Prasetyo",
    reason: "Barang Rusak",
    description: "Kemasan kopi robek saat tiba, sehingga sebagian bubuk kopi tumpah keluar kardus.",
    proofImageUrl: "/images/payment_receipt.jpg", // Mocking with existing image for demo
    dateRequested: "2026-01-23T10:00:00Z",
    status: "Pending"
  },
  {
    id: "RET-2026-002",
    orderId: "ORD-2026-002",
    customerName: "Siti Aminah",
    reason: "Produk Tidak Sesuai",
    description: "Saya pesan Gayo Blend bentuk bubuk espresso, tapi yang datang biji utuh (whole beans).",
    proofImageUrl: "https://images.unsplash.com/photo-1524350876685-274059332603?w=500&q=80",
    dateRequested: "2026-08-25T14:30:00Z",
    status: "Approved",
    adminNotes: "Kesalahan dari tim packing. Refund penuh diproses."
  }
];
