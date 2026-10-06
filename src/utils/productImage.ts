import type { Product } from '../types/api';
import { PLACEHOLDER_IMAGE } from '../constants';

export const getProductImage = (product: Product) =>
  product.image_url || product.image || PLACEHOLDER_IMAGE;
