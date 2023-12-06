// CoproFilters.js
import React from 'react';
import { FormControl, InputLabel, Select, MenuItem, TextField } from '@mui/material';

const CoproFilters = ({ filterVille, handleFilter, villeOptions, searchTerm, handleSearch }) => {
  return (
    <div>
      <FormControl variant="outlined" style={{ marginBottom: '16px' }}>
        <InputLabel id="filter-ville-label">Filter by Ville</InputLabel>
        <Select
          labelId="filter-ville-label"
          id="filter-ville"
          value={filterVille}
          onChange={(e) => handleFilter('ville', e.target.value)}
          label="Filter by Ville"
        >
          <MenuItem value="">
            <em>All</em>
          </MenuItem>
          {villeOptions.map((ville) => (
            <MenuItem key={ville} value={ville}>
              {ville}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Search Input */}
      <TextField
        label="Search"
        variant="outlined"
        style={{ marginBottom: '16px' }}
        value={searchTerm}
        onChange={(e) => handleSearch(e.target.value)}
      />
    </div>
  );
};

export default CoproFilters;
