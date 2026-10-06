import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Restaurant } from '../../types/api';

interface RestaurantState {
  activeRestaurant: Restaurant | null;
}

const savedRestaurant = localStorage.getItem('activeRestaurant');
const initialState: RestaurantState = {
  activeRestaurant: savedRestaurant ? JSON.parse(savedRestaurant) : null,
};

const restaurantSlice = createSlice({
  name: 'restaurant',
  initialState,
  reducers: {
    setActiveRestaurant: (state, action: PayloadAction<Restaurant>) => {
      state.activeRestaurant = action.payload;
      localStorage.setItem('activeRestaurant', JSON.stringify(action.payload));
    },
    clearActiveRestaurant: (state) => {
      state.activeRestaurant = null;
      localStorage.removeItem('activeRestaurant');
    },
  },
});

export const { setActiveRestaurant, clearActiveRestaurant } = restaurantSlice.actions;
export default restaurantSlice.reducer;
