import React, { useState, useEffect } from 'react';
import { fetchDataFromApi } from '@src/utils/api';
import { Table, Select, MenuItem, Chip, TableBody, TableCell, Button, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';

function TrelloPage({ onSetTitle }) {
    const [selectedOptions, setSelectedOptions] = useState({});
    const [scriptData, setScriptData] = useState([]);


    const fetchData = async () => {
        try {
            const response = await fetchDataFromApi('script/');
                console.log("Response:", response);
                setScriptData(response);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    const handleButtonClick = async (scriptName) => {
        const row = scriptData.find(row => row.endpoint === scriptName);
    
        if (row) {
            try {
                const response = await fetchDataFromApi('/update-status', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ scriptName, status: 1 }), // Set status to 1 (started)
                });
    
                const data = await response.json();
                await fetchData(); // Refresh the UI if needed
                console.log("API response:", data);
            } catch (error) {
                console.error("Error updating script status:", error);
            }
        } else {
            alert("Invalid script selected!");
        }
    };

    const handleSelectChange = (event, endpoint) => {
        setSelectedOptions(prevOptions => ({
            ...prevOptions,
            [endpoint]: event.target.value
        }));
    };

    const getStatusChip = (status) => {
        switch (status) {
            case 0:
                return <Chip color="success"  label="Success" />;
            case 1:
                return <Chip color="warning" icon={<SyncIcon />} label="Waiting to start" />;
            case 2:
                return <Chip color="info" icon={<SyncIcon />} label="In progress" />;
            case -1:
                return <Chip color="error" label="Error" />;
            default:
                return <Chip icon={<SyncIcon />} label="Unknown" />;
        }
    };

    useEffect(() => {
        fetchData();
        onSetTitle('Les scripts');
        // Set up interval to fetch data every 5 minutes (adjust as needed)
        const intervalId = setInterval(fetchData, 5 * 60 * 1000); // 5 minutes in milliseconds
        return () => {
            clearInterval(intervalId); // Clean up interval on component unmount
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
                        {scriptData.map((row, index) => (
                            <TableRow key={index}>
                                <TableCell></TableCell>
                                <TableCell>{row.label}</TableCell>
                                {row.options && row.options.length > 0 ? (
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
                                <TableCell>{row.lastExecution}</TableCell>
                                <TableCell>{getStatusChip(row.status)}</TableCell>
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
