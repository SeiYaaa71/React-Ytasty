import type { Product } from './api';

/** Types propres au back-office (Dev C). Les types partagés restent dans api.ts. */

/** Identifiant renvoyé par l'API (entier côté base, accepté aussi en chaîne). */
export type Id = number | string;

export type Role = 'staff' | 'admin' | 'direction';

/** Utilisateur connecté, reconstruit à partir du JWT. */
export interface AuthUser {
  username: string;
  role: Role;
  restaurant_id: Id | null;
  first_name?: string;
  last_name?: string;
}

export interface LoginResponse {
  access_token: string;
  token_type?: string;
}

export interface UserCreatePayload {
  first_name: string;
  last_name: string;
  username: string;
  password: string;
  role: Role;
  restaurant_id: Id | null;
}

export interface CreatedUser extends Omit<UserCreatePayload, 'password'> {
  id: Id;
}

export interface HealthResponse {
  status: string;
  [key: string]: unknown;
}

export type ProductPayload = Omit<Product, 'id' | 'image'> & { image_url: string };

export interface ProductFilters {
  restaurant_id?: Id;
  category?: string;
  q?: string;
  is_available?: boolean;
}
