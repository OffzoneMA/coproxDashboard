// PieChart.js
import React, { useState, useEffect } from 'react';
import { Pie } from 'react-chartjs-2';
import { Typography, Paper } from '@mui/material';

const PieChart = () => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: [],
      },
    ],
  });

  useEffect(() => {
    // Replace this with your actual API fetch logic
    const fakeData = [
      { key: 'Category A', percentage: 30 },
      { key: 'Category B', percentage: 25 },
      { key: 'Category C', percentage: 45 },
    ];

    const data = {
      labels: [
        'Red',
        'Blue',
        'Yellow'
      ],
      datasets: [{
        label: 'My First Dataset',
        data: [300, 50, 100],
        backgroundColor: [
          'rgb(255, 99, 132)',
          'rgb(54, 162, 235)',
          'rgb(255, 205, 86)'
        ],
        hoverOffset: 4
      }]
    };
    
    setChartData(data);
  }, []);

  return (
    <Paper style={{ padding: 20, marginTop: 20 }}>
      <Typography variant="h6" gutterBottom>
        Pie Chart
      </Typography>
      <div style={{ width: '100%', height: '400px' }}>
        <Pie data={chartData} />
      </div>
    </Paper>
  );
};

export default PieChart;
