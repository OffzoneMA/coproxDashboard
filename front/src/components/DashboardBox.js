// Your DashboardBox component
import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';

const DashboardBox = ({ title, data }) => {
  return (
    <Card 
      elevation={3} 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center',
        borderRadius: 2,
        transition: 'transform 0.2s',
        '&:hover': {
          transform: 'scale(1.02)',
          boxShadow: 6,
        }
      }}
    >
      <CardContent sx={{ textAlign: 'center' }}>
        <Typography variant="h6" component="div" gutterBottom color="text.secondary">
          {title}
        </Typography>
        <Typography variant="h3" component="div" color="primary.main" fontWeight="bold">
          {data}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default DashboardBox;
