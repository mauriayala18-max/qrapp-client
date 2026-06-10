export interface User {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  photo?: string;
  points: number;
  dietary_restrictions?: string[];
  favorite_cuisines?: string[];
  dining_frequency?: string;
  needs_terms_acceptance?: boolean;
}

export interface Branch {
  id: string;
  restaurant_id: string;
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
}

export interface Restaurant {
  id: string;
  name: string;
  description?: string;
  cuisine_type: string;
  rating: number;
  reviews_count?: number;
  logo?: string;
  cover_image?: string;
  branches?: Branch[];
  distance?: string;
  color?: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  image?: string;
  available: boolean;
  allergens?: string[];
}

export interface OrderItem {
  product_id: string;
  product: Product;
  quantity: number;
  unit_price: number;
  notes?: string;
}

export interface Order {
  id: string;
  branch_id: string;
  restaurant: Restaurant;
  items: OrderItem[];
  total: number;
  status:
    | "pending"
    | "confirmed"
    | "preparing"
    | "ready"
    | "delivered"
    | "cancelled";
  created_at: string;
  table_number?: string;
}

export interface Reservation {
  id: string;
  restaurant: Restaurant;
  date: string;
  time: string;
  guests: number;
  status: "pending" | "confirmed" | "cancelled";
  notes?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  needs_terms_acceptance?: boolean;
}

export interface RegisterData {
  full_name: string;
  email: string;
  password: string;
}

export interface UpdateProfileData {
  full_name?: string;
  phone?: string;
  dietary_restrictions?: string[];
  favorite_cuisines?: string[];
  dining_frequency?: string;
}

export interface Promotion {
  id: string;
  title: string;
  restaurant: string;
  discount: string;
  color: string;
  expires?: string;
}
