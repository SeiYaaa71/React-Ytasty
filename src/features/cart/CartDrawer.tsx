import React from 'react';
import {
  Box, Button, Divider, Drawer, Stack, Typography,
} from '@mui/material';
import { Link } from 'react-router-dom';
import { useAppSelector } from '../../store';
import { selectTotal } from './cartSlice';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ open, onClose }) => {
  const items = useAppSelector((state) => state.cart.items);
  const total = useAppSelector(selectTotal);

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: { xs: '100vw', sm: 400 }, p: 3 }} role="presentation">
        <Typography variant="h5" fontWeight="bold" mb={2}>Votre panier</Typography>
        {items.length === 0 ? (
          <Typography color="text.secondary">Votre panier est vide.</Typography>
        ) : (
          <Stack spacing={2} divider={<Divider flexItem/>}>
            {items.map(({ product, quantity }) => (
              <Box key={product.id} display="flex" justifyContent="space-between" gap={2}>
                <Typography>{product.name} × {quantity}</Typography>
                <Typography fontWeight="bold">{(product.price * quantity).toFixed(2)}€</Typography>
              </Box>
            ))}
          </Stack>
        )}
        {items.length > 0 && (
          <>
            <Divider sx={{ my: 2 }}/>
            <Box display="flex" justifyContent="space-between" mb={2}>
              <Typography fontWeight="bold">Total</Typography>
              <Typography fontWeight="bold">{total.toFixed(2)}€</Typography>
            </Box>
          </>
        )}
        <Stack spacing={1} mt={3}>
          <Button component={Link} to="/panier" variant="outlined" onClick={onClose}>
            Voir le panier
          </Button>
          {items.length > 0 && (
            <Button component={Link} to="/commande" variant="contained" onClick={onClose}>
              Commander
            </Button>
          )}
          <Button onClick={onClose} color="inherit">Continuer mes achats</Button>
        </Stack>
      </Box>
    </Drawer>
  );
};
