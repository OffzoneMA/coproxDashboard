// src/components/ChecklistItemsList.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
require('dotenv').config(); // Load environment variables from .env

const ChecklistItemsList = ({ onSelectChange }) => {
  const [checklistItems, setChecklistItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState('');

  useEffect(() => {
    // Fetch checklist items from the backend endpoint
    axios.get(`${process.env.BACKEND_URL}/trello/checklist-items`)
      .then((response) => {
        setChecklistItems(response.data);
      })
      .catch((error) => {
        console.error('Error fetching checklist items:', error.message);
      });
  }, []);

  const handleSelectChange = (event) => {
    const value = event.target.value;
    setSelectedItem(value);
    onSelectChange(value);
  };

  return (
    <div>
      <h2>Checklist Items List</h2>

      <FormControl fullWidth variant="outlined">
        <InputLabel id="select-task-label">Sélectionner la tâche</InputLabel>
        <Select
          labelId="select-task-label"
          label="Sélectionner la tâche"
          value={selectedItem}
          onChange={handleSelectChange}
        >
          {checklistItems.map((item, index) => (
            <MenuItem key={index} value={item}>
              {item}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </div>
  );
};

export default ChecklistItemsList;
