import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  TablePagination,
  TextField,
} from '@mui/material';

const PersonList = () => {
  const [personList, setPersonList] = useState([]);
  const [filteredPersonList, setFilteredPersonList] = useState([]);
  const [filterType, setFilterType] = useState('');
  const [filterText, setFilterText] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    // Fetch data from your API
    fetch('http://localhost:8081/person/getAllPersons')
      .then((response) => response.json())
      .then((data) => {
        setPersonList(data);
        setFilteredPersonList(data);
        setLoading(false); // Set loading to false when data fetch is complete
      })
      .catch((error) => {
        console.error('Error fetching data:', error);
        setLoading(false); // Set loading to false in case of an error
      });
  }, []);

  const handleFilter = (field, value) => {
    if (field === 'type') {
      setFilterType(value);
    }

    const filteredData = personList.filter(
      (item) =>
        (field === 'type' && (value === '' || item.type === value)) ||
        (field === 'search' &&
          (value === '' ||
            Object.values(item).some(
              (property) =>
                typeof property === 'string' &&
                property.toLowerCase().includes(value.toLowerCase())
            )))
    );

    setFilteredPersonList(filteredData);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <div className="container-main">
      <FormControl variant="outlined" style={{ marginBottom: '16px' }}>
        <InputLabel id="filter-type-label">Filter by Type</InputLabel>
        <Select
          labelId="filter-type-label"
          id="filter-type"
          value={filterType}
          onChange={(e) => handleFilter('type', e.target.value)}
          label="Filter by Type"
        >
          <MenuItem value="">
            <em>All</em>
          </MenuItem>
          <MenuItem value="proprietaire">Propriétaire</MenuItem>
          <MenuItem value="locataire">Locataire</MenuItem>
          {/* Add more types as needed */}
        </Select>
      </FormControl>

      <TextField
        id="search-input"
        label="Search"
        variant="outlined"
        value={filterText}
        onChange={(e) => {
          setFilterText(e.target.value);
          handleFilter('search', e.target.value);
        }}
        style={{ marginBottom: '16px' }}
      />

      {loading ? (
        <CircularProgress style={{ margin: '20px' }} />
      ) : (
        <div className="container-main">
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Nom</TableCell>
                  <TableCell>Prénom</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Appartement</TableCell>
                  {/* Add more headers as needed */}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPersonList
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((person) => (
                    <TableRow key={person._id}>
                      <TableCell>{person.id}</TableCell>
                      <TableCell>{person.nom}</TableCell>
                      <TableCell>{person.prenom}</TableCell>
                      <TableCell>{person.type}</TableCell>
                      <TableCell>{person.appartement}</TableCell>
                      {/* Add more cells as needed */}
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredPersonList.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </div>
      )}
    </div>
  );
};

export default PersonList;
