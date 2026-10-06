import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Alert, Box, Button, Typography } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { Link } from 'react-router-dom';
import { useAppSelector } from '../../store';
import type { Role } from '../../types/backoffice';

interface ProtectedRouteProps {
  /** Rôles autorisés. Sans valeur : tout utilisateur connecté. */
  roles?: Role[];
  children?: React.ReactNode;
}

/**
 * - non connecté          -> redirection vers /login (on garde la page demandée pour y revenir)
 * - connecté sans le rôle -> écran « accès refusé »
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ roles, children }) => {
  const user = useAppSelector((state) => state.auth.user);
  const location = useLocation();

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  if (roles && !roles.includes(user.role)) {
    return (
      <Box sx={{ maxWidth: 520, mx: 'auto', textAlign: 'center', py: 6 }}>
        <LockOutlinedIcon color="primary" sx={{ fontSize: 56 }} />
        <Typography variant="h4" gutterBottom>Accès refusé</Typography>
        <Alert severity="warning" sx={{ mb: 3, textAlign: 'left' }}>
          Cette page est réservée aux rôles : {roles.join(', ')}.
        </Alert>
        <Button component={Link} to="/backoffice/cuisine" variant="contained">Retour au back-office</Button>
      </Box>
    );
  }

  return children ? <>{children}</> : <Outlet />;
};
