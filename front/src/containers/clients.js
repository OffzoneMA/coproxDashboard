import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  Button,
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
    fetch(`${process.env.REACT_APP_BACKEND_URL}/person/getAllPersonsWithCoppro`)
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

  const exportToCSV = () => {
    const csvRows = [];
    const headers = ['ID', 'Nom', 'Prénom', 'Type', 'Copro', 'Lien Vilogi'];
    csvRows.push(headers.join(','));

    filteredPersonList.forEach(person => {
      const row = [
        person.idVilogi,
        person.nom,
        person.prenom,
        person.mail,
        person.mobile,
        person.typePersonne,
        person.coproDetails.idCopro,
        `${window.location.origin}${person.url}`, // Assuming person.url is a relative path
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = `data:text/csv;charset=utf-8,${csvRows.join('\n')}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'person_list.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        <Button
          variant="contained"
          color="primary"
          onClick={exportToCSV}
          style={{ marginBottom: '16px', marginLeft: '16px' }}
        >
          Export to CSV
        </Button>
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
                  <TableCell>Mail</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Copro</TableCell>
                  <TableCell>Lien Vilogi</TableCell> {/* Add a new column for Copro Details */}
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
                      <TableCell>{person.email}</TableCell>
                      <TableCell>{person.typePersonne}</TableCell>
                      <TableCell>{person.coproDetails.idCopro}</TableCell>
                      <TableCell>
                        <Link to={`${person.url}`}>Voir plus</Link>
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