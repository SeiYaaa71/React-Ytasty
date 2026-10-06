import { useEffect, useState } from 'react';
import { useAppSelector } from '../../store';
import { getRestaurants } from '../../api/services';
import type { Restaurant } from '../../types/api';
import type { Id } from '../../types/backoffice';
import { sameId } from '../../utils/format';

/** Liste des restaurants pour le back-office (chargée une fois, partagée entre les pages). */
let cache: Restaurant[] | null = null;

export const useRestaurants = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>(cache ?? []);
  const [loading, setLoading] = useState(cache === null);
  const [error, setError] = useState('');

  const reload = async () => {
    setLoading(true);
    try {
      cache = await getRestaurants();
      setRestaurants(cache);
      setError('');
    } catch {
      setError('Impossible de charger les restaurants.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (cache === null) void reload();
  }, []);

  const replace = (updated: Restaurant) => {
    cache = (cache ?? []).map((item) => (sameId(item.id, updated.id) ? updated : item));
    setRestaurants(cache);
  };

  return { restaurants, loading, error, reload, replace };
};

/**
 * Restaurant sur lequel travaille l'utilisateur du back-office :
 *  - staff : toujours son restaurant de rattachement (non modifiable)
 *  - admin / direction : choix libre (par défaut le restaurant du compte, sinon le premier)
 */
export const useRestaurantScope = () => {
  const user = useAppSelector((state) => state.auth.user);
  const { restaurants, loading } = useRestaurants();
  const [selectedId, setSelectedId] = useState<Id | null>(user?.restaurant_id ?? null);

  const locked = user?.role === 'staff';
  const effectiveId: Id | null = locked
    ? user?.restaurant_id ?? null
    : selectedId ?? restaurants[0]?.id ?? null;

  const restaurant = restaurants.find((item) => sameId(item.id, effectiveId));

  return {
    restaurants,
    restaurantId: effectiveId,
    restaurant,
    locked,
    setRestaurantId: (id: Id) => setSelectedId(id),
    loading,
  };
};
