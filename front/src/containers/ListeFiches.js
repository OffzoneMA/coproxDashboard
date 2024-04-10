import React, { useState, useEffect } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
} from '@mui/material';
import axios from 'axios';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { Link } from 'react-router-dom';

const FicheList = ({ onSetTitle }) => {
  // State variables
  const [coproId, setCoproId] = useState('');
  const [fiches, setFiches] = useState([]);
  const [copros, setCopros] = useState([]);
  const [selectedCopro, setSelectedCopro] = useState({});

  useEffect(() => {
    // Fetch copros
    onSetTitle('Suivi des Fiches de ren');
    axios.get(`${process.env.REACT_APP_BACKEND_URL}/copro/listCopro`)
      .then(response => {
        setCopros(response.data);
      })
      .catch(error => {
        console.error('Error fetching copros:', error);
      });
  }, []);

  useEffect(() => {
    // Fetch fiches by copro ID or all fiches if copro ID is empty
    if (coproId) {
      axios.get(`${process.env.REACT_APP_BACKEND_URL}/fiche/getFichesByCoproId/${coproId}`)
        .then(response => {
          setFiches(response.data);
        })
        .catch(error => {
          console.error('Error fetching fiches:', error);
        });
    } else {
      axios.get(`${process.env.REACT_APP_BACKEND_URL}/fiche/getAllFiches`)
        .then(response => {
          setFiches(response.data);
        })
        .catch(error => {
          console.error('Error fetching fiches:', error);
        });
    }
  }, [coproId]);

  const handleCoproIdInput = (event) => {
    setCoproId(event.target.value);
    const selectedCopro = copros.find(copro => copro._id === event.target.value);
    setSelectedCopro(selectedCopro);
  };

  return (
    <div className="container-main">
      <FormControl variant="outlined" style={{ marginBottom: '16px', width:'300px' }}>
        <InputLabel id="copro-id-select-label">Select Copro ID</InputLabel>
        <Select
          labelId="copro-id-select-label"
          id="copro-id-select"
          value={coproId}
          onChange={handleCoproIdInput}
          label="Select Copro ID"
        >
          {/* Replace with options for copro IDs */}
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          {copros.map((copro) => (
            <MenuItem key={copro._id} value={copro._id}>
              {copro.idCopro} - {copro.Nom}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {selectedCopro && selectedCopro.Nom && (
        <div>
          <strong>Selected Copro:</strong> {selectedCopro.Nom}
        </div>
      )}

      <Link to="/addfiches">
        <Button variant="contained" color="primary" startIcon={<AddCircleOutlineIcon />}>
          Add Fiche
        </Button>
      </Link>

      {fiches.length > 0 && (
        <TableContainer component={Paper} style={{ marginTop: '16px' }}>
          <Table>
            <TableHead>
              <TableRow>
                {/* Replace with column titles for fiches */}
                <TableCell>ID</TableCell>
                <TableCell>Prenom</TableCell>
                <TableCell>Nom</TableCell>
                <TableCell>Adresse</TableCell>
                <TableCell>Code Postal</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Telephone 1</TableCell>
                <TableCell>Telephone 2</TableCell>
                <TableCell>Ville</TableCell>
                <TableCell>Statut</TableCell>

              </TableRow>
            </TableHead>
            <TableBody>
              {fiches.map((fiche) => (
                <TableRow key={fiche._id}>
                  <TableCell>{fiche._id}</TableCell>
                  <TableCell>{fiche.prenom}</TableCell>
                  <TableCell>{fiche.nom}</TableCell>
                  <TableCell>{fiche.adresse}</TableCell>
                  <TableCell>{fiche.codepostale}</TableCell>
                  <TableCell>{fiche.email1}</TableCell>
                  <TableCell>{fiche.telephone1}</TableCell>
                  <TableCell>{fiche.telephone2}</TableCell>
                  <TableCell>{fiche.ville}</TableCell>
                  <TableCell>{fiche.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </div>
  );
};

export default FicheList;
