import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { Provider } from 'react-redux';
import { store } from './store';
import { theme } from './theme/theme';
import { Layout } from './components/layout/Layout';

import { Home } from './pages/Home';
import { Catalog } from './pages/Catalog';
import { ProductDetail } from './pages/ProductDetail';
import { Cart } from './pages/Cart';
import { Checkout } from './pages/Checkout';
import { OrderConfirmation } from './pages/OrderConfirmation';
import { OrderTracking } from './pages/OrderTracking';
import { Login } from './pages/Login';
import { NotificationProvider } from './components/ui/NotificationProvider';
import { ProtectedRoute } from './features/auth/ProtectedRoute';
import { BackOfficeLayout } from './pages/backoffice/BackOfficeLayout';
import { KitchenDashboard } from './pages/backoffice/KitchenDashboard';
import { ProductsAdmin } from './pages/backoffice/ProductsAdmin';
import { RestaurantsAdmin } from './pages/backoffice/RestaurantsAdmin';
import { UsersAdmin } from './pages/backoffice/UsersAdmin';

export const App: React.FC = () => {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline/>
        <NotificationProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout/>}>
              <Route index element={<Home/>} />
              <Route path="carte" element={<Catalog/>} />
              <Route path="produit/:id" element={<ProductDetail/>} />
              
              <Route path="panier" element={<Cart/>} />
              <Route path="commande" element={<Checkout/>} />
              <Route path="confirmation" element={<OrderConfirmation/>} />
              <Route path="suivi" element={<OrderTracking/>} />
              <Route path="suivi/:order_number" element={<OrderTracking/>} />
              
              <Route path="login" element={<Login/>} />

              {/* Back-office (Dev C) */}
              <Route path="backoffice" element={<ProtectedRoute roles={['staff', 'admin', 'direction']}><BackOfficeLayout/></ProtectedRoute>}>
                <Route index element={<Navigate to="cuisine" replace/>} />
                <Route path="cuisine" element={<KitchenDashboard/>} />
                <Route path="produits" element={<ProtectedRoute roles={['staff', 'admin']}/>}>
                  <Route index element={<ProductsAdmin/>} />
                </Route>
                <Route path="restaurants" element={<ProtectedRoute roles={['admin']}/>}>
                  <Route index element={<RestaurantsAdmin/>} />
                </Route>
                <Route path="utilisateurs" element={<ProtectedRoute roles={['admin']}/>}>
                  <Route index element={<UsersAdmin/>} />
                </Route>
              </Route>
              <Route path="cuisine" element={<Navigate to="/backoffice/cuisine" replace/>} />
              <Route path="admin/produits" element={<Navigate to="/backoffice/produits" replace/>} />
            </Route>
          </Routes>
        </BrowserRouter>
        </NotificationProvider>
      </ThemeProvider>
    </Provider>
  );
};
