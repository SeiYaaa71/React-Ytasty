import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Box, Container } from '@mui/material';

export const Layout: React.FC = () => {
  return (
    <Box display="flex" flexDirection="column" minHeight="100vh">
      <Header/>
      <Box component="main" sx={{ flexGrow: 1, py: 4, backgroundColor: 'background.default' }}>
        <Container maxWidth="xl">
          <Outlet/>
        </Container>
      </Box>
    </Box>
  );
};
