import React from 'react';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Avatar from '@mui/material/Avatar';
import { Home,Groups,Apartment,Task } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import '../assets/styles/Sidebar.css';

const Sidebar = () => {
  return (
    
     
    <Drawer className="drawer" variant="permanent" anchor="left">
      <List>
      <ListItem>

          <ListItemAvatar className="drawer-avatar">
          <img alt="Logo" src="https://www.coprox.immo/wp-content/uploads/2021/06/logo_coprox_baseline_degrade.png" />
          </ListItemAvatar>
        </ListItem>

        <ListItem button component={Link} to="/">
          <Home  className="drawer-icon" />
          <ListItemText primary="Dashboard" />
        </ListItem>
        
        
        <ListItem button component={Link} to="/trello">
        <Task className="drawer-icon"/>
          <ListItemText primary="Assemblées générales" />
        </ListItem>
        
        <ListItem button component={Link} to="/copro">
          <Apartment  className="drawer-icon"/>
          <ListItemText primary="Mes copros" />
        </ListItem>
        <ListItem button component={Link} to="/listefiches">
          <Apartment  className="drawer-icon"/>
          <ListItemText primary="Fiches d'informations" />
        </ListItem>
        
        <ListItem button component={Link} to="/clients">
          <Groups  className="drawer-icon"/>
          <ListItemText primary="Mes Clients" />
        </ListItem>

        {/* Add more list items as needed */}
      </List>
    </Drawer>
    
  );
}

export default Sidebar;