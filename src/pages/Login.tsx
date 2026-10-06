import React, { type FormEvent, useEffect, useState } from 'react';
import {
  Alert, Box, Button, CircularProgress, IconButton, InputAdornment, Paper, Stack, TextField, Typography,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store';
import { clearAuthError, loginUser } from '../features/auth/authSlice';
import { useNotify } from '../components/ui/NotificationProvider';
import { BACKOFFICE_NAV } from './backoffice/BackOfficeLayout';
import type { Role } from '../types/backoffice';

const DEFAULT_PAGE = '/backoffice/cuisine';

/** Page de retour après connexion : la page demandée seulement si le rôle y a accès. */
const targetFor = (from: string | undefined, role: Role) => {
  if (!from || from === '/login') return DEFAULT_PAGE;
  const item = BACKOFFICE_NAV.find((nav) => from.startsWith(nav.to));
  if (item && !item.roles.includes(role)) return DEFAULT_PAGE;
  return from;
};

const USERNAME_PATTERN = /^[a-zA-Z0-9._-]+$/;

const validate = (username: string, password: string) => {
  const errors: { username?: string; password?: string } = {};
  if (!username.trim()) errors.username = 'L’identifiant est obligatoire.';
  else if (username.trim().length < 3) errors.username = 'Au moins 3 caractères.';
  else if (!USERNAME_PATTERN.test(username.trim())) errors.username = 'Lettres, chiffres, point, tiret ou underscore uniquement.';
  if (!password) errors.password = 'Le mot de passe est obligatoire.';
  else if (password.length < 6) errors.password = 'Au moins 6 caractères.';
  return errors;
};

export const Login: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const notify = useNotify();
  const { user, status, error } = useAppSelector((state) => state.auth);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState(false);

  const from = (location.state as { from?: string } | null)?.from;
  const errors = validate(username, password);
  const hasErrors = Object.keys(errors).length > 0;

  useEffect(() => () => {
    dispatch(clearAuthError());
  }, [dispatch]);

  if (user) return <Navigate to={targetFor(from, user.role)} replace />;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched(true);
    if (hasErrors) return;
    const result = await dispatch(loginUser({ username: username.trim(), password }));
    if (loginUser.fulfilled.match(result)) {
      notify(`Bienvenue ${result.payload.user.username} !`, 'success');
      navigate(targetFor(from, result.payload.user.role), { replace: true });
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: { xs: 2, md: 6 } }}>
      <Paper component="form" onSubmit={handleSubmit} noValidate sx={{ p: { xs: 3, sm: 5 }, width: '100%', maxWidth: 440 }}>
        <Stack spacing={3}>
          <Box sx={{ textAlign: 'center' }}>
            <Box sx={{ width: 56, height: 56, borderRadius: '50%', bgcolor: 'primary.main', color: '#fff', display: 'grid', placeItems: 'center', mx: 'auto', mb: 2 }}>
              <LockOutlinedIcon />
            </Box>
            <Typography variant="h4" component="h1">Espace équipe</Typography>
            <Typography color="text.secondary">Connexion staff, admin ou direction</Typography>
          </Box>

          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label="Identifiant"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            autoFocus
            required
            fullWidth
            error={touched && Boolean(errors.username)}
            helperText={touched ? errors.username : undefined}
          />
          <TextField
            label="Mot de passe"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
            fullWidth
            error={touched && Boolean(errors.password)}
            helperText={touched ? errors.password : undefined}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                      onClick={() => setShowPassword((value) => !value)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
          <Button type="submit" variant="contained" size="large" disabled={status === 'loading'}>
            {status === 'loading' ? <CircularProgress size={24} color="inherit" /> : 'Se connecter'}
          </Button>
          <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
            Compte de démonstration : <strong>admin123</strong> / <strong>Admin@123456</strong>
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
};
