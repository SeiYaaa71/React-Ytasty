import React from 'react';
import { Skeleton, Grid, Card, CardContent } from '@mui/material';

export const LoadingSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <Grid container spacing={3}>
      {Array.from(new Array(count)).map((_, index) => (
        <Grid item key={index} md={4} sm={6} xs={12}>
          <Card>
            <Skeleton height={200} variant="rectangular"/>
            <CardContent>
              <Skeleton height={30} variant="text" width="80%"/>
              <Skeleton height={20} variant="text" width="60%"/>
              <Skeleton height={40} sx={{ mt: 2 }} variant="text" width="40%"/>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};
