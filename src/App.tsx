import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { Provider } from 'react-redux';
import { store } from './store';
import { theme } from './theme/theme';
import { Layout } from './components/layout/Layout';

import { Home } from './pages/Home';
import { Catalog } from './pages/Catalog';
import { ProductDetail } from './pages/ProductDetail';

// Pages vides pour les autres devs
const Cart = () => <div>Page Panier (Dev B)</div>;
const Checkout = () => <div>Tunnel Commande (Dev B)</div>;
const OrderConfirmation = () => <div>Confirmation (Dev B)</div>;
const OrderTracking = () => <div>Suivi Commande (Dev B)</div>;
const Login = () => <div>Login (Dev C)</div>;
const Kitchen = () => <div>Cuisine Kanban (Dev C)</div>;
const AdminProducts = () => <div>Admin Produits (Dev C)</div>;

export const App: React.FC = () => {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline/>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout/>}>
              <Route index element={<Home/>} />
              <Route path="carte" element={<Catalog/>} />
              <Route path="produit/:id" element={<ProductDetail/>} />
              
              <Route path="panier" element={<Cart/>} />
              <Route path="commande" element={<Checkout/>} />
              <Route path="confirmation" element={<OrderConfirmation/>} />
              <Route path="suivi/:order_number?" element={<OrderTracking/>} />
              
              <Route path="login" element={<Login/>} />
              <Route path="cuisine" element={<Kitchen/>} />
              <Route path="admin/produits" element={<AdminProducts/>} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  );
};
