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
    // Fetch person data from your API
    fetch(`${process.env.REACT_APP_BACKEND_URL}/person/getAllPersons`)
      .then((response) => response.json())
      .then(async (personData) => {
        // Fetch and merge copro details for each person
        const personWithCoproDetails = await Promise.all(
          personData.map(async (person) => {
            const coproResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/copro/detailsCopro/${person.idCopro}`);
            const coproData = await coproResponse.json();
            return { ...person, coproDetails: coproData };
          })
        );
        setPersonList(personWithCoproDetails);
        setFilteredPersonList(personWithCoproDetails);
        setLoading(false); // Set loading to false when data fetch is complete
      })
      .catch((error) => {
        console.error('Error fetching data:', error);
        setLoading(false); // Set loading to false in case of an error
      });
  }, []);

  const handleFilter = () => {
    const filteredData = personList.filter((item) => {
      const matchesType = filterType === '' || item.typePersonne === filterType;
      const matchesSearch =
        filterText === '' ||
        Object.values(item).some(
          (property) =>
            typeof property === 'string' &&
            property.toLowerCase().includes(filterText.toLowerCase())
        );
      return matchesType && matchesSearch;
    });

    setFilteredPersonList(filteredData);
  };

  useEffect(() => {
    handleFilter();
  }, [filterType, filterText]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <div className="container-main">
      <div>
        <FormControl variant="outlined" style={{ marginBottom: '16px', width: '200px' }}>
          <InputLabel id="filter-type-label">Filter by Type</InputLabel>
          <Select
            labelId="filter-type-label"
            id="filter-type"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            label="Filter by Type"
          >
            <MenuItem value="">
              <em>Tous</em>
            </MenuItem>
            <MenuItem value="PROPRIETAIRE">Propriétaire</MenuItem>
            <MenuItem value="LOCATAIRE">Locataire</MenuItem>
            <MenuItem value="CS">Conseil Syndical</MenuItem>
          </Select>
        </FormControl>

        <TextField
          id="search-input"
          label="Search"
          variant="outlined"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          style={{ marginBottom: '16px' }}
        />
      </div>

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
                  <TableCell>Copro Details</TableCell> {/* Add a new column for Copro Details */}
                </TableRow>
              </TableHead>
              <TableBody>
                
                {filteredPersonList
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((person) => (
                    <TableRow key={person._id}>
                      <TableCell>{person.idVilogi}</TableCell>
                      <TableCell>{person.nom}</TableCell>
                      <TableCell>{person.prenom}</TableCell>
                      <TableCell>{person.typePersonne}</TableCell>
                      <TableCell>{person.idCopro}</TableCell>
                      <TableCell>
                        {/* Display Copro details, you can format this as needed */}
                        {person.coproDetails ? person.coproDetails.someProperty : 'N/A'}
                      </TableCell>
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