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

export interface SessionParticipant {
  id: string;
  name: string;
  is_host?: boolean;
}

export interface TableInfo {
  id: string;
  number: string | number;
  capacity?: number;
}

export interface TimeSlot {
  id: string;
  name: string;
  start_time?: string;
  end_time?: string;
  active?: boolean;
}

export interface Session {
  id: string;
  status: string;
  table: TableInfo;
  branch: Branch;
  restaurant: Restaurant;
  participants: SessionParticipant[];
  current_time_slot?: TimeSlot;
  created_at?: string;
}

export interface WaiterReason {
  id: string;
  label: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  display_order?: number;
}

export interface ModificationOption {
  id: string;
  name: string;
  price: number;
  available?: boolean;
}

export interface ModificationGroup {
  id: string;
  name: string;
  required: boolean;
  max_selections: number;
  min_selections?: number;
  options: ModificationOption[];
}

export interface MenuProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  category_id: string;
  category?: string;
  image?: string;
  available: boolean;
  rating?: number;
  reviews_count?: number;
  prep_time_minutes?: number;
  featured?: boolean;
  keywords?: string[];
  ingredients?: string[];
  modification_groups?: ModificationGroup[];
}

export interface Menu {
  categories: MenuCategory[];
  products: MenuProduct[];
  time_slots?: TimeSlot[];
}

export interface ProductReview {
  id: string;
  user_name: string;
  rating: number;
  comment?: string;
  created_at: string;
}

export interface CartModification {
  group_id: string;
  group_name: string;
  option_id: string;
  option_name: string;
  price: number;
}

export interface CartItem {
  id: string;
  product: MenuProduct;
  quantity: number;
  modifications: CartModification[];
  notes?: string;
  totalPrice: number;
}

export interface ScanResponse {
  session: Session;
  menu?: Menu;
}
