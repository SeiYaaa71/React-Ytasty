/**
 * Contrat d'API Ytasty Crousty.
 *
 * Ces types reflètent exactement ce que renvoie le backend FastAPI.
 * Les identifiants sont des entiers côté base de données.
 */

export interface Restaurant {
  id: number;
  name: string;
  city: string;
  address: string;
  is_open: boolean;
  opening_hours: string;
  contact: string;
}

export interface Product {
  id: number;
  name: string;
  /** Le backend nomme ce champ `image`, pas `image_url`. */
  image: string;
  description: string;
  category: string;
  price: number;
  is_available: boolean;
  restaurant_id: number;
  ingredients: string[];
}

export interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  role: 'staff' | 'admin' | 'direction';
  restaurant_id: number | null;
}

export type OrderStatus =
  | 'pending'
  | 'validated'
  | 'preparing'
  | 'ready'
  | 'collected'
  | 'cancelled';

/** Valeurs acceptées par le backend : `onsite` et non `on_site`. */
export type PickupMode = 'onsite' | 'takeaway';

export interface OrderItem {
  product_id: number;
  product_name: string;
  quantity: number;
  /** Prix figé au moment de la commande. */
  unit_price: number;
}

export interface Order {
  id: number;
  order_number: string;
  restaurant_id: number;
  status: OrderStatus;
  pickup_mode: PickupMode;
  customer_name: string;
  customer_email: string;
  items: OrderItem[];
  total_amount: number;
  created_at: string;
}

/** Corps attendu par POST /orders. Le client est imbriqué. */
export interface CreateOrderPayload {
  restaurant_id: number;
  pickup_mode: PickupMode;
  customer: {
    name: string;
    email: string;
  };
  items: {
    product_id: number;
    quantity: number;
  }[];
}
