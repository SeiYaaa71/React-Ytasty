import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import restaurantReducer from '../features/restaurant/restaurantSlice';

// Mocks temporaires pour B et C
const dummyCartReducer = (state = { itemCount: 0 }, action: any) => state;
const dummyAuthReducer = (state = { user: null }, action: any) => state;

export const store = configureStore({
  reducer: {
    restaurant: restaurantReducer,
    cart: dummyCartReducer,
    auth: dummyAuthReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
