import React, { useEffect } from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemText, ListItemSecondaryAction, Switch, Divider, Button } from '@mui/material';

const Settings = ({ onSetTitle }) => {
  useEffect(() => {
    onSetTitle('Settings');
  }, [onSetTitle]);

  return (
    <Box maxWidth="md">
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6">General Settings</Typography>
        </Box>
        <Divider />
        <List>
          <ListItem>
            <ListItemText primary="Dark Mode" secondary="Enable dark mode for the dashboard" />
            <ListItemSecondaryAction>
              <Switch edge="end" />
            </ListItemSecondaryAction>
          </ListItem>
          <Divider component="li" />
          <ListItem>
            <ListItemText primary="Email Notifications" secondary="Receive daily summary emails" />
            <ListItemSecondaryAction>
              <Switch edge="end" defaultChecked />
            </ListItemSecondaryAction>
          </ListItem>
        </List>
      </Paper>

      <Paper sx={{ mb: 3 }}>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6">Cron Job Configuration</Typography>
        </Box>
        <Divider />
        <Box sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary" paragraph>
                Manage automated tasks and synchronization schedules.
            </Typography>
            <Button variant="outlined" color="primary">
                Manage Cron Jobs
            </Button>
        </Box>
      </Paper>

      <Paper>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6">System</Typography>
        </Box>
        <Divider />
        <List>
            <ListItem>
                <ListItemText primary="Version" secondary="1.0.0" />
            </ListItem>
             <Divider component="li" />
            <ListItem>
                <ListItemText primary="Cache" secondary="Clear local application cache" />
                <ListItemSecondaryAction>
                    <Button color="error" size="small">Clear</Button>
                </ListItemSecondaryAction>
            </ListItem>
        </List>
      </Paper>
    </Box>
  );
};

export default Settings;
