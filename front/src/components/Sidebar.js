import React from 'react';
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Box, useTheme, useMediaQuery } from '@mui/material';
import { Home, Groups, Apartment, Task, Settings } from '@mui/icons-material';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = ({ mobileOpen, handleDrawerToggle, drawerWidth }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();

  const drawerContent = (
    <div>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <img 
          alt="Logo" 
          src="https://www.coprox.immo/wp-content/uploads/2021/06/logo_coprox_baseline_degrade.png" 
          style={{ maxWidth: '100%', height: 'auto', maxHeight: '80px' }}
        />
      </Box>
      <List>
        <ListItem disablePadding>
          <ListItemButton component={Link} to="/" selected={location.pathname === '/'}>
            <ListItemIcon>
              <Home />
            </ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItemButton>
        </ListItem>
        
        <ListItem disablePadding>
          <ListItemButton component={Link} to="/trello" selected={location.pathname === '/trello'}>
            <ListItemIcon>
              <Task />
            </ListItemIcon>
            <ListItemText primary="Assemblées générales" />
          </ListItemButton>
        </ListItem>
        
        <ListItem disablePadding>
          <ListItemButton component={Link} to="/copro" selected={location.pathname === '/copro'}>
            <ListItemIcon>
              <Apartment />
            </ListItemIcon>
            <ListItemText primary="Mes copros" />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton component={Link} to="/listefiches" selected={location.pathname === '/listefiches'}>
            <ListItemIcon>
              <Apartment />
            </ListItemIcon>
            <ListItemText primary="Fiches d'informations" />
          </ListItemButton>
        </ListItem>
        
        <ListItem disablePadding>
          <ListItemButton component={Link} to="/clients" selected={location.pathname === '/clients'}>
            <ListItemIcon>
              <Groups />
            </ListItemIcon>
            <ListItemText primary="Mes Clients" />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton component={Link} to="/scripts" selected={location.pathname === '/scripts'}>
            <ListItemIcon>
              <Groups />
            </ListItemIcon>
            <ListItemText primary="Les Scripts" />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton component={Link} to="/settings" selected={location.pathname === '/settings'}>
            <ListItemIcon>
              <Settings />
            </ListItemIcon>
            <ListItemText primary="Settings" />
          </ListItemButton>
        </ListItem>
      </List>
    </div>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
    >
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
      >
        {drawerContent}
      </Drawer>
      
      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
}

export default Sidebar;