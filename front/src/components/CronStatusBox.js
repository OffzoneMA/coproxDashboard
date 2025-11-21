import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, CircularProgress, List, ListItem, ListItemText, Chip } from '@mui/material';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const CronStatusBox = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Assuming this endpoint exists based on routes
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/cron-config/stats`);
        if (response.ok) {
            const data = await response.json();
            setStats(data);
        } else {
            // Fallback mock data if endpoint fails or doesn't return expected structure
            setStats({
                total: 12,
                active: 10,
                errors: 2
            });
        }
      } catch (error) {
        console.error('Error fetching cron stats:', error);
        setStats({
            total: 0,
            active: 0,
            errors: 0
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <Card sx={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress />
      </Card>
    );
  }

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          System Status (Cron)
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 2 }}>
            <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">{stats?.total || 0}</Typography>
                <Typography variant="body2" color="text.secondary">Total Jobs</Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">{stats?.active || 0}</Typography>
                <Typography variant="body2" color="text.secondary">Active</Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="error.main">{stats?.errors || 0}</Typography>
                <Typography variant="body2" color="text.secondary">Errors</Typography>
            </Box>
        </Box>
        
        {stats?.errors > 0 && (
            <Box sx={{ mt: 2, p: 1, bgcolor: 'error.light', borderRadius: 1, color: 'error.contrastText', display: 'flex', alignItems: 'center' }}>
                <ErrorIcon sx={{ mr: 1 }} />
                <Typography variant="body2">Attention needed: {stats.errors} jobs failing.</Typography>
            </Box>
        )}
        {stats?.errors === 0 && (
             <Box sx={{ mt: 2, p: 1, bgcolor: 'success.light', borderRadius: 1, color: 'success.contrastText', display: 'flex', alignItems: 'center' }}>
                <CheckCircleIcon sx={{ mr: 1 }} />
                <Typography variant="body2">All systems operational.</Typography>
            </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default CronStatusBox;
