import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert, Badge, Box, Button, Card, CardActions, CardContent, Chip, CircularProgress, Divider, FormControlLabel, IconButton, Paper, Skeleton, Stack, Switch, ToggleButton, ToggleButtonGroup, Tooltip, Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { keyframes } from '@mui/material/styles';
import RefreshIcon from '@mui/icons-material/Refresh';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import BoltIcon from '@mui/icons-material/Bolt';
import { getErrorMessage } from '../../api/errors';
import { cancelOrder, getProducts, getRestaurantOrders, updateOrderStatus } from '../../api/services';
import type { Order, OrderStatus, Product } from '../../types/api';
import {
  LATE_ORDER_MINUTES, NEXT_STATUS, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS, PICKUP_LABELS,
} from '../../constants';
import { useNotify } from '../../components/ui/NotificationProvider';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useRestaurantScope } from '../../features/backoffice/useRestaurantScope';
import { RestaurantPicker } from '../../features/backoffice/RestaurantPicker';
import { SOCKET_EVENTS, useSocketEvent, useSocketStatus } from '../../realtime/socket';
import { formatElapsed, formatPrice, formatTime, minutesSince, sameId } from '../../utils/format';
import { playNotificationSound } from '../../utils/sound';

const COLUMNS: OrderStatus[] = ['pending', 'validated', 'preparing', 'ready'];
type Filter = 'all' | OrderStatus;

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(214, 40, 40, 0.45); }
  70% { box-shadow: 0 0 0 12px rgba(214, 40, 40, 0); }
  100% { box-shadow: 0 0 0 0 rgba(214, 40, 40, 0); }
