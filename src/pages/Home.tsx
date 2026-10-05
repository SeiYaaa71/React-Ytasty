import React, { useEffect, useState } from 'react';
import { Grid, Card, CardContent, Typography, Button, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { Restaurant } from '../types/api';
import { useAppDispatch, useAppSelector } from '../store';
import { setActiveRestaurant } from '../features/restaurant/restaurantSlice';
import { clearCart } from '../features/cart/cartSlice';
import { StatusBadge } from '../components/ui/StatusBadge';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';

export const Home: React.FC = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const cart = useAppSelector((state) => state.cart);

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await apiClient.get<Restaurant[]>('/restaurants');
        setRestaurants(response.data);
      } catch (error) {
        console.error('Erreur lors de la récupération des restaurants', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurants();
  }, []);

  const handleSelectRestaurant = (restaurant: Restaurant) => {
    if (
      cart.items.length > 0 &&
      cart.restaurantId !== restaurant.id
    ) {
      const confirmed = window.confirm(
        'Changer de restaurant videra votre panier. Voulez-vous continuer ?',
      );
      if (!confirmed) return;
      dispatch(clearCart());
    }
    dispatch(setActiveRestaurant(restaurant));
    navigate('/carte');
  };

  if (loading) return <LoadingSkeleton count={3}/>;

  return (
    <Box>
      <Typography variant="h3" align="center" gutterBottom fontWeight="bold">
        Choisissez votre restaurant
      </Typography>
      <Grid container spacing={4} mt={2}>
        {restaurants.map((restaurant) => (
          <Grid item xs={12} md={4} key={restaurant.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
              <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                <Typography variant="h5" gutterBottom fontWeight="bold">
                  {restaurant.name}
                </Typography>
                <Typography color="text.secondary" gutterBottom>
                  {restaurant.address}, {restaurant.city}
                </Typography>
                <Box mt={2} mb={3}>
                  <StatusBadge isOpen={restaurant.is_open}/>
                </Box>
                <Button 
                  variant="contained" 
                  size="large" 
                  fullWidth 
                  disabled={!restaurant.is_open} 
                  onClick={() => handleSelectRestaurant(restaurant)}
                >
                  {restaurant.is_open ? 'Commander ici' : 'Actuellement fermé'}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};
