import type { AuthUser, Id, Role } from '../types/backoffice';

const ROLES: Role[] = ['staff', 'admin', 'direction'];

interface JwtPayload {
  sub?: string;
  username?: string;
  role?: string;
  restaurant_id?: Id | null;
  first_name?: string;
  last_name?: string;
  exp?: number;
}

/** Décode la partie « payload » d'un JWT (sans vérifier la signature, c'est le rôle du backend). */
export const decodeJwt = (token: string): JwtPayload | null => {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const json = decodeURIComponent(
      atob(padded)
        .split('')
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join(''),
    );
    const value: unknown = JSON.parse(json);
    return typeof value === 'object' && value !== null ? (value as JwtPayload) : null;
  } catch {
    return null;
  }
};

export const isTokenExpired = (token: string) => {
  const exp = decodeJwt(token)?.exp;
  return typeof exp === 'number' && exp * 1000 <= Date.now();
};

export const userFromToken = (token: string): AuthUser | null => {
  const payload = decodeJwt(token);
  if (!payload) return null;
  const role = ROLES.find((item) => item === payload.role);
  const username = payload.username ?? payload.sub;
  if (!role || !username) return null;
  return {
    username,
    role,
    restaurant_id: payload.restaurant_id ?? null,
    first_name: payload.first_name,
    last_name: payload.last_name,
  };
};
