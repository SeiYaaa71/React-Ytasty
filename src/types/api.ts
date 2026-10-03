export interface Restaurant {
  id: string;
  name: string;
  city: string;
  address: string;
  is_open: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  is_available: boolean;
  restaurant_id: string;
  ingredients: string[];
}

export interface User {
  id: string;
  email: string;
  role: 'client' | 'staff' | 'admin' | 'direction';
  restaurant_id?: string;
}

export type OrderStatus = 'pending' | 'validated' | 'preparing' | 'ready' | 'collected' | 'cancelled';
export type PickupMode = 'on_site' | 'takeaway';

export interface OrderItem {
  product_id: string;
  quantity: number;
  price_at_time: number;
}

export interface Order {
  id: string;
  order_number: string;
  restaurant_id: string;
  customer_name: string;
  customer_email: string;
  pickup_mode: PickupMode;
  status: OrderStatus;
  items: OrderItem[];
  total_amount: number;
  created_at: string;
}
