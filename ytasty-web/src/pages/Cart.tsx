import React from 'react';
import {
  Box, Button, IconButton, Paper, Stack, Typography,
} from '@mui/material';
import { Link, Navigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store';
import { decrement, increment, removeItem, selectTotal } from '../features/cart/cartSlice';

export const Cart: React.FC = () => {
  const dispatch = useAppDispatch();
  const { items } = useAppSelector((state) => state.cart);
  const restaurant = useAppSelector((state) => state.restaurant.activeRestaurant);
  const total = useAppSelector(selectTotal);

  if (!restaurant) return <Navigate replace to="/"/>;

  return (
    <Box maxWidth={800} mx="auto">
      <Typography variant="h3" fontWeight="bold" mb={3}>Votre panier</Typography>
      {items.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary" mb={2}>Votre panier est vide.</Typography>
          <Button component={Link} to="/carte" variant="contained">Découvrir la carte</Button>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {items.map(({ product, quantity }) => (
            <Paper key={product.id} sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box flexGrow={1} minWidth={0}>
                <Typography variant="h6" fontWeight="bold">{product.name}</Typography>
                <Typography color="text.secondary">{product.price.toFixed(2)}€ l’unité</Typography>
              </Box>
              <IconButton aria-label={`Diminuer ${product.name}`} onClick={() => dispatch(decrement(product.id))}>−</IconButton>
              <Typography>{quantity}</Typography>
              <IconButton
                aria-label={`Augmenter ${product.name}`}
                disabled={!restaurant.is_open || !product.is_available}
                onClick={() => dispatch(increment({ productId: product.id, restaurantIsOpen: restaurant.is_open }))}
              >
                +
              </IconButton>
              <Typography fontWeight="bold" sx={{ minWidth: 75, textAlign: 'right' }}>
                {(product.price * quantity).toFixed(2)}€
              </Typography>
              <Button color="error" onClick={() => dispatch(removeItem(product.id))}>Retirer</Button>
            </Paper>
          ))}
          <Paper sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" mb={2}>
              <Typography variant="h6" fontWeight="bold">Total</Typography>
              <Typography variant="h6" fontWeight="bold">{total.toFixed(2)}€</Typography>
            </Box>
            <Button
              component={Link}
              to="/commande"
              variant="contained"
              size="large"
              fullWidth
              disabled={!restaurant.is_open}
            >
              {restaurant.is_open ? 'Continuer la commande' : 'Restaurant actuellement fermé'}
            </Button>
          </Paper>
        </Stack>
      )}
    </Box>
  );
};
