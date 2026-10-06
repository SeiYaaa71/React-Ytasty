import type { OrderStatus } from '../types/api';
import type { Role } from '../types/backoffice';

/** Catégories du sujet. `value` doit correspondre exactement à ce qui est stocké en base. */
export const CATEGORIES = [
  { value: 'burgers', label: 'Burgers' },
  { value: 'menus', label: 'Menus' },
  { value: 'accompagnements', label: 'Accompagnements' },
  { value: 'boissons', label: 'Boissons' },
  { value: 'desserts', label: 'Desserts' },
] as const;

export const getCategoryLabel = (value: string) =>
  CATEGORIES.find((category) => category.value.toLowerCase() === value.toLowerCase())?.label ?? value;

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'En attente',
  validated: 'Validée',
  preparing: 'En préparation',
  ready: 'Prête',
  collected: 'Récupérée',
  cancelled: 'Annulée',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, 'default' | 'info' | 'warning' | 'success' | 'error' | 'secondary'> = {
  pending: 'warning',
  validated: 'info',
  preparing: 'secondary',
  ready: 'success',
  collected: 'default',
  cancelled: 'error',
};

/** Étape suivante d'une commande et libellé du bouton d'action rapide. */
export const NEXT_STATUS: Partial<Record<OrderStatus, { status: OrderStatus; action: string }>> = {
  pending: { status: 'validated', action: 'Valider' },
  validated: { status: 'preparing', action: 'Lancer la préparation' },
  preparing: { status: 'ready', action: 'Marquer prête' },
  ready: { status: 'collected', action: 'Remise au client' },
};

export const PICKUP_LABELS: Record<string, string> = {
  onsite: 'Sur place',
  on_site: 'Sur place',
  takeaway: 'À emporter',
};

export const ROLE_LABELS: Record<Role, string> = {
  staff: 'Staff',
  admin: 'Admin',
  direction: 'Direction',
};

export const ROLE_COLORS: Record<Role, 'info' | 'error' | 'secondary'> = {
  staff: 'info',
  admin: 'error',
  direction: 'secondary',
};

/** Au-delà de ce délai, une commande « en attente » est signalée en cuisine. */
export const LATE_ORDER_MINUTES = 10;

export const PLACEHOLDER_IMAGE = '/placeholder-food.svg';
