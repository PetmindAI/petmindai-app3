import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  image_url: string;
  stock: number;
  stock_quantity: number;
  created_at: string;
  updated_at: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Pet {
  id: string;
  user_id: string;
  name: string;
  pet_type: 'dog' | 'cat';
  breed?: string;
  age?: number;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  payment_method?: string;
  payment_id?: string;
  shipping_address?: any;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  message: string;
  response: string;
  recommended_products?: Product[];
  created_at: string;
}

export interface UserProfile {
  id: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
  provider?: string;
  created_at: string;
  updated_at: string;
}
