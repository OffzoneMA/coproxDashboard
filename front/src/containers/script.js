// TrelloPage.js
import React, { useState, useEffect } from 'react';
import { fetchDataFromApi } from '@src/utils/api';
import { Table, Select, MenuItem, Chip,TableBody, TableCell, Button, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';

function TrelloPage({ onSetTitle }) {
    const [selectedOptions, setSelectedOptions] = useState({});
    const rows = [
        { name: "Synchronisation informations copropriété", endpoint: "script/synchroCopro", options: [] },
        { name: "Synchronisation Travaux", endpoint: "script/synchroTravaux", options: [] },
        { name: "Synchronisation Contrat Entretien", endpoint: "script/synchroContratEntretien", options: [] },
        { name: "Lancement gestion chauffage", endpoint: "script/campagneChauffage", options: [{ value: "2", label: "Activation" }, { value: "3", label: "Desactivation" }] },
    ];

    const handleButtonClick = async (endpoint) => {
        const selectedOption = selectedOptions[endpoint];
        const row = rows.find(row => row.endpoint === endpoint);
        if ((selectedOption && row.options.length > 0) || row.options.length === 0) {
            try {
                const response = await fetchDataFromApi(endpoint, { method: 'POST', body: JSON.stringify({ option: selectedOption }) });
                const data = await response.json();
                console.log("API response:", data);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        } else {
            alert("Please select an option first!");
        }
    };

    const handleSelectChange = (event, endpoint) => {
        setSelectedOptions(prevOptions => ({
            ...prevOptions,
            [endpoint]: event.target.value
        }));
    };

    useEffect(() => {
        onSetTitle('Les scripts');
        return () => {
            onSetTitle('');
        };
    }, [onSetTitle]);

    return (
        <div className="container-main">
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>Nom</TableCell>
                            <TableCell>Option</TableCell>
                            <TableCell>Date de lancement </TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows.map((row, index) => (
                            <TableRow key={index}>
                                <TableCell></TableCell>
                                <TableCell>{row.name}</TableCell>
                                {row.options.length > 0 ? (
                                    <TableCell>
                                        <Select
                                            labelId={`demo-simple-select-label-${index}`}
                                            id={`demo-simple-select-${index}`}
                                            label="Option"
                                            onChange={(event) => handleSelectChange(event, row.endpoint)}
                                            value={selectedOptions[row.endpoint] || ""}
                                        >
                                            {row.options.map((option, optionIndex) => (
                                                <MenuItem key={optionIndex} value={option.value}>{option.label}</MenuItem>
                                            ))}
                                        </Select>
                                    </TableCell>
                                ) : (
                                    <TableCell></TableCell>
                                )}
                                <TableCell></TableCell>
                                <TableCell><Chip color="info" icon={<SyncIcon />} label="Status" /></TableCell>
                                <TableCell>
                                    <Button variant="contained" onClick={() => handleButtonClick(row.endpoint)}>Lancer</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </div>
    );
}

export default TrelloPage;
