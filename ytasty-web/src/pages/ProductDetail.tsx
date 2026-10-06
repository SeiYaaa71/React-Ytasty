import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Grid, CardMedia, Paper, Chip } from '@mui/material';
import { apiClient } from '../api/client';
import { Product } from '../types/api';
import { useAppDispatch, useAppSelector } from '../store';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { addItem } from '../features/cart/cartSlice';

export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const activeRestaurant = useAppSelector((state) => state.restaurant.activeRestaurant);
  const cartRestaurantId = useAppSelector((state) => state.cart.restaurantId);
  const cartHasItems = useAppSelector((state) => state.cart.items.length > 0);
  const dispatch = useAppDispatch();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await apiClient.get<Product>(`/products/${id}`);
        setProduct(response.data);
      } catch (error) {
        console.error('Erreur detail produit', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) return <LoadingSkeleton count={1}/>;
  if (!product) return <Typography>Produit introuvable</Typography>;

  const disabled = !activeRestaurant || !activeRestaurant.is_open || !product.is_available ||
    product.restaurant_id !== activeRestaurant.id ||
    (cartHasItems && cartRestaurantId !== product.restaurant_id);

  return (
    <Paper sx={{ p: 4, mt: 3, borderRadius: 2 }}>
      <Button onClick={() => navigate('/carte')} sx={{ mb: 3 }}>
        ← Retour à la carte
      </Button>
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <CardMedia 
            component="img" 
            width="100%" 
            image={product.image || 'https://via.placeholder.com/500'} 
            alt={product.name} 
            sx={{ borderRadius: 2, filter: disabled ? 'grayscale(100%)' : 'none' }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="h3" gutterBottom fontWeight="bold">
            {product.name}
          </Typography>
          <Typography variant="h4" color="primary" gutterBottom fontWeight="bold">
            {product.price.toFixed(2)}€
          </Typography>
          
          <Box my={2}>
            <Chip label={product.category} color="secondary" size="small"/>
            {!product.is_available && (
              <Chip label="Indisponible" color="error" size="small" sx={{ ml: 1 }}/>
            )}
          </Box>

          <Typography variant="body1" paragraph color="text.secondary" sx={{ mt: 4, mb: 3 }}>
            {product.description}
          </Typography>

          {product.ingredients && product.ingredients.length > 0 && (
            <Box mb={4}>
              <Typography variant="h6" fontWeight="bold">Ingrédients :</Typography>
              <ul>
                {product.ingredients.map((ing, i) => (
                  <li key={i}><Typography>{ing}</Typography></li>
                ))}
              </ul>
            </Box>
          )}

          <Button 
            variant="contained" 
            color="primary" 
            size="large" 
            fullWidth 
            disabled={disabled} 
            onClick={() => {
              if (!activeRestaurant) return;
              dispatch(addItem({ product, restaurantIsOpen: activeRestaurant.is_open }));
              navigate('/panier');
            }}
          >
            {cartHasItems && cartRestaurantId !== product.restaurant_id
              ? 'Panier d’un autre restaurant'
              : disabled ? 'Indisponible' : 'Ajouter au panier'}
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
};
