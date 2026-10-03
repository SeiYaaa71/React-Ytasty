import React from 'react';
import { AppBar, Toolbar, Typography, Button, Badge, Box, Container } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../store';
import { clearActiveRestaurant } from '../../features/restaurant/restaurantSlice';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const activeRestaurant = useAppSelector((state) => state.restaurant.activeRestaurant);
  const cartItemCount = useAppSelector((state: any) => state.cart.itemCount);
  const user = useAppSelector((state: any) => state.auth.user);

  const handleChangeRestaurant = () => {
    dispatch(clearActiveRestaurant());
    navigate('/');
  };

  return (
    <AppBar position="sticky" color="inherit" elevation={1}>
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box display="flex" alignItems="center" gap={3}>
            <Typography variant="h5" component={Link} to="/" sx={{ textDecoration: 'none', color: 'primary.main', fontWeight: 900 }}>
              FASTFOOD
            </Typography>
            {activeRestaurant && (
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
                  Restaurant: <strong>{activeRestaurant.name}</strong>
                </Typography>
                <Button variant="outlined" size="small" onClick={handleChangeRestaurant}>
                  Changer
                </Button>
              </Box>
            )}
          </Box>

          <Box display="flex" alignItems="center" gap={2}>
            {activeRestaurant && (
              <Button color="inherit" component={Link} to="/panier">
                Panier
                <Badge badgeContent={cartItemCount} color="primary" sx={{ ml: 1 }}/>
              </Button>
            )}
            {user ? (
              <Button variant="contained" color="secondary" component={Link} to="/cuisine">
                Back-Office
              </Button>
            ) : (
              <Button color="inherit" component={Link} to="/login">
                Connexion
              </Button>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};
