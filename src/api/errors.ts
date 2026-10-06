import axios from 'axios';

/** Transforme une erreur axios / FastAPI en message lisible. */
export const getErrorMessage = (error: unknown, fallback = 'Une erreur est survenue.'): string => {
  if (axios.isAxiosError(error)) {
    if (!error.response) return 'Impossible de joindre le serveur. Vérifiez que l’API est lancée.';
    const detail = (error.response.data as { detail?: unknown } | undefined)?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      const messages = detail
        .map((item) => (typeof item === 'object' && item && 'msg' in item ? String(item.msg) : ''))
        .filter(Boolean);
      if (messages.length > 0) return messages.join(' · ');
    }
    if (error.response.status === 403) return 'Vous n’avez pas les droits pour cette action.';
    if (error.response.status === 404) return 'Ressource introuvable.';
  }
  return fallback;
};
