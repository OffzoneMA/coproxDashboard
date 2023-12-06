// Your DashboardBox component
import React from 'react';
import { Card, CardContent, Typography } from '@mui/material';
import '../assets/styles/DashboardBox.css';

const DashboardBox = ({ title, data }) => {
  return (
    <Card elevation={3} className="dashboard-box">
      <CardContent>
        <div className="title-area">
          <Typography variant="h6">{title}</Typography>
        </div>
        <div className="data-area">
          <Typography variant="h4" className="number-style">
            {data}
          </Typography>
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardBox;
