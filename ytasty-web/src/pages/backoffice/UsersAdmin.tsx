import React, { type FormEvent, useState } from 'react';
import {
  Alert, Box, Button, CircularProgress, IconButton, InputAdornment, List, ListItem, ListItemText, MenuItem, Paper, TextField, Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import { getErrorMessage } from '../../api/errors';
import { createUser } from '../../api/services';
import type { CreatedUser, Role, UserCreatePayload } from '../../types/backoffice';
import { ROLE_LABELS } from '../../constants';
import { useRestaurants } from '../../features/backoffice/useRestaurantScope';
import { useNotify } from '../../components/ui/NotificationProvider';
import { RoleBadge } from '../../components/ui/RoleBadge';

interface FormState {
  first_name: string;
  last_name: string;
  username: string;
  password: string;
  role: Role;
  restaurant_id: string;
}

const EMPTY: FormState = { first_name: '', last_name: '', username: '', password: '', role: 'staff', restaurant_id: '' };

const validate = (form: FormState) => {
  const errors: Partial<Record<keyof FormState, string>> = {};
  if (!form.first_name.trim()) errors.first_name = 'Prénom obligatoire.';
  if (!form.last_name.trim()) errors.last_name = 'Nom obligatoire.';
  if (!/^[a-zA-Z0-9._-]{3,}$/.test(form.username.trim())) errors.username = 'Au moins 3 caractères (lettres, chiffres, . _ -).';
  if (form.password.length < 8) errors.password = 'Au moins 8 caractères.';
  else if (!/[A-Z]/.test(form.password) || !/\d/.test(form.password) || !/[^a-zA-Z0-9]/.test(form.password)) {
    errors.password = 'Une majuscule, un chiffre et un caractère spécial minimum.';
  }
  if (form.role === 'staff' && !form.restaurant_id) errors.restaurant_id = 'Un membre du staff doit être rattaché à un restaurant.';
  return errors;
};

export const UsersAdmin: React.FC = () => {
  const notify = useNotify();
  const { restaurants } = useRestaurants();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [created, setCreated] = useState<CreatedUser[]>([]);

  const errors = validate(form);
  const fieldError = (key: keyof FormState) => (touched ? errors[key] : undefined);
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched(true);
    setError('');
    if (Object.keys(errors).length > 0) return;
    const restaurant = restaurants.find((item) => String(item.id) === form.restaurant_id);
    const payload: UserCreatePayload = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      username: form.username.trim(),
      password: form.password,
      role: form.role,
      restaurant_id: restaurant?.id ?? null,
    };
    setSaving(true);
    try {
      const user = await createUser(payload);
      setCreated((items) => [user ?? { ...payload, id: Date.now() }, ...items]);
      notify(`Compte ${payload.username} créé`, 'success');
      setForm(EMPTY);
      setTouched(false);
    } catch (saveError) {
      setError(getErrorMessage(saveError, 'Création du compte impossible.'));
    } finally {
      setSaving(false);
    }
  };

  const restaurantName = (id: unknown) => restaurants.find((item) => String(item.id) === String(id))?.name;

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 7 }}>
        <Paper component="form" onSubmit={handleSubmit} noValidate sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Créer un compte</Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Prénom" required fullWidth value={form.first_name} onChange={(e) => set('first_name', e.target.value)}
                error={Boolean(fieldError('first_name'))} helperText={fieldError('first_name')} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Nom" required fullWidth value={form.last_name} onChange={(e) => set('last_name', e.target.value)}
                error={Boolean(fieldError('last_name'))} helperText={fieldError('last_name')} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Identifiant" required fullWidth value={form.username} onChange={(e) => set('username', e.target.value)}
                autoComplete="off" error={Boolean(fieldError('username'))} helperText={fieldError('username')} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Mot de passe" required fullWidth value={form.password}
                type={showPassword ? 'text' : 'password'} autoComplete="new-password"
                onChange={(e) => set('password', e.target.value)}
                error={Boolean(fieldError('password'))} helperText={fieldError('password')}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword((v) => !v)} edge="end" aria-label="Afficher le mot de passe">
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField select label="Rôle" fullWidth value={form.role} onChange={(e) => set('role', e.target.value as Role)}>
                {(Object.keys(ROLE_LABELS) as Role[]).map((role) => (
                  <MenuItem key={role} value={role}>{ROLE_LABELS[role]}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select label="Restaurant" fullWidth value={form.restaurant_id}
                onChange={(e) => set('restaurant_id', e.target.value)}
                required={form.role === 'staff'}
                error={Boolean(fieldError('restaurant_id'))}
                helperText={fieldError('restaurant_id') ?? (form.role === 'staff' ? undefined : 'Optionnel pour admin / direction')}
              >
                <MenuItem value="">Aucun</MenuItem>
                {restaurants.map((restaurant) => (
                  <MenuItem key={restaurant.id} value={String(restaurant.id)}>{restaurant.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button type="submit" variant="contained" disabled={saving}
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <PersonAddAlt1Icon />}>
              Créer le compte
            </Button>
          </Box>
        </Paper>
      </Grid>
      <Grid size={{ xs: 12, md: 5 }}>
        <Paper sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="h6" sx={{ mb: 1 }}>Comptes créés</Typography>
          {created.length === 0 ? (
            <Typography variant="body2" color="text.secondary">Aucun compte créé pendant cette session.</Typography>
          ) : (
            <List dense>
              {created.map((user) => (
                <ListItem key={user.id} secondaryAction={<RoleBadge role={user.role} />} divider>
                  <ListItemText
                    primary={`${user.first_name} ${user.last_name} (${user.username})`}
                    secondary={restaurantName(user.restaurant_id) ?? 'Tous les restaurants'}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      </Grid>
    </Grid>
  );
};
