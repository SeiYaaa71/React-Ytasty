import React, { useState } from 'react';
import { Alert, Button, Paper, Stack, Typography } from '@mui/material';
import { Link, useLocation, Navigate } from 'react-router-dom';
import { Order } from '../types/api';

export const OrderConfirmation: React.FC = () => {
  const location = useLocation();
  const order = (location.state as { order?: Order } | null)?.order;
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState('');

  if (!order) return <Navigate replace to="/panier"/>;

  const copyOrderNumber = async () => {
    try {
      await navigator.clipboard.writeText(order.order_number);
      setCopied(true);
      setCopyError('');
    } catch (error) {
      console.error('Impossible de copier le numéro de commande.', error);
      setCopyError('La copie a échoué. Vous pouvez sélectionner le numéro manuellement.');
    }
  };

  return (
    <Paper sx={{ maxWidth: 700, mx: 'auto', p: { xs: 3, sm: 5 }, textAlign: 'center' }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>Commande confirmée !</Typography>
      <Typography color="text.secondary" mb={2}>Votre numéro de commande</Typography>
      <Typography
        variant="h2"
        color="primary"
        fontWeight="bold"
        sx={{ fontSize: { xs: '2.5rem', sm: '4rem' }, overflowWrap: 'anywhere' }}
      >
        {order.order_number}
      </Typography>
      <Stack spacing={2} mt={3}>
        <Button variant="outlined" onClick={copyOrderNumber}>
          {copied ? 'Numéro copié' : 'Copier le numéro'}
        </Button>
        {copyError && <Alert severity="error">{copyError}</Alert>}
        <Button component={Link} to={`/suivi/${encodeURIComponent(order.order_number)}`} variant="contained">
          Suivre ma commande
        </Button>
        <Button component={Link} to="/" color="inherit">Retour à l’accueil</Button>
      </Stack>
    </Paper>
  );
};
