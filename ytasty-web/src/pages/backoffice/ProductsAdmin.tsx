import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert, Avatar, Box, Button, Chip, IconButton, InputAdornment, MenuItem, Paper, Skeleton, Stack, Switch,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Tooltip, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SearchIcon from '@mui/icons-material/Search';
import { getErrorMessage } from '../../api/errors';
import {
  createProduct, deleteProduct, getProducts, setProductAvailability, updateProduct,
} from '../../api/services';
import type { Product } from '../../types/api';
import type { ProductPayload } from '../../types/backoffice';
import { CATEGORIES, PLACEHOLDER_IMAGE, getCategoryLabel } from '../../constants';
import { useAppSelector } from '../../store';
import { useNotify } from '../../components/ui/NotificationProvider';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useRestaurantScope } from '../../features/backoffice/useRestaurantScope';
import { RestaurantPicker } from '../../features/backoffice/RestaurantPicker';
import { ProductFormDialog } from '../../features/backoffice/ProductFormDialog';
import { formatPrice, sameId } from '../../utils/format';

export const ProductsAdmin: React.FC = () => {
  const notify = useNotify();
  const role = useAppSelector((state) => state.auth.user?.role);
  const isAdmin = role === 'admin';
  const { restaurants, restaurantId, restaurant, locked, setRestaurantId } = useRestaurantScope();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [toggling, setToggling] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (restaurantId === null) return;
    setLoading(true);
    try {
      setProducts(await getProducts({ restaurant_id: restaurantId }));
      setError('');
    } catch (loadError) {
      setError(getErrorMessage(loadError, 'Impossible de charger les produits.'));
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter((product) =>
      (!category || product.category.toLowerCase() === category.toLowerCase()) &&
      (!query || product.name.toLowerCase().includes(query) || product.ingredients?.some((i) => i.toLowerCase().includes(query))));
  }, [products, search, category]);

  const unavailableCount = products.filter((product) => !product.is_available).length;

  const handleToggle = async (product: Product) => {
    const id = String(product.id);
    setToggling(id);
    const next = !product.is_available;
    // Mise à jour optimiste : le switch réagit tout de suite.
    setProducts((items) => items.map((item) => (sameId(item.id, id) ? { ...item, is_available: next } : item)));
    try {
      const updated = await setProductAvailability(product.id, next);
      const merged = { ...product, ...(updated ?? {}), is_available: updated?.is_available ?? next };
      setProducts((items) => items.map((item) => (sameId(item.id, id) ? merged : item)));
      notify(`${product.name} : ${next ? 'disponible' : 'en rupture'}`, next ? 'success' : 'warning');
    } catch (toggleError) {
      setProducts((items) => items.map((item) => (sameId(item.id, id) ? product : item)));
      notify(getErrorMessage(toggleError, 'Impossible de modifier la disponibilité.'), 'error');
    } finally {
      setToggling(null);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    setFormOpen(true);
  };

  const handleSubmit = async (payload: ProductPayload) => {
    setSaving(true);
    try {
      if (editing) {
        const updated = await updateProduct(editing.id, payload);
        const merged = { ...editing, ...payload, ...(updated ?? {}) };
        setProducts((items) => items.map((item) => (sameId(item.id, editing.id) ? merged : item)));
        notify('Produit modifié', 'success');
      } else {
        await createProduct(payload);
        notify('Produit créé', 'success');
        await load();
      }
      setFormOpen(false);
    } catch (saveError) {
      notify(getErrorMessage(saveError, 'Enregistrement impossible.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteProduct(toDelete.id);
      setProducts((items) => items.filter((item) => !sameId(item.id, toDelete.id)));
      notify(`${toDelete.name} supprimé`, 'success');
      setToDelete(null);
    } catch (deleteError) {
      notify(getErrorMessage(deleteError, 'Suppression impossible.'), 'error');
    } finally {
      setDeleting(false);
    }
  };

  if (locked && restaurantId === null) {
    return <Alert severity="warning">Votre compte n’est rattaché à aucun restaurant.</Alert>;
  }

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} sx={{ gap: 2, alignItems: { md: 'center' } }}>
          <RestaurantPicker restaurants={restaurants} value={restaurantId} locked={locked} restaurant={restaurant} onChange={setRestaurantId} />
          <TextField
            size="small"
            placeholder="Rechercher…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> } }}
            sx={{ flexGrow: 1 }}
          />
          <TextField select size="small" label="Catégorie" value={category} onChange={(e) => setCategory(e.target.value)} sx={{ minWidth: 180 }}>
            <MenuItem value="">Toutes</MenuItem>
            {CATEGORIES.map((item) => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}
          </TextField>
          {isAdmin && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} sx={{ whiteSpace: 'nowrap' }}>
              Nouveau produit
            </Button>
          )}
        </Stack>
      </Paper>

      {!isAdmin && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Rupture d’un ingrédient ? Désactivez le produit : il sera grisé chez les clients.
        </Alert>
      )}
      {unavailableCount > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {unavailableCount} produit{unavailableCount > 1 ? 's' : ''} actuellement en rupture.
        </Alert>
      )}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table size="small" aria-label="Produits du restaurant">
          <TableHead>
            <TableRow>
              <TableCell>Produit</TableCell>
              <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Catégorie</TableCell>
              <TableCell align="right">Prix</TableCell>
              <TableCell align="center">Disponible</TableCell>
              {isAdmin && <TableCell align="right">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              [0, 1, 2, 3].map((row) => (
                <TableRow key={row}>
                  <TableCell colSpan={isAdmin ? 5 : 4}><Skeleton height={48} /></TableCell>
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 5 : 4} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                  Aucun produit.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((product) => (
                <TableRow key={product.id} hover sx={{ opacity: product.is_available ? 1 : 0.6 }}>
                  <TableCell>
                    <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5 }}>
                      <Avatar
                        variant="rounded"
                        src={product.image || PLACEHOLDER_IMAGE}
                        alt={product.name}
                        sx={{ width: 48, height: 48, filter: product.is_available ? 'none' : 'grayscale(100%)' }}
                      />
                      <Box>
                        <Typography fontWeight={700}>{product.name}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
                          {product.ingredients?.join(', ')}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                    <Chip label={getCategoryLabel(product.category)} size="small" color="secondary" />
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{formatPrice(product.price)}</TableCell>
                  <TableCell align="center">
                    <Switch
                      checked={product.is_available}
                      disabled={toggling === String(product.id)}
                      onChange={() => void handleToggle(product)}
                      color="success"
                      slotProps={{ input: { 'aria-label': `Disponibilité de ${product.name}` } }}
                    />
                  </TableCell>
                  {isAdmin && (
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                      <Tooltip title="Modifier">
                        <IconButton onClick={() => openEdit(product)} aria-label={`Modifier ${product.name}`}><EditOutlinedIcon /></IconButton>
                      </Tooltip>
                      <Tooltip title="Supprimer">
                        <IconButton color="error" onClick={() => setToDelete(product)} aria-label={`Supprimer ${product.name}`}><DeleteOutlineIcon /></IconButton>
                      </Tooltip>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <ProductFormDialog
        open={formOpen}
        product={editing}
        restaurants={restaurants}
        defaultRestaurantId={restaurantId}
        saving={saving}
        onClose={() => setFormOpen(false)}
        onSubmit={(payload) => void handleSubmit(payload)}
      />
      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Supprimer ce produit ?"
        message={`« ${toDelete?.name ?? ''} » sera retiré définitivement de la carte.`}
        confirmLabel="Supprimer"
        danger
        loading={deleting}
        onConfirm={() => void handleDelete()}
        onClose={() => setToDelete(null)}
      />
    </Box>
  );
};
