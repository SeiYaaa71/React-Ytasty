const priceFormatter = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });

export const formatPrice = (value: number) => priceFormatter.format(value);

/** Minutes écoulées depuis une date ISO (0 si la date est invalide). */
export const minutesSince = (isoDate: string, now: number = Date.now()) => {
  const time = new Date(isoDate).getTime();
  if (Number.isNaN(time)) return 0;
  return Math.max(0, Math.floor((now - time) / 60000));
};

export const formatElapsed = (minutes: number) => {
  if (minutes < 1) return 'à l’instant';
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `il y a ${hours} h ${String(minutes % 60).padStart(2, '0')}`;
};

export const formatTime = (isoDate: string) => {
  const date = new Date(isoDate);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};

export const initials = (text: string) =>
  text
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || '?';

export const sameId = (a: unknown, b: unknown) => a !== null && a !== undefined && String(a) === String(b);
