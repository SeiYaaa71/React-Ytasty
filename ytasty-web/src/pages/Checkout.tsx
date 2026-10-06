import React, { FormEvent, useRef, useState } from 'react';
import {
  Alert, Box, Button, Card, CardActionArea, CardContent, CircularProgress,
  FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, Stack, TextField, Typography,
} from '@mui/material';
import { Navigate, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useAppDispatch, useAppSelector } from '../store';
import { clearCart, selectTotal } from '../features/cart/cartSlice';
import { CreateOrderPayload, Order, PickupMode } from '../types/api';

export const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const restaurant = useAppSelector((state) => state.restaurant.activeRestaurant);
  const { items } = useAppSelector((state) => state.cart);
  const total = useAppSelector(selectTotal);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pickupMode, setPickupMode] = useState<PickupMode>('takeaway');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const orderPlaced = useRef(false);

  if (!restaurant) return <Navigate replace to="/"/>;
  if (items.length === 0 && !orderPlaced.current) return <Navigate replace to="/panier"/>;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      // Le backend attend le client imbriqué dans `customer` et calcule
      // lui-même le total : on ne lui envoie jamais de prix.
      const payload: CreateOrderPayload = {
        restaurant_id: restaurant.id,
        pickup_mode: pickupMode,
        customer: {
          name: name.trim(),
          email: email.trim(),
        },
        items: items.map(({ product, quantity }) => ({
          product_id: product.id,
          quantity,
        })),
      };

      const response = await apiClient.post<Order>('/orders', payload);
      orderPlaced.current = true;
      navigate('/confirmation', { state: { order: response.data } });
      dispatch(clearCart());
    } catch (submitError) {
      console.error('Impossible de créer la commande.', submitError);
      setError('La commande n’a pas pu être enregistrée. Vérifiez votre connexion puis réessayez.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box maxWidth={720} mx="auto">
      <Typography variant="h3" fontWeight="bold" mb={3}>Finaliser la commande</Typography>
      {!restaurant.is_open && (
        <Alert severity="warning" sx={{ mb: 2 }}>Ce restaurant est fermé et ne peut pas recevoir de commande.</Alert>
      )}
      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={3}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            required fullWidth label="Nom" value={name}
            onChange={(event) => setName(event.target.value)}
            inputProps={{ minLength: 2, maxLength: 100 }}
          />
          <TextField
            required fullWidth type="email" label="Adresse e-mail" value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <FormControl>
            <FormLabel id="pickup-mode-label">Mode de retrait</FormLabel>
            <RadioGroup
              aria-labelledby="pickup-mode-label"
              value={pickupMode}
              onChange={(event) => setPickupMode(event.target.value as PickupMode)}
            >
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mt={1}>
                <Card variant="outlined" sx={{ flex: 1 }}>
                  <CardActionArea onClick={() => setPickupMode('takeaway')}>
                    <CardContent>
                      <FormControlLabel value="takeaway" control={<Radio/>} label="À emporter"/>
                      <Typography color="text.secondary" variant="body2">Récupérez votre commande au comptoir.</Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
                <Card variant="outlined" sx={{ flex: 1 }}>
                  <CardActionArea onClick={() => setPickupMode('onsite')}>
                    <CardContent>
                      <FormControlLabel value="onsite" control={<Radio/>} label="Sur place"/>
                      <Typography color="text.secondary" variant="body2">Profitez de votre repas au restaurant.</Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Stack>
            </RadioGroup>
          </FormControl>
          <Box display="flex" justifyContent="space-between">
            <Typography variant="h6" fontWeight="bold">Total</Typography>
            <Typography variant="h6" fontWeight="bold">{total.toFixed(2)}€</Typography>
          </Box>
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={submitting || !restaurant.is_open}
          >
            {submitting ? <CircularProgress size={24} color="inherit"/> : 'Confirmer la commande'}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
};
