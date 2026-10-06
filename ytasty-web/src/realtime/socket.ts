import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { TOKEN_STORAGE_KEY } from '../api/services';

/**
 * Contrat temps réel partagé avec le backend (voir README) :
 *  - le client rejoint une « room » :  emit('join', { room: 'restaurant:<id>' | 'order:<numero>' | 'catalog' })
 *  - le serveur émet :
 *      'order:created'                  -> Order       (room restaurant:<id>)  Option A
 *      'order:status_updated'           -> Order       (rooms restaurant:<id> et order:<numero>)  Option B
 *      'product:availability_updated'   -> Product     (room catalog)  Option C
 */
export const SOCKET_EVENTS = {
  ORDER_CREATED: 'order:created',
  ORDER_STATUS_UPDATED: 'order:status_updated',
  PRODUCT_AVAILABILITY_UPDATED: 'product:availability_updated',
} as const;

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL?.trim();

let socket: Socket | null = null;

export const getSocket = (): Socket | null => {
  if (!SOCKET_URL) return null;
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      auth: (cb) => cb({ token: localStorage.getItem(TOKEN_STORAGE_KEY) }),
      reconnectionDelay: 2000,
    });
  }
  return socket;
};

/** Indique si la connexion temps réel est active (sinon les pages repassent en rafraîchissement périodique). */
export const useSocketStatus = () => {
  const [connected, setConnected] = useState(() => Boolean(getSocket()?.connected));
  useEffect(() => {
    const s = getSocket();
    if (!s) return undefined;
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    setConnected(s.connected);
    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
    };
  }, []);
  return connected;
};

/** Rejoint une room et écoute un évènement tant que le composant est monté. */
export const useSocketEvent = <T,>(room: string | null, event: string, handler: (payload: T) => void) => {
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    const s = getSocket();
    if (!s || !room) return undefined;
    const join = () => s.emit('join', { room });
    const listener = (payload: T) => handlerRef.current(payload);
    if (s.connected) join();
    s.on('connect', join);
    s.on(event, listener);
    return () => {
      s.emit('leave', { room });
      s.off('connect', join);
      s.off(event, listener);
    };
  }, [room, event]);
};
