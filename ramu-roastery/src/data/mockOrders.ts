export type OrderStatus = 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Completed' | 'Cancelled';

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
  productId?: string;
  weight?: number | string;
  grind?: string;
  notes?: string;
  isSubscription?: boolean;
}

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  status: OrderStatus;
  date: string;
  total: number;
  items: OrderItem[];
  shippingAddress: string;
  paymentProofUrl?: string;
  courier?: string;
  trackingNumber?: string;
  trackingHistory?: Record<string, unknown>[];
  notes?: string;
  grindNotes?: string;
  referralCode?: string;
  isVip?: boolean;
  isTebeng?: boolean;
  isB2b?: boolean;
  shippingMethod?: string;
  adminFee?: number;
  tax?: number;
  shippingCost?: number;
}

export const mockOrders: Order[] = [
  {
    id: 'ORD-2026-001',
    customerName: 'Budi Santoso',
    customerEmail: 'budi.santoso@example.com',
    customerPhone: '081234567890',
    status: 'Pending',
    date: '2026-08-25T10:30:00Z',
    total: 350000,
    items: [
      { id: 'gayo-natural', name: 'Arabica Gayo Blend', quantity: 2, price: 120000 },
      { id: 'robusta-dampit', name: 'Robusta Dampit', quantity: 1, price: 110000 }
    ],
    shippingAddress: 'Jl. Merdeka No. 10, Jakarta Pusat',
    paymentProofUrl: '/images/payment_receipt.jpg'
  },
  {
    id: 'ORD-2026-002',
    customerName: 'Siti Aminah',
    customerEmail: 'siti.aminah@example.com',
    customerPhone: '081987654321',
    status: 'Processing',
    date: '2026-08-24T09:15:00Z',
    total: 240000,
    items: [
      { id: 'gayo-natural', name: 'Arabica Gayo Blend', quantity: 2, price: 120000 }
    ],
    shippingAddress: 'Jl. Sudirman No. 45, Bandung'
  },
  {
    id: 'ORD-2026-003',
    customerName: 'Ahmad Faisal',
    customerEmail: 'ahmad.faisal@example.com',
    customerPhone: '085712349876',
    status: 'Shipped',
    date: '2026-07-15T14:20:00Z',
    total: 110000,
    items: [
      { id: 'robusta-dampit', name: 'Robusta Dampit', quantity: 1, price: 110000 }
    ],
    shippingAddress: 'Perumahan Indah Blok C2, Surabaya'
  },
  {
    id: 'ORD-2026-004',
    customerName: 'Diana Putri',
    customerEmail: 'diana.putri@example.com',
    customerPhone: '082155567778',
    status: 'Delivered',
    date: '2026-06-10T11:00:00Z',
    total: 480000,
    items: [
      { id: 'gayo-natural', name: 'Arabica Gayo Blend', quantity: 4, price: 120000 }
    ],
    shippingAddress: 'Jl. Pahlawan No. 88, Semarang'
  },
  {
    id: 'ORD-2026-005',
    customerName: 'Eko Prasetyo',
    customerEmail: 'eko.prasetyo@example.com',
    customerPhone: '081399988877',
    status: 'Cancelled',
    date: '2026-01-22T16:45:00Z',
    total: 120000,
    items: [
      { id: 'gayo-natural', name: 'Arabica Gayo Blend', quantity: 1, price: 120000 }
    ],
    shippingAddress: 'Komp. Mawar Indah No. 5, Yogyakarta'
  },
  {
    id: 'ORD-2025-006',
    customerName: 'Rina Wijaya',
    customerEmail: 'rina.wijaya@example.com',
    customerPhone: '081399988899',
    status: 'Delivered',
    date: '2025-11-05T10:00:00Z',
    total: 750000,
    items: [
      { id: 'toraja-anaerobic', name: 'Toraja Anaerobic', quantity: 3, price: 250000 }
    ],
    shippingAddress: 'Jl. Pahlawan No. 1, Semarang'
  },
  {
    id: 'ORD-2025-007',
    customerName: 'Agus Subandi',
    customerEmail: 'agus.subandi@example.com',
    customerPhone: '081399988800',
    status: 'Delivered',
    date: '2025-12-20T14:00:00Z',
    total: 300000,
    items: [
      { id: 'house-blend-espresso', name: 'Commercial Blend', quantity: 2, price: 150000 }
    ],
    shippingAddress: 'Komp. Mawar Indah No. 10, Yogyakarta'
  },
  {
    id: 'ORD-2026-008',
    customerName: 'Citra Kirana',
    customerEmail: 'citra.kirana@example.com',
    customerPhone: '081399988811',
    status: 'Processing',
    date: '2026-08-25T11:00:00Z',
    total: 200000,
    items: [
      { id: 'java-preanger-honey', name: 'Java Preanger Honey', quantity: 1, price: 200000 }
    ],
    shippingAddress: 'Komp. Mawar Indah No. 15, Yogyakarta'
  }
];
