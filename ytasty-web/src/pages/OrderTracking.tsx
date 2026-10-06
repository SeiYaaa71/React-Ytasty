import React, { FormEvent, useEffect, useState } from 'react';
import {
  Alert, Box, Button, Paper, Stack, Step, StepLabel, Stepper, TextField, Typography,
} from '@mui/material';
import { AxiosError } from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { apiClient } from '../api/client';
import { Order, OrderStatus } from '../types/api';

const steps: OrderStatus[] = ['pending', 'validated', 'preparing', 'ready', 'collected'];
const stepLabels: Record<OrderStatus, string> = {
  pending: 'En attente',
  validated: 'Validée',
  preparing: 'En préparation',
  ready: 'Prête',
  collected: 'Récupérée',
  cancelled: 'Annulée',
};

export const OrderTracking: React.FC = () => {
  const { order_number: orderNumberParam } = useParams<{ order_number: string }>();
  const navigate = useNavigate();
  const [manualOrderNumber, setManualOrderNumber] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(Boolean(orderNumberParam));
  const [notFound, setNotFound] = useState(false);
  const [requestError, setRequestError] = useState('');

  useEffect(() => {
    if (!orderNumberParam) {
      setOrder(null);
      setNotFound(false);
      setLoading(false);
      return;
    }

    let active = true;
    let fetching = false;
    const loadOrder = async (initial: boolean) => {
      if (fetching) return;
      fetching = true;
      if (initial) {
        setLoading(true);
        setNotFound(false);
      }
      try {
        const response = await apiClient.get<Order>(
          `/orders/${encodeURIComponent(orderNumberParam)}`,
        );
        if (!active) return;
        setOrder(response.data);
        setNotFound(false);
        setRequestError('');
      } catch (error) {
        if (!active) return;
        const status = (error as AxiosError).response?.status;
        if (status === 404) {
          setOrder(null);
          setNotFound(true);
        } else {
          console.error('Impossible de récupérer le suivi de la commande.', error);
          setRequestError('Le suivi est temporairement indisponible. Une nouvelle tentative sera effectuée.');
        }
      } finally {
        fetching = false;
        if (active && initial) setLoading(false);
      }
    };

    void loadOrder(true);
    const interval = window.setInterval(() => void loadOrder(false), 5000);
    const refreshOnFocus = () => void loadOrder(false);
    window.addEventListener('focus', refreshOnFocus);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener('focus', refreshOnFocus);
    };
  }, [orderNumberParam]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const orderNumber = manualOrderNumber.trim();
    if (orderNumber) navigate(`/suivi/${encodeURIComponent(orderNumber)}`);
  };

  const currentStep = order ? steps.indexOf(order.status) : -1;

  return (
    <Box maxWidth={800} mx="auto">
      <Typography variant="h3" fontWeight="bold" mb={3}>Suivre une commande</Typography>
      {!orderNumberParam && (
        <Paper component="form" onSubmit={handleSearch} sx={{ p: 3, mb: 3 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              fullWidth
              label="Numéro de commande"
              value={manualOrderNumber}
              onChange={(event) => setManualOrderNumber(event.target.value)}
              required
            />
            <Button type="submit" variant="contained">Rechercher</Button>
          </Stack>
        </Paper>
      )}

      {loading && <Typography role="status">Chargement du suivi…</Typography>}
      {requestError && <Alert severity="warning" sx={{ mb: 2 }}>{requestError}</Alert>}
      {notFound && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Cette commande est introuvable. Vérifiez son numéro puis réessayez.
        </Alert>
      )}
      {order && (
        <Stack spacing={3}>
          <Paper sx={{ p: { xs: 2, sm: 4 } }}>
            <Typography variant="h5" fontWeight="bold" mb={3}>
              Commande {order.order_number}
            </Typography>
            {order.status === 'cancelled' ? (
              <Alert severity="error">Cette commande a été annulée.</Alert>
            ) : (
              <Stepper activeStep={currentStep} alternativeLabel>
                {steps.map((step) => (
                  <Step key={step} completed={currentStep > steps.indexOf(step)}>
                    <StepLabel>{stepLabels[step]}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            )}
          </Paper>
          <Paper sx={{ p: { xs: 2, sm: 4 } }}>
            <Typography variant="h6" fontWeight="bold" mb={2}>Récapitulatif</Typography>
            <Stack spacing={1}>
              {order.items.map((item, index) => (
                <Box key={`${item.product_id}-${index}`} display="flex" justifyContent="space-between" gap={2}>
                  <Typography>{item.product_name} × {item.quantity}</Typography>
                  <Typography>{(item.unit_price * item.quantity).toFixed(2)}€</Typography>
                </Box>
              ))}
              <Box display="flex" justifyContent="space-between">
                <Typography>Mode de retrait</Typography>
                <Typography>{order.pickup_mode === 'onsite' ? 'Sur place' : 'À emporter'}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" pt={1}>
                <Typography fontWeight="bold">Montant total</Typography>
                <Typography fontWeight="bold">{order.total_amount.toFixed(2)}€</Typography>
              </Box>
            </Stack>
            <Typography variant="caption" color="text.secondary" display="block" mt={2}>
              Le statut est actualisé automatiquement.
            </Typography>
          </Paper>
        </Stack>
      )}
    </Box>
  );
};
