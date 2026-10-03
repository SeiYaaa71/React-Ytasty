import React from 'react';
import { Box, Typography } from '@mui/material';

interface EmptyStateProps {
  message: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ message }) => {
  return (
    <Box sx={{ p: 4, textAlign: 'center', backgroundColor: 'background.paper', borderRadius: 2 }}>
      <Typography color="text.secondary" variant="h6">
        {message}
      </Typography>
    </Box>
  );
};
