import React, { useState } from 'react';
import {
  Alert, Box, Card, CardContent, CircularProgress, FormControlLabel, Skeleton, Stack, Switch, Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import { getErrorMessage } from '../../api/errors';
import { setRestaurantAvailability } from '../../api/services';
import type { Restaurant } from '../../types/api';
import { useAppDispatch, useAppSelector } from '../../store';
import { setActiveRestaurant } from '../../features/restaurant/restaurantSlice';
import { useRestaurants } from '../../features/backoffice/useRestaurantScope';
import { sameId } from '../../utils/format';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useNotify } from '../../components/ui/NotificationProvider';

export const RestaurantsAdmin: React.FC = () => {
  const dispatch = useAppDispatch();
  const notify = useNotify();
  const activeRestaurant = useAppSelector((state) => state.restaurant.activeRestaurant);
  const { restaurants, loading, error, replace } = useRestaurants();
  const [busy, setBusy] = useState<string | null>(null);
  const [toClose, setToClose] = useState<Restaurant | null>(null);

  const apply = async (restaurant: Restaurant, isOpen: boolean) => {
    setBusy(String(restaurant.id));
    try {
      const updated = await setRestaurantAvailability(restaurant.id, isOpen);
      const merged = { ...restaurant, ...(updated ?? {}), is_open: updated?.is_open ?? isOpen };
      replace(merged);
      // Si c'est le restaurant sélectionné côté client, on garde son état à jour.
      if (activeRestaurant && sameId(activeRestaurant.id, merged.id)) dispatch(setActiveRestaurant(merged));
      notify(`${restaurant.name} est maintenant ${isOpen ? 'ouvert' : 'fermé'}`, isOpen ? 'success' : 'warning');
      setToClose(null);
    } catch (toggleError) {
      notify(getErrorMessage(toggleError, 'Impossible de modifier l’ouverture.'), 'error');
    } finally {
      setBusy(null);
    }
  };

  const handleToggle = (restaurant: Restaurant) => {
    if (restaurant.is_open) setToClose(restaurant); // fermeture = confirmation
    else void apply(restaurant, true);
  };

  return (
    <Box>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Ouverture ou fermeture temporaire d’un établissement. Un restaurant fermé ne peut plus recevoir de commande.
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Grid container spacing={3}>
        {loading && restaurants.length === 0
          ? [0, 1, 2].map((key) => (
            <Grid key={key} size={{ xs: 12, md: 4 }}><Skeleton variant="rounded" height={220} /></Grid>
          ))
          : restaurants.map((restaurant) => (
            <Grid key={restaurant.id} size={{ xs: 12, md: 4 }}>
              <Card sx={{ height: '100%', '&:hover': { transform: 'none' } }}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, p: 3 }}>
                  <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">{restaurant.name}</Typography>
                    <StatusBadge isOpen={restaurant.is_open} />
                  </Stack>
                  {restaurant.address && (
                    <Stack direction="row" sx={{ gap: 1, color: 'text.secondary' }}><PlaceOutlinedIcon fontSize="small" /><Typography variant="body2">{restaurant.address}, {restaurant.city}</Typography></Stack>
                  )}
                  {'opening_hours' in restaurant && typeof restaurant.opening_hours === 'string' && (
                    <Stack direction="row" sx={{ gap: 1, color: 'text.secondary' }}><ScheduleOutlinedIcon fontSize="small" /><Typography variant="body2">{restaurant.opening_hours}</Typography></Stack>
                  )}
                  {'contact' in restaurant && typeof restaurant.contact === 'string' && (
                    <Stack direction="row" sx={{ gap: 1, color: 'text.secondary' }}><PhoneOutlinedIcon fontSize="small" /><Typography variant="body2">{restaurant.contact}</Typography></Stack>
                  )}
                  <FormControlLabel
                    sx={{ mt: 1 }}
                    control={
                      busy === String(restaurant.id)
                        ? <CircularProgress size={22} sx={{ mx: 1.5 }} />
                        : <Switch checked={restaurant.is_open} color="success" onChange={() => handleToggle(restaurant)} />
                    }
                    label={restaurant.is_open ? 'Prise de commande ouverte' : 'Prise de commande fermée'}
                  />
                </CardContent>
              </Card>
            </Grid>
          ))}
      </Grid>
      <ConfirmDialog
        open={Boolean(toClose)}
        title={`Fermer ${toClose?.name ?? ''} ?`}
        message="Les clients ne pourront plus passer commande dans ce restaurant jusqu’à sa réouverture."
        confirmLabel="Fermer le restaurant"
        danger
        loading={busy !== null}
        onConfirm={() => toClose && void apply(toClose, false)}
        onClose={() => setToClose(null)}
      />
    </Box>
  );
};
