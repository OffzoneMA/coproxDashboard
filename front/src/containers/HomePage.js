// HomePage.js
import React, { useState, useEffect } from 'react';
import { Grid, CircularProgress, Box, Typography, Button, Paper } from '@mui/material';
import DashboardBox from '../components/DashboardBox';
import CronStatusBox from '../components/CronStatusBox';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';

function HomePage({ onSetTitle }) {
  const [coproWithoutAGCount, setCoproWithoutAGCount] = useState(null);
  const [nonResolvedTicketsCount, setNonResolvedTicketsCount] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const responseCoproWithoutAG = await fetch( `${process.env.REACT_APP_BACKEND_URL}/copro/coprowithoutag`);
        const dataCoproWithoutAG = await responseCoproWithoutAG.json();
        setCoproWithoutAGCount(dataCoproWithoutAG.count);

        const responseNonResolvedTickets = await fetch( `${process.env.REACT_APP_BACKEND_URL}/zendesk/non-resolved-tickets/count`);
        const dataNonResolvedTickets = await responseNonResolvedTickets.json();
        setNonResolvedTicketsCount(dataNonResolvedTickets[0].value);

        // Pass the title to the parent component
        onSetTitle('Dashboard Coprox');
      } catch (error) {
        console.error('Error fetching data:', error.message);
        setCoproWithoutAGCount(0);
        setNonResolvedTicketsCount(0);
      }
    };

    fetchData();
  }, [onSetTitle]);

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Quick Actions Section */}
      <Box sx={{ mb: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button variant="contained" startIcon={<AddIcon />}>
          Nouvelle Copro
        </Button>
        <Button variant="outlined" startIcon={<RefreshIcon />}>
          Actualiser Données
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Key Metrics */}
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <DashboardBox title="AG à lancer ce mois" data={5} />
        </Grid>
        
        <Grid item xs={12} sm={6} md={4} lg={3}>
          {coproWithoutAGCount === null ? (
            <CircularProgress />
          ) : (
            <DashboardBox title="Copropriétés sans AG" data={coproWithoutAGCount} />
          )}
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={3}>
          {nonResolvedTicketsCount === null ? (
            <CircularProgress />
          ) : (
            <DashboardBox title="Ticket Zendesk en cours" data={nonResolvedTicketsCount} />
          )}
        </Grid>

        {/* System Status */}
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <CronStatusBox />
        </Grid>

        {/* Additional Placeholders / Future Widgets */}
        <Grid item xs={12} md={8}>
           <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>Recent Activity</Typography>
              <Typography variant="body2" color="text.secondary">
                No recent activity to display.
              </Typography>
           </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
           <DashboardBox title="Clients Actifs" data={480} />
        </Grid>
      </Grid>
    </Box>
  );
}

export default HomePage;
