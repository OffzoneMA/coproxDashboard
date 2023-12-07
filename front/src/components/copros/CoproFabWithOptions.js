import React, { useState } from 'react';
import Fab from '@mui/material/Fab';
import AddIcon from '@mui/icons-material/Add';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';

const FabWithOptions = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setOpenDialog(false);
  };

  const handleOptionClick = (option) => {
    if (option === 'Option 1') {
      setOpenDialog(true);
    } else {
      // Handle other options
      console.log(`Selected option: ${option}`);
      handleClose();
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '16px', right: '16px' }}>
      <Fab color="primary" aria-label="add" onClick={handleClick}>
        <AddIcon />
      </Fab>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        getContentAnchorEl={null}
      >
        <MenuItem onClick={() => handleOptionClick('Option 1')}>Ajouter Une Copropriété</MenuItem>
        <MenuItem onClick={() => handleOptionClick('Option 2')}>Option 2</MenuItem>
        <MenuItem onClick={() => handleOptionClick('Option 3')}>Option 3</MenuItem>
      </Menu>

      <Dialog open={openDialog} onClose={handleClose}>
        <DialogTitle>Ajouter Une Copropriété</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ICI nous allons imaginer un formulaire pour créer une nouvelle copro
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default FabWithOptions;
