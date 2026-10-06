import React, { useState } from 'react';
import {
  Avatar, Box, Button, IconButton, ListItemIcon, Menu, MenuItem, Tooltip, Typography,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store';
import { logout } from './authSlice';
import { clearCart } from '../cart/cartSlice';
import { RoleBadge } from '../../components/ui/RoleBadge';
import { initials } from '../../utils/format';

/** Zone utilisateur du header quand on est connecté : avatar, nom, badge de rôle, déconnexion. */
export const UserMenu: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  if (!user) return null;

  const displayName = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username;

  const handleLogout = () => {
    setAnchor(null);
    dispatch(logout());
    dispatch(clearCart());
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <Button
        onClick={(event) => setAnchor(event.currentTarget)}
        color="inherit"
        sx={{ borderRadius: 999, pl: 0.5, pr: { xs: 0.5, md: 1.5 }, gap: 1, textTransform: 'none' }}
        aria-label="Menu utilisateur"
      >
        <Avatar sx={{ width: 36, height: 36, bgcolor: 'secondary.main', color: 'secondary.contrastText', fontWeight: 800, fontSize: '0.9rem' }}>
          {initials(displayName)}
        </Avatar>
        <Typography variant="body2" fontWeight={700} sx={{ display: { xs: 'none', md: 'block' } }}>
          {displayName}
        </Typography>
        <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
          <RoleBadge role={user.role} />
        </Box>
      </Button>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
        <MenuItem component={Link} to="/suivi" onClick={() => setAnchor(null)}>
          <ListItemIcon><LocalShippingOutlinedIcon fontSize="small" /></ListItemIcon>
          Suivre une commande
        </MenuItem>
        <MenuItem component={Link} to="/backoffice/cuisine" onClick={() => setAnchor(null)}>
          <ListItemIcon><DashboardOutlinedIcon fontSize="small" /></ListItemIcon>
          Back-office
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
          Déconnexion
        </MenuItem>
      </Menu>
      <Tooltip title="Déconnexion">
        <IconButton onClick={handleLogout} aria-label="Déconnexion" sx={{ display: { xs: 'none', lg: 'inline-flex' } }}>
          <LogoutIcon />
        </IconButton>
      </Tooltip>
    </Box>
  );
};
