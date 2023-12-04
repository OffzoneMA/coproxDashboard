import React from 'react';
import '../assets/styles/Sidebar.css';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Avatar from '@mui/material/Avatar';
import { Home } from '@mui/icons-material';

import { Link } from 'react-router-dom';

const Sidebar = () => {
  return (
    
     
    <Drawer variant="permanent" anchor="left">
      <List>
      <ListItem>
          <ListItemAvatar>
            <Avatar alt="Logo" src="https://www.coprox.immo/wp-content/uploads/2021/06/logo_coprox_baseline_degrade.png" />
          </ListItemAvatar>
        </ListItem>
        <ListItem button component={Link} to="/">
          <Home />
          <ListItemText primary="Dashboard" />
        </ListItem>
        <ListItem button component={Link} to="/trello">
          <ListItemText primary="Suivi Assemblées générales" />
        </ListItem>
        <ListItem button component={Link} to="/ag">
          <ListItemText primary="Mes copros" />
        </ListItem>
        {/* Add more list items as needed */}
      </List>
    </Drawer>
    
  );
}

export default Sidebar;