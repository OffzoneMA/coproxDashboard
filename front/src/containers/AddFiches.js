import React, { useState, useEffect } from 'react';
import {
  TextareaAutosize,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import axios from 'axios';
import Papa from 'papaparse';

const addFiches = () => {
  // State variables
  const [csvText, setCsvText] = useState('');
  const [apiVariables, setApiVariables] = useState([]);
  const [selectedVariableId, setSelectedVariableId] = useState(''); // Add this state variable
  const [selectedVariable, setSelectedVariable] = useState('');
  const [previewData, setPreviewData] = useState([]);
  const [notification, setNotification] = useState(''); // Add this state variable


  // Define the column titles
  const columnTitles = [
    'prenom','nom','adresse','codepostale','email1','email2','telephone1','telephone2','ville'
  ];

  useEffect(() => {
    // Fetch API variables
    axios.get(`${process.env.REACT_APP_BACKEND_URL}/copro/listCopro`)
      .then(response => {
        setApiVariables(response.data);
      })
      .catch(error => {
        console.error('Error fetching API variables:', error);
      });
  }, []);

  const handleCsvInput = (event) => {
    setCsvText(event.target.value);
  };

  const handleVariableSelect = (event) => {
    const selectedVariable = apiVariables.find(variable => variable._id === event.target.value);
    setSelectedVariable(selectedVariable ? `${selectedVariable.idCopro} - ${selectedVariable.Nom}` : '');
    setSelectedVariableId(event.target.value); // Set selectedVariableId
  };

  const handlePreview = () => {
    if (!selectedVariableId) { // Check if selectedVariableId is not empty
      alert('Please select an API variable');
      return;
    }
    const parsedData = Papa.parse(csvText, { header: true, skipEmptyLines: true }).data;
    console.log(parsedData); // log parsed data
    setPreviewData(parsedData);
  };
  const handleSave = () => {
    // Convert previewData to a well-formed JSON object
    const jsonData = previewData.map(row => {
      const jsonRow = {};
      columnTitles.forEach(title => {
        jsonRow[title] = row[title];
      });
      jsonRow.idCopro = selectedVariableId ; // Add copro object with selectedVariableId
      jsonRow.status="Initié"
      return jsonRow;
    });
  
    // Send a POST request to save the data
    axios.post(`${process.env.REACT_APP_BACKEND_URL}/fiche/saveFiches`, jsonData)
      .then(response => {
        console.log('Data saved successfully:', response.data);
        setNotification('Data saved successfully'); // Set notification message
        setPreviewData([]); // Clear preview data
      })
      .catch(error => {
        console.error('Error saving data:', error);
        setNotification('Error saving data'); // Set notification message
      });
  };

  return (
    <div className="container-main">
      {notification && (
        <div style={{ color: notification.includes('Error') ? 'red' : 'green', marginTop: '16px' }}>
          {notification}
        </div>
      )}
      <FormControl variant="outlined" style={{ marginBottom: '16px',width:'300px' }}>
        <InputLabel id="variable-select-label">Select API Variable</InputLabel>
        <Select
          labelId="variable-select-label"
          id="variable-select"
          value={selectedVariableId} // Set value to selectedVariableId
          onChange={handleVariableSelect}
          label="Select API Variable"
        >
          {apiVariables.map((variable) => (
            <MenuItem key={variable._id} value={variable._id}>
          {`${variable.idCopro} - ${variable.Nom}`}
        </MenuItem>
      ))}
    </Select>
  </FormControl>

  <textarea
    aria-label="CSV Input"
    placeholder="Paste CSV text here"
    value={csvText}
    onChange={handleCsvInput}
    style={{ width: '100%', height: '200px', marginBottom: '16px' }} // fixed size
  />

  <Button variant="contained" color="primary" onClick={handlePreview}>
    Preview
  </Button>

  {previewData.length > 0 && (
    <>
      <Button variant="contained" color="primary" onClick={handleSave} style={{ marginLeft: '16px', marginTop: '16px' }}>
        Save
      </Button>
      <TableContainer component={Paper} style={{ marginTop: '16px' }}>
        <Table>
          <TableHead>
            <TableRow>
              {columnTitles.map((title) => (
                <TableCell key={title}>{title}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {previewData.map((row, index) => (
              <TableRow key={index}>
                {columnTitles.map((title) => (
                  <TableCell key={title}>{row[title]}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  )}
</div>
  );
};

export default addFiches;