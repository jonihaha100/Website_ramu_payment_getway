export interface Coffee {
  id: string;
  name: string;
  category: "Espresso" | "Filter";
  process: "Wash" | "Natural" | "Honey" | "Anaerobic";
  origin: string;
  tastingNotes: string[];
  description: string;
  pricePerKg: number;
}

export const coffees: Coffee[] = [
  {
    id: "house-blend-espresso",
    name: "House Blend Espresso",
    category: "Espresso",
    process: "Wash",
    origin: "Sumatra & Java",
    tastingNotes: ["Chocolatey", "Nutty", "Caramel"],
    description: "Our signature blend designed for the perfect daily cup. Rich crema, balanced body, and sweet finish. Ideal for milk-based beverages.",
    pricePerKg: 180000,
  },
  {
    id: "gayo-natural",
    name: "Gayo Natural",
    category: "Filter",
    process: "Natural",
    origin: "Sumatra",
    tastingNotes: ["Fruity", "Winey", "Sweet Berry"],
    description: "A heavy-bodied Sumatran with a wild, fruity profile. Perfect for slow manual brewing methods.",
    pricePerKg: 220000,
  },
  {
    id: "java-preanger-honey",
    name: "Java Preanger Honey",
    category: "Filter",
    process: "Honey",
    origin: "Jawa",
    tastingNotes: ["Floral", "Honey", "Citrus"],
    description: "Bright and sweet with a tea-like body. Grown in the classic estates of West Java.",
    pricePerKg: 200000,
  },
  {
    id: "toraja-anaerobic",
    name: "Toraja Anaerobic",
    category: "Espresso",
    process: "Anaerobic",
    origin: "Sulawesi",
    tastingNotes: ["Spicy", "Complex", "Dark Chocolate"],
    description: "An experimental processing method that brings out deep, complex flavors from the Toraja highlands.",
    pricePerKg: 250000,
  },
  {
    id: "commercial-blend",
    name: "Commercial Blend",
    category: "Espresso",
    process: "Natural",
    origin: "Bali & Sumatra",
    tastingNotes: ["Earthy", "Bold", "Roasted Nuts"],
    description: "A robust, high-yield blend tailored for busy cafes that need consistency and punch through milk.",
    pricePerKg: 150000,
  },
];
