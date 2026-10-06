import React, { useEffect, useState } from 'react';
import { Box, Chip, Paper, Stack, Tab, Tabs, Tooltip, Typography } from '@mui/material';
import { getHealth } from '../../api/services';
import SoupKitchenOutlinedIcon from '@mui/icons-material/SoupKitchenOutlined';
import FastfoodOutlinedIcon from '@mui/icons-material/FastfoodOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import GroupAddOutlinedIcon from '@mui/icons-material/GroupAddOutlined';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../store';
import { RoleBadge } from '../../components/ui/RoleBadge';
import type { Role } from '../../types/backoffice';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactElement;
  roles: Role[];
}

export const BACKOFFICE_NAV: NavItem[] = [
  { to: '/backoffice/cuisine', label: 'Cuisine', icon: <SoupKitchenOutlinedIcon />, roles: ['staff', 'admin', 'direction'] },
  { to: '/backoffice/produits', label: 'Produits', icon: <FastfoodOutlinedIcon />, roles: ['staff', 'admin'] },
  { to: '/backoffice/restaurants', label: 'Restaurants', icon: <StorefrontOutlinedIcon />, roles: ['admin'] },
  { to: '/backoffice/utilisateurs', label: 'Utilisateurs', icon: <GroupAddOutlinedIcon />, roles: ['admin'] },
];

export const BackOfficeLayout: React.FC = () => {
  const location = useLocation();
  const user = useAppSelector((state) => state.auth.user);
  const items = BACKOFFICE_NAV.filter((item) => user && item.roles.includes(user.role));
  const current = items.find((item) => location.pathname.startsWith(item.to))?.to ?? false;
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);

  // Indicateur GET /health, vérifié toutes les 30 s.
  useEffect(() => {
    let active = true;
    const check = () => getHealth()
      .then(() => active && setApiOnline(true))
      .catch(() => active && setApiOnline(false));
    void check();
    const interval = window.setInterval(() => void check(), 30000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 1, mb: 2 }}>
        <Box>
          <Typography variant="overline" color="primary" fontWeight={800}>Back-office</Typography>
          <Typography variant="h4" component="h1" sx={{ lineHeight: 1.1 }}>
            Bonjour {user?.first_name ?? user?.username}
          </Typography>
        </Box>
        <Stack direction="row" sx={{ gap: 1, alignItems: 'center' }}>
          <Tooltip title="Résultat de GET /health">
            <Chip
              size="small"
              variant="outlined"
              color={apiOnline === null ? 'default' : apiOnline ? 'success' : 'error'}
              label={apiOnline === null ? 'API…' : apiOnline ? 'API en ligne' : 'API hors ligne'}
            />
          </Tooltip>
          {user && <RoleBadge role={user.role} size="medium" />}
        </Stack>
      </Stack>
      <Paper sx={{ mb: 3, px: 1 }}>
        <Tabs value={current} variant="scrollable" allowScrollButtonsMobile aria-label="Navigation back-office">
          {items.map((item) => (
            <Tab
              key={item.to}
              value={item.to}
              label={item.label}
              icon={item.icon}
              iconPosition="start"
              component={Link}
              to={item.to}
              sx={{ minHeight: 56, fontWeight: 700 }}
            />
          ))}
        </Tabs>
      </Paper>
      <Outlet />
    </Box>
  );
};