`;

interface OrderCardProps {
  order: Order;
  now: number;
  isNew: boolean;
  busy: boolean;
  productNames: Map<string, string>;
  onAdvance: (order: Order) => void;
  onCancel: (order: Order) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, now, isNew, busy, productNames, onAdvance, onCancel }) => {
  const minutes = minutesSince(order.created_at, now);
  const late = order.status === 'pending' && minutes >= LATE_ORDER_MINUTES;
  const next = NEXT_STATUS[order.status];

  return (
    <Card
      sx={{
        borderLeft: 6,
        borderLeftColor: late ? 'error.main' : `${ORDER_STATUS_COLORS[order.status] === 'default' ? 'grey.400' : `${ORDER_STATUS_COLORS[order.status]}.main`}`,
        animation: late || isNew ? `${pulse} 1.6s infinite` : 'none',
        '&:hover': { transform: 'none' },
      }}
    >
      <CardContent sx={{ pb: 1 }}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
          <Box>
            <Typography variant="h6" sx={{ lineHeight: 1.1 }}>#{order.order_number}</Typography>
            <Typography variant="body2" color="text.secondary">{order.customer_name}</Typography>
          </Box>
          <Stack sx={{ alignItems: 'flex-end', gap: 0.5 }}>
            {isNew && <Chip label="Nouvelle" color="primary" size="small" />}
            <Chip label={PICKUP_LABELS[order.pickup_mode] ?? order.pickup_mode} size="small" variant="outlined" />
          </Stack>
        </Stack>

        <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5, mt: 1, color: late ? 'error.main' : 'text.secondary' }}>
          {late ? <WarningAmberIcon fontSize="small" /> : <AccessTimeIcon fontSize="small" />}
          <Typography variant="caption" fontWeight={late ? 800 : 500}>
            {formatTime(order.created_at)} · {formatElapsed(minutes)}
            {late && ' · en attente depuis trop longtemps'}
          </Typography>
        </Stack>

        <Divider sx={{ my: 1.5 }} />
        <Stack spacing={0.5}>
          {order.items.map((item, index) => (
            <Stack key={`${item.product_id}-${index}`} direction="row" sx={{ justifyContent: 'space-between', gap: 1 }}>
              <Typography variant="body2">
                <strong>{item.quantity}×</strong>{' '}
                {item.product_name || productNames.get(String(item.product_id)) || `Produit ${item.product_id}`}
              </Typography>
            </Stack>
          ))}
        </Stack>
        <Typography variant="body2" sx={{ mt: 1, textAlign: 'right', fontWeight: 700 }}>
          {formatPrice(order.total_amount)}
        </Typography>
      </CardContent>
      <CardActions sx={{ px: 2, pb: 2, gap: 1 }}>
        {next && (
          <Button
            variant="contained"
            size="small"
            fullWidth
            disabled={busy}
            onClick={() => onAdvance(order)}
            startIcon={busy ? <CircularProgress size={14} color="inherit" /> : undefined}
          >
            {next.action}
          </Button>
        )}
        <Button size="small" color="error" disabled={busy} onClick={() => onCancel(order)} sx={{ flexShrink: 0 }}>
          Annuler
        </Button>
      </CardActions>
    </Card>
  );
};

export const KitchenDashboard: React.FC = () => {
  const notify = useNotify();
  const { restaurants, restaurantId, restaurant, locked, setRestaurantId } = useRestaurantScope();
  const liveConnected = useSocketStatus();
  const [orders, setOrders] = useState<Order[]>([]);
  const [productNames, setProductNames] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [busyOrder, setBusyOrder] = useState<string | null>(null);
  const [toCancel, setToCancel] = useState<Order | null>(null);
  const [soundOn, setSoundOn] = useState(true);
  const [newOrders, setNewOrders] = useState<Set<string>>(new Set());
  const [now, setNow] = useState(() => Date.now());
  const knownOrders = useRef<Set<string> | null>(null);
  const soundRef = useRef(soundOn);

  useEffect(() => {
    soundRef.current = soundOn;
  }, [soundOn]);

  // Horloge pour recalculer les délais d'attente.
  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(interval);
  }, []);

  const flagNewOrders = useCallback((numbers: string[]) => {
    if (numbers.length === 0) return;
    setNewOrders((current) => new Set([...current, ...numbers]));
    if (soundRef.current) playNotificationSound();
    notify(numbers.length > 1 ? `${numbers.length} nouvelles commandes !` : `Nouvelle commande #${numbers[0]} !`, 'info');
    window.setTimeout(() => {
      setNewOrders((current) => {
        const copy = new Set(current);
        numbers.forEach((number) => copy.delete(number));
        return copy;
      });
    }, 15000);
  }, [notify]);

  const loadOrders = useCallback(async (initial = false) => {
    if (restaurantId === null) return;
    if (initial) setLoading(true);
    try {
      const data = await getRestaurantOrders(restaurantId);
      setOrders(data);
      setError('');
      const numbers = data.map((order) => String(order.order_number));
      if (knownOrders.current) {
        const fresh = data
          .filter((order) => order.status === 'pending' && !knownOrders.current?.has(String(order.order_number)))
          .map((order) => String(order.order_number));
        flagNewOrders(fresh);
      }
      knownOrders.current = new Set(numbers);
    } catch (loadError) {
      setError(getErrorMessage(loadError, 'Impossible de charger les commandes.'));
    } finally {
      if (initial) setLoading(false);
    }
  }, [restaurantId, flagNewOrders]);

  // Chargement initial + rafraîchissement périodique (filet de sécurité si le temps réel est coupé).
  useEffect(() => {
    knownOrders.current = null;
    void loadOrders(true);
    const interval = window.setInterval(() => void loadOrders(false), liveConnected ? 60000 : 10000);
    return () => window.clearInterval(interval);
  }, [loadOrders, liveConnected]);

  // Noms des produits (si l'API ne les renvoie pas dans les lignes de commande).
  useEffect(() => {
    if (restaurantId === null) return;
    getProducts({ restaurant_id: restaurantId })
      .then((products: Product[]) => setProductNames(new Map(products.map((p) => [String(p.id), p.name]))))
      .catch(() => undefined);
  }, [restaurantId]);

  // Option A : réception instantanée des nouvelles commandes.
  const room = restaurantId !== null ? `restaurant:${restaurantId}` : null;
  useSocketEvent<Order>(room, SOCKET_EVENTS.ORDER_CREATED, (order) => {
    if (!sameId(order.restaurant_id, restaurantId)) return;
    const number = String(order.order_number);
    setOrders((current) => (current.some((o) => String(o.order_number) === number) ? current : [...current, order]));
    knownOrders.current?.add(number);
    flagNewOrders([number]);
  });
  useSocketEvent<Order>(room, SOCKET_EVENTS.ORDER_STATUS_UPDATED, (order) => {
    setOrders((current) => current.map((o) => (String(o.order_number) === String(order.order_number) ? order : o)));
  });

  const replaceOrder = (updated: Order) => {
    setOrders((current) => current.map((o) => (String(o.order_number) === String(updated.order_number) ? { ...o, ...updated } : o)));
  };

  const handleAdvance = async (order: Order) => {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    const number = String(order.order_number);
    setBusyOrder(number);
    try {
      const updated = await updateOrderStatus(number, next.status);
      replaceOrder(updated ?? { ...order, status: next.status });
      notify(`Commande #${number} : ${ORDER_STATUS_LABELS[next.status]}`, 'success');
    } catch (actionError) {
      notify(getErrorMessage(actionError, 'Impossible de changer le statut.'), 'error');
    } finally {
      setBusyOrder(null);
    }
  };

  const handleCancel = async () => {
    if (!toCancel) return;
    const number = String(toCancel.order_number);
    setBusyOrder(number);
    try {
      const updated = await cancelOrder(number);
      replaceOrder(updated ?? { ...toCancel, status: 'cancelled' });
      notify(`Commande #${number} annulée`, 'warning');
      setToCancel(null);
    } catch (actionError) {
      notify(getErrorMessage(actionError, 'Impossible d’annuler la commande.'), 'error');
    } finally {
      setBusyOrder(null);
    }
  };

  const grouped = useMemo(() => {
    const map = new Map<OrderStatus, Order[]>(COLUMNS.map((status) => [status, []]));
    [...orders]
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .forEach((order) => map.get(order.status)?.push(order));
    return map;
  }, [orders]);

  const lateCount = (grouped.get('pending') ?? []).filter((o) => minutesSince(o.created_at, now) >= LATE_ORDER_MINUTES).length;
  const visibleColumns = filter === 'all' ? COLUMNS : COLUMNS.filter((status) => status === filter);

  if (locked && restaurantId === null) {
    return <Alert severity="warning">Votre compte n’est rattaché à aucun restaurant. Contactez un administrateur.</Alert>;
  }

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} sx={{ gap: 2, alignItems: { md: 'center' }, justifyContent: 'space-between' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 2, alignItems: { sm: 'center' } }}>
            <RestaurantPicker
              restaurants={restaurants}
              value={restaurantId}
              locked={locked}
              restaurant={restaurant}
              onChange={setRestaurantId}
            />
            <ToggleButtonGroup
              size="small"
              exclusive
              value={filter}
              onChange={(_, value: Filter | null) => value && setFilter(value)}
              sx={{ flexWrap: 'wrap' }}
            >
              <ToggleButton value="all">Toutes</ToggleButton>
              {COLUMNS.map((status) => (
                <ToggleButton key={status} value={status}>{ORDER_STATUS_LABELS[status]}</ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Stack>
          <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
            <Chip
              icon={<BoltIcon />}
              label={liveConnected ? 'Temps réel' : 'Actualisation auto'}
              color={liveConnected ? 'success' : 'default'}
              size="small"
              variant="outlined"
            />
            <FormControlLabel
              control={<Switch size="small" checked={soundOn} onChange={(e) => setSoundOn(e.target.checked)} />}
              label="Son"
            />
            <Tooltip title="Rafraîchir">
              <IconButton onClick={() => void loadOrders(false)} aria-label="Rafraîchir les commandes">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {lateCount > 0 && (
        <Alert severity="error" icon={<WarningAmberIcon />} sx={{ mb: 2, fontWeight: 600 }}>
          {lateCount} commande{lateCount > 1 ? 's' : ''} en attente depuis plus de {LATE_ORDER_MINUTES} minutes !
        </Alert>
      )}
      {restaurant && !restaurant.is_open && (
        <Alert severity="info" sx={{ mb: 2 }}>Le restaurant est actuellement fermé aux nouvelles commandes.</Alert>
      )}

      <Grid container spacing={2}>
        {visibleColumns.map((status) => {
          const columnOrders = grouped.get(status) ?? [];
          return (
            <Grid key={status} size={{ xs: 12, sm: 6, lg: filter === 'all' ? 3 : 12 }}>
              <Paper sx={{ p: 1.5, bgcolor: '#FFF3E3', minHeight: { lg: 400 } }} elevation={0}>
                <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', px: 1, pb: 1.5 }}>
                  <Typography variant="subtitle1" fontWeight={800}>{ORDER_STATUS_LABELS[status]}</Typography>
                  <Badge badgeContent={columnOrders.length} color={ORDER_STATUS_COLORS[status] === 'default' ? 'primary' : ORDER_STATUS_COLORS[status]} showZero sx={{ mr: 1.5 }} />
                </Stack>
                <Stack spacing={1.5}>
                  {loading ? (
                    [0, 1].map((key) => <Skeleton key={key} variant="rounded" height={170} />)
                  ) : columnOrders.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                      Aucune commande
                    </Typography>
                  ) : (
                    columnOrders.map((order) => (
                      <OrderCard
                        key={order.order_number}
                        order={order}
                        now={now}
                        isNew={newOrders.has(String(order.order_number))}
                        busy={busyOrder === String(order.order_number)}
                        productNames={productNames}
                        onAdvance={(o) => void handleAdvance(o)}
                        onCancel={setToCancel}
                      />
                    ))
                  )}
                </Stack>
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      <ConfirmDialog
        open={Boolean(toCancel)}
        title={`Annuler la commande #${toCancel?.order_number ?? ''} ?`}
        message="Le client verra sa commande comme annulée. Cette action est définitive."
        confirmLabel="Annuler la commande"
        danger
        loading={busyOrder !== null}
        onConfirm={() => void handleCancel()}
        onClose={() => setToCancel(null)}
      />
    </Box>
  );
};
