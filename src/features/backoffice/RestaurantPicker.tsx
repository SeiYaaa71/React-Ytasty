import React from 'react';
import { Chip, MenuItem, TextField } from '@mui/material';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import type { Restaurant } from '../../types/api';
import type { Id } from '../../types/backoffice';

interface RestaurantPickerProps {
  restaurants: Restaurant[];
  value: Id | null;
  locked: boolean;
  restaurant?: Restaurant;
  onChange: (id: Id) => void;
}

export const RestaurantPicker: React.FC<RestaurantPickerProps> = ({ restaurants, value, locked, restaurant, onChange }) => {
  if (locked) {
    return (
      <Chip
        icon={<StorefrontOutlinedIcon />}
        label={restaurant ? `${restaurant.name} (votre restaurant)` : 'Aucun restaurant rattaché'}
        color={restaurant ? 'primary' : 'default'}
        variant="outlined"
        sx={{ fontWeight: 700, py: 2.2, px: 0.5 }}
      />
    );
  }
  return (
    <TextField
      select
      size="small"
      label="Restaurant"
      value={value === null ? '' : String(value)}
      onChange={(event) => {
        const found = restaurants.find((item) => String(item.id) === event.target.value);
        if (found) onChange(found.id);
      }}
      sx={{ minWidth: 220 }}
    >
      {restaurants.map((item) => (
        <MenuItem key={item.id} value={String(item.id)}>{item.name}</MenuItem>
      ))}
    </TextField>
  );
};
