import React from 'react';
import { Chip } from '@mui/material';

interface StatusBadgeProps {
  isOpen: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ isOpen }) => {
  return (
    <Chip 
      label={isOpen ? 'Ouvert' : 'Fermé'} 
      color={isOpen ? 'success' : 'error'} 
      size="small" 
      sx={{ fontWeight: 'bold' }} 
    />
  );
};
