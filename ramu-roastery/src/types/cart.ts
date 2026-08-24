export interface CartItem {
  id: string; // Product ID + Grind Profile + Weight
  productId: string;
  name: string;
  price: number; // Price for the selected weight
  quantity: number;
  weight: number;
  grind: string;
  image?: string;
}

export interface CustomerDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
}

export interface CheckoutPayload {
  items: CartItem[];
  customer: CustomerDetails;
  shippingCost: number;
}
