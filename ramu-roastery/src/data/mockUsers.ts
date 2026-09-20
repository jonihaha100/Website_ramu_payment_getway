export type UserRole = 'Admin' | 'Customer';
export type UserStatus = 'Active' | 'Inactive';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  joinedDate: string;
  phone?: string;
  loginMethod: 'Google' | 'Email';
  password?: string;
  address?: string;
  city?: string;
  companyName?: string;
  totalOrders?: number;
  coffeePreferences?: {
    roastLevel?: string;
    flavorProfile?: string[];
    brewingMethod?: string[];
  };
}

export const mockUsers: User[] = [
  {
    id: "USR-001",
    name: "Admin Utama",
    email: "admin@ramuroastery.com",
    role: "Admin",
    status: "Active",
    joinedDate: "2024-01-15T08:00:00Z",
    phone: "081234567890",
    loginMethod: "Email",
    password: "hashed_admin_pass", // Mock password
    address: "Jl. Sudirman No. 1",
    city: "Jakarta",
    totalOrders: 0
  },
  {
    id: "USR-002",
    name: "Budi Santoso",
    email: "budi.s@example.com",
    role: "Customer",
    status: "Active",
    joinedDate: "2025-05-12T10:30:00Z",
    phone: "085678901234",
    loginMethod: "Google",
    address: "Jl. Mawar 45, Kebayoran",
    city: "Jakarta Selatan",
    totalOrders: 12,
    coffeePreferences: {
      roastLevel: "Medium-Light",
      flavorProfile: ["Fruity", "Floral", "Sweet Berry"],
      brewingMethod: ["V60", "Aeropress"]
    }
  },
  {
    id: "USR-003",
    name: "Siti Rahmawati",
    email: "siti.rahma@example.com",
    role: "Customer",
    status: "Active",
    joinedDate: "2025-08-01T14:45:00Z",
    phone: "081122334455",
    loginMethod: "Email",
    password: "password_siti_123", // Mock password
    address: "Perumahan Indah Blok B/12",
    city: "Bandung",
    totalOrders: 3,
    coffeePreferences: {
      roastLevel: "Medium",
      flavorProfile: ["Chocolatey", "Nutty", "Caramel"],
      brewingMethod: ["Espresso", "French Press"]
    }
  },
  {
    id: "USR-004",
    name: "Kopi Senja Cafe",
    email: "purchasing@kopisenja.com",
    role: "Customer",
    status: "Active",
    joinedDate: "2026-02-20T09:15:00Z",
    phone: "087766554433",
    loginMethod: "Google",
    companyName: "Kopi Senja Cafe",
    address: "Jl. Braga No. 99",
    city: "Bandung",
    totalOrders: 45,
    coffeePreferences: {
      roastLevel: "Medium-Dark",
      flavorProfile: ["Bold", "Earthy", "Spicy"],
      brewingMethod: ["Espresso Machine", "Cold Brew"]
    }
  },
  {
    id: "USR-005",
    name: "Andi Wijaya",
    email: "andi.w@example.com",
    role: "Customer",
    status: "Inactive",
    joinedDate: "2024-11-10T16:20:00Z",
    loginMethod: "Email",
    password: "andi_rahasia_99", // Mock password
    address: "Jl. Merdeka 10",
    city: "Surabaya",
    totalOrders: 1
  }
];
