import { apiClient } from './client';
import type { Order, OrderStatus, Product, Restaurant } from '../types/api';
import type {
  CreatedUser, HealthResponse, Id, LoginResponse, ProductFilters, ProductPayload, UserCreatePayload,
} from '../types/backoffice';

/**
 * Appels API utilisés par le back-office.
 * Si une route ou un nom de champ change côté backend, c'est le fichier à adapter.
 */

export const TOKEN_STORAGE_KEY = 'access_token';

// Santé
export const getHealth = () => apiClient.get<HealthResponse>('/health').then((r) => r.data);

// Auth & utilisateurs
export const login = (username: string, password: string) =>
  apiClient.post<LoginResponse>('/auth/login', { username, password }).then((r) => r.data);

export const createUser = (payload: UserCreatePayload) =>
  apiClient.post<CreatedUser>('/users', payload).then((r) => r.data);

// Restaurants
export const getRestaurants = () => apiClient.get<Restaurant[]>('/restaurants').then((r) => r.data);

export const setRestaurantAvailability = (id: Id, isOpen: boolean) =>
  apiClient.patch<Restaurant>(`/restaurants/${id}/availability`, { is_open: isOpen }).then((r) => r.data);

// Produits
export const getProducts = (filters: ProductFilters = {}) => {
  const params: Record<string, string> = {};
  if (filters.restaurant_id !== undefined) params.restaurant_id = String(filters.restaurant_id);
  if (filters.category) params.category = filters.category;
  if (filters.q) params.q = filters.q;
  if (filters.is_available !== undefined) params.is_available = String(filters.is_available);
  return apiClient.get<Product[]>('/products', { params }).then((r) => r.data);
};

export const createProduct = (payload: ProductPayload) =>
  apiClient.post<Product>('/products', payload).then((r) => r.data);

export const updateProduct = (id: Id, payload: Partial<ProductPayload>) =>
  apiClient.patch<Product>(`/products/${id}`, payload).then((r) => r.data);

export const deleteProduct = (id: Id) => apiClient.delete(`/products/${id}`).then(() => undefined);

export const setProductAvailability = (id: Id, isAvailable: boolean) =>
  apiClient.patch<Product>(`/products/${id}/availability`, { is_available: isAvailable }).then((r) => r.data);

// Commandes (cuisine)
export const getRestaurantOrders = (restaurantId: Id, status?: OrderStatus) =>
  apiClient
    .get<Order[]>(`/restaurants/${restaurantId}/orders`, { params: status ? { status } : undefined })
    .then((r) => r.data);

export const updateOrderStatus = (orderNumber: string, status: OrderStatus) =>
  apiClient
    .patch<Order>(`/orders/${encodeURIComponent(orderNumber)}/status`, { status })
    .then((r) => r.data);

export const cancelOrder = (orderNumber: string) =>
  apiClient.post<Order>(`/orders/${encodeURIComponent(orderNumber)}/cancel`).then((r) => r.data);
