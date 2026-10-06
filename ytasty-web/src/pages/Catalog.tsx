import React, { useEffect, useState } from 'react';
import { Grid, TextField, Box, FormControlLabel, Switch, Chip, Alert, Snackbar } from '@mui/material';
import { apiClient } from '../api/client';
import { Product } from '../types/api';
import { useAppDispatch, useAppSelector } from '../store';
import { ProductCard } from '../components/ui/ProductCard';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { Navigate } from 'react-router-dom';
import { addItem } from '../features/cart/cartSlice';

export const Catalog: React.FC = () => {
  const activeRestaurant = useAppSelector((state) => state.restaurant.activeRestaurant);
  const cartRestaurantId = useAppSelector((state) => state.cart.restaurantId);
  const dispatch = useAppDispatch();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartNotice, setCartNotice] = useState('');
  const [cartNoticeSeverity, setCartNoticeSeverity] = useState<'success' | 'warning'>('success');
  
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState<string>('');
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    if (!activeRestaurant) return;

    const fetchProducts = async () => {
      setLoading(true);
      try {
        let url = `/products?restaurant_id=${activeRestaurant.id}`;
        if (debouncedSearch) url += `&q=${debouncedSearch}`;
        if (category) url += `&category=${category}`;
        if (onlyAvailable) url += `&is_available=true`;

        const response = await apiClient.get<Product[]>(url);
        setProducts(response.data);
      } catch (error) {
        console.error('Erreur API catalogue', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [activeRestaurant, debouncedSearch, category, onlyAvailable]);

  if (!activeRestaurant) return <Navigate replace to="/"/>;

  const handleAddToCart = (product: Product) => {
    if (!activeRestaurant) return;
    if (cartRestaurantId && cartRestaurantId !== activeRestaurant.id) {
      setCartNoticeSeverity('warning');
      setCartNotice('Votre panier contient des produits d’un autre restaurant.');
      return;
    }
    dispatch(addItem({ product, restaurantIsOpen: activeRestaurant.is_open }));
    setCartNoticeSeverity('success');
    setCartNotice('Produit ajouté au panier.');
  };

  return (
    <Box>
      <Box p={3} mb={4} bgcolor="background.paper" borderRadius={2} boxShadow={1}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField 
              fullWidth 
              label="Rechercher un produit..." 
              variant="outlined" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={5}>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {['Burger', 'Boisson', 'Dessert', 'Accompagnement'].map((cat) => (
                <Chip 
                  key={cat} 
                  label={cat} 
                  onClick={() => setCategory(category === cat ? '' : cat)}
                  color={category === cat ? 'primary' : 'default'}
                  variant={category === cat ? 'filled' : 'outlined'}
                />
              ))}
            </Box>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControlLabel 
              control={<Switch color="primary" checked={onlyAvailable} onChange={(e) => setOnlyAvailable(e.target.checked)}/>}
              label="Disponibles uniquement"
            />
          </Grid>
        </Grid>
      </Box>

      {loading ? (
        <LoadingSkeleton count={6}/>
      ) : products.length === 0 ? (
        <EmptyState message="Aucun produit ne correspond à vos filtres."/>
      ) : (
        <Grid container spacing={3}>
          {products.map((product) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
              <ProductCard product={product} onAddToCart={handleAddToCart} restaurantIsOpen={activeRestaurant.is_open}/>
            </Grid>
          ))}
        </Grid>
      )}
      <Snackbar open={Boolean(cartNotice)} autoHideDuration={2500} onClose={() => setCartNotice('')}>
        <Alert severity={cartNoticeSeverity} onClose={() => setCartNotice('')}>{cartNotice}</Alert>
      </Snackbar>
    </Box>
  );
};
