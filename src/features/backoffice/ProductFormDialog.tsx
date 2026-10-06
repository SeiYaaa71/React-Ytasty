import React, { type FormEvent, useEffect, useState } from 'react';
import {
  Autocomplete, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, InputAdornment, MenuItem, Switch, TextField,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import type { Product, Restaurant } from '../../types/api';
import type { Id, ProductPayload } from '../../types/backoffice';
import { CATEGORIES, PLACEHOLDER_IMAGE } from '../../constants';
import { getProductImage } from '../../utils/productImage';

interface ProductFormDialogProps {
  open: boolean;
  product: Product | null;
  restaurants: Restaurant[];
  defaultRestaurantId: Id | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (payload: ProductPayload) => void;
}

interface FormState {
  name: string;
  description: string;
  category: string;
  price: string;
  image_url: string;
  restaurant_id: string;
  ingredients: string[];
  is_available: boolean;
}

const emptyForm = (restaurantId: Id | null): FormState => ({
  name: '',
  description: '',
  category: CATEGORIES[0].value,
  price: '',
  image_url: '',
  restaurant_id: restaurantId === null ? '' : String(restaurantId),
  ingredients: [],
  is_available: true,
});

const fromProduct = (product: Product): FormState => ({
  name: product.name,
  description: product.description ?? '',
  category: product.category,
  price: String(product.price),
  image_url: getProductImage(product),
  restaurant_id: String(product.restaurant_id),
  ingredients: product.ingredients ?? [],
  is_available: product.is_available,
});

const validate = (form: FormState) => {
  const errors: Partial<Record<keyof FormState, string>> = {};
  if (form.name.trim().length < 2) errors.name = 'Au moins 2 caractères.';
  const price = Number(form.price.replace(',', '.'));
  if (!form.price || Number.isNaN(price) || price <= 0) errors.price = 'Prix supérieur à 0 obligatoire.';
  if (!form.category) errors.category = 'Catégorie obligatoire.';
  if (!form.restaurant_id) errors.restaurant_id = 'Restaurant obligatoire.';
  if (form.image_url && !/^https?:\/\/.+/i.test(form.image_url.trim())) errors.image_url = 'Lien http(s) attendu.';
  return errors;
};

export const ProductFormDialog: React.FC<ProductFormDialogProps> = ({
  open, product, restaurants, defaultRestaurantId, saving, onClose, onSubmit,
}) => {
  const [form, setForm] = useState<FormState>(() => emptyForm(defaultRestaurantId));
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(product ? fromProduct(product) : emptyForm(defaultRestaurantId));
      setTouched(false);
    }
  }, [open, product, defaultRestaurantId]);

  const errors = validate(form);
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched(true);
    if (Object.keys(errors).length > 0) return;
    const restaurant = restaurants.find((item) => String(item.id) === form.restaurant_id);
    onSubmit({
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category,
      price: Math.round(Number(form.price.replace(',', '.')) * 100) / 100,
      image_url: form.image_url.trim(),
      restaurant_id: restaurant?.id ?? form.restaurant_id,
      ingredients: form.ingredients.map((item) => item.trim()).filter(Boolean),
      is_available: form.is_available,
    });
  };

  const fieldError = (key: keyof FormState) => (touched ? errors[key] : undefined);

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="md" fullWidth>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <DialogTitle sx={{ fontWeight: 800 }}>{product ? `Modifier « ${product.name} »` : 'Nouveau produit'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 8 }}>
                  <TextField
                    label="Nom" required fullWidth value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                    error={Boolean(fieldError('name'))} helperText={fieldError('name')}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    label="Prix" required fullWidth value={form.price}
                    onChange={(e) => set('price', e.target.value)}
                    error={Boolean(fieldError('price'))} helperText={fieldError('price')}
                    slotProps={{
                      input: { endAdornment: <InputAdornment position="end">€</InputAdornment> },
                      htmlInput: { inputMode: 'decimal' },
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    select label="Catégorie" required fullWidth value={form.category}
                    onChange={(e) => set('category', e.target.value)}
                    error={Boolean(fieldError('category'))} helperText={fieldError('category')}
                  >
                    {CATEGORIES.map((category) => (
                      <MenuItem key={category.value} value={category.value}>{category.label}</MenuItem>
                    ))}
                    {!CATEGORIES.some((category) => category.value === form.category) && form.category && (
                      <MenuItem value={form.category}>{form.category}</MenuItem>
                    )}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    select label="Restaurant" required fullWidth value={form.restaurant_id}
                    onChange={(e) => set('restaurant_id', e.target.value)}
                    error={Boolean(fieldError('restaurant_id'))} helperText={fieldError('restaurant_id')}
                  >
                    {restaurants.map((restaurant) => (
                      <MenuItem key={restaurant.id} value={String(restaurant.id)}>{restaurant.name}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={12}>
                  <TextField
                    label="Description" fullWidth multiline minRows={2} value={form.description}
                    onChange={(e) => set('description', e.target.value)}
                  />
                </Grid>
                <Grid size={12}>
                  <Autocomplete
                    multiple
                    freeSolo
                    options={[] as string[]}
                    value={form.ingredients}
                    onChange={(_, value) => set('ingredients', value)}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => {
                        const { key, ...tagProps } = getTagProps({ index });
                        return <Chip key={key} label={option} size="small" {...tagProps} />;
                      })
                    }
                    renderInput={(params) => (
                      <TextField {...params} label="Ingrédients" placeholder="Tapez puis Entrée" helperText="Appuyez sur Entrée après chaque ingrédient" />
                    )}
                  />
                </Grid>
                <Grid size={12}>
                  <TextField
                    label="Lien de l’image" fullWidth value={form.image_url} placeholder="https://…"
                    onChange={(e) => set('image_url', e.target.value)}
                    error={Boolean(fieldError('image_url'))} helperText={fieldError('image_url')}
                  />
                </Grid>
              </Grid>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Box
                component="img"
                src={form.image_url || PLACEHOLDER_IMAGE}
                alt="Aperçu"
                onError={(event: React.SyntheticEvent<HTMLImageElement>) => {
                  event.currentTarget.src = PLACEHOLDER_IMAGE;
                }}
                sx={{ width: '100%', aspectRatio: '4 / 3', objectFit: 'cover', borderRadius: 3, border: 1, borderColor: 'divider' }}
              />
              <FormControlLabel
                sx={{ mt: 2 }}
                control={<Switch checked={form.is_available} onChange={(e) => set('is_available', e.target.checked)} />}
                label={form.is_available ? 'Disponible' : 'Indisponible'}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} color="inherit" disabled={saving}>Annuler</Button>
          <Button type="submit" variant="contained" disabled={saving} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}>
            {product ? 'Enregistrer' : 'Créer le produit'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};
