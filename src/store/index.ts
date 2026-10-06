import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import restaurantReducer from '../features/restaurant/restaurantSlice';
import cartReducer from '../features/cart/cartSlice';
import authReducer from '../features/auth/authSlice';

export const store = configureStore({
  reducer: {
    restaurant: restaurantReducer,
    cart: cartReducer,
    auth: authReducer,
  },
});

store.subscribe(() => {
  localStorage.setItem('cart', JSON.stringify(store.getState().cart));
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
