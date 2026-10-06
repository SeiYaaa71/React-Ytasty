import type { Product, User } from './api';

/** Types propres au back-office. Les types partagés restent dans api.ts. */

/** Identifiant renvoyé par l'API. Entier côté base, toléré en chaîne. */
export type Id = number | string;

export type Role = 'staff' | 'admin' | 'direction';

/** Utilisateur connecté, renvoyé par /auth/login puis reconstruit du JWT. */
export interface AuthUser {
  id?: Id;
  username: string;
  role: Role;
  restaurant_id: Id | null;
  first_name?: string;
  last_name?: string;
}

export interface LoginResponse {
  access_token: string;
  token_type?: string;
  user?: User;
}

export interface UserCreatePayload {
  first_name: string;
  last_name: string;
  username: string;
  password: string;
  role: Role;
  restaurant_id: Id | null;
}

export type CreatedUser = User;

export interface HealthResponse {
  status: string;
  [key: string]: unknown;
}

/** Corps de POST /products et PATCH /products/{id}. */
export type ProductPayload = Omit<Product, 'id'>;

export interface ProductFilters {
  restaurant_id?: Id;
  category?: string;
  q?: string;
  is_available?: boolean;
}
