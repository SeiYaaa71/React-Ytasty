import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Product } from '../../types/api';

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CartState {
  items: CartItem[];
  restaurantId: string | null;
}

const isCartItem = (value: unknown): value is CartItem => {
  if (typeof value !== 'object' || value === null || !('product' in value) || !('quantity' in value)) {
    return false;
  }
  const { product, quantity } = value;
  return (
    typeof quantity === 'number' &&
    Number.isInteger(quantity) &&
    quantity > 0 &&
    typeof product === 'object' &&
    product !== null &&
    'id' in product &&
    typeof product.id === 'string' &&
    'name' in product &&
    typeof product.name === 'string' &&
    'price' in product &&
    typeof product.price === 'number' &&
    'is_available' in product &&
    typeof product.is_available === 'boolean' &&
    'restaurant_id' in product &&
    typeof product.restaurant_id === 'string'
  );
};

const loadCart = (): CartState => {
  try {
    const saved = localStorage.getItem('cart');
    if (saved) {
      const value: unknown = JSON.parse(saved);
      if (
        typeof value === 'object' &&
        value !== null &&
        'items' in value &&
        Array.isArray(value.items) &&
        value.items.every(isCartItem) &&
        'restaurantId' in value &&
        (typeof value.restaurantId === 'string' || value.restaurantId === null)
      ) {
        return { items: value.items, restaurantId: value.restaurantId };
      }
    }
  } catch (error) {
    console.error('Impossible de restaurer le panier enregistré.', error);
  }
  return { items: [], restaurantId: null };
};

const cartSlice = createSlice({
  name: 'cart',
  initialState: loadCart(),
  reducers: {
    addItem: (
      state,
      action: PayloadAction<{ product: Product; restaurantIsOpen: boolean }>,
    ) => {
      const { product, restaurantIsOpen } = action.payload;
      if (!product.is_available || !restaurantIsOpen) return;
      if (state.restaurantId && state.restaurantId !== product.restaurant_id) return;

      state.restaurantId = product.restaurant_id;
      const existingItem = state.items.find((item) => item.product.id === product.id);
      if (existingItem) existingItem.quantity += 1;
      else state.items.push({ product, quantity: 1 });
    },
    increment: (
      state,
      action: PayloadAction<{ productId: string; restaurantIsOpen: boolean }>,
    ) => {
      if (!action.payload.restaurantIsOpen) return;
      const item = state.items.find(({ product }) => product.id === action.payload.productId);
      if (item?.product.is_available) item.quantity += 1;
    },
    decrement: (state, action: PayloadAction<string>) => {
      const item = state.items.find(({ product }) => product.id === action.payload);
      if (!item) return;
      item.quantity -= 1;
      if (item.quantity <= 0) state.items = state.items.filter(({ product }) => product.id !== action.payload);
      if (state.items.length === 0) state.restaurantId = null;
    },
    removeItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(({ product }) => product.id !== action.payload);
      if (state.items.length === 0) state.restaurantId = null;
    },
    clearCart: () => ({ items: [], restaurantId: null }),
  },
});

export const { addItem, increment, decrement, removeItem, clearCart } = cartSlice.actions;
export const selectTotal = (state: { cart: CartState }) =>
  state.cart.items.reduce((total, item) => total + item.product.price * item.quantity, 0);
export const selectItemCount = (state: { cart: CartState }) =>
  state.cart.items.reduce((count, item) => count + item.quantity, 0);
export default cartSlice.reducer;
