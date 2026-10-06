import React from 'react';
import { Card, CardMedia, CardContent, Typography, CardActions, Button, Box } from '@mui/material';
import { Product } from '../../types/api';
import { Link } from 'react-router-dom';
import { getProductImage } from '../../utils/productImage';
import { PLACEHOLDER_IMAGE } from '../../constants';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  restaurantIsOpen: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart, restaurantIsOpen }) => {
  const disabled = !restaurantIsOpen || !product.is_available;

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardMedia 
        component="img" 
        height="200" 
        image={getProductImage(product)}
        alt={product.name} 
        onError={(event: React.SyntheticEvent<HTMLImageElement>) => {
          event.currentTarget.src = PLACEHOLDER_IMAGE;
        }}
        sx={{ filter: disabled ? 'grayscale(100%)' : 'none' }}
      />
      <CardContent sx={{ flexGrow: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Typography gutterBottom variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
            <Link to={`/produit/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              {product.name}
            </Link>
          </Typography>
          <Typography variant="h6" color="primary.main" fontWeight="bold">
            {product.price.toFixed(2)}€
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {product.description}
        </Typography>
        {!product.is_available && (
          <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1, fontWeight: 'bold' }}>
            Produit indisponible
          </Typography>
        )}
      </CardContent>
      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button 
          variant="contained" 
          color="primary" 
          fullWidth 
          disabled={disabled} 
          onClick={() => onAddToCart(product)}
        >
          {disabled ? 'Indisponible' : 'Ajouter au panier'}
        </Button>
      </CardActions>
    </Card>
  );
};
