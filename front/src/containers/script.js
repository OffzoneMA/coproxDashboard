import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchDataFromApi } from '@src/utils/api';
import { Table, Select, MenuItem, Chip, TableBody, TableCell, Button, TableContainer, TableHead, TableRow, Paper, CircularProgress, Alert, Snackbar } from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';

function TrelloPage({ onSetTitle }) {
    const [selectedOptions, setSelectedOptions] = useState({});
    const [scriptData, setScriptData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetchDataFromApi('script/');
            setScriptData(response);
            setError(null);
        } catch (error) {
            console.error("Error fetching data:", error);
            setError("Erreur lors du chargement des données");
            setSnackbar({ open: true, message: "Erreur lors du chargement des données", severity: 'error' });
        } finally {
            setLoading(false);
        }
    }, []);

    const handleButtonClick = useCallback(async (scriptName) => {
        const row = scriptData.find(row => row.name === scriptName);
    
        if (row) {
            try {
                setLoading(true);
                const response = await fetch('https://coprox-dashboard-back.vercel.app/script/update-status', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        scriptName: row.name,
                        status: 1
                    })
                });
                
                if (!response.ok) throw new Error('Erreur lors de la mise à jour');
                
                await fetchData();
                setSnackbar({ open: true, message: "Script lancé avec succès", severity: 'success' });
            } catch (error) {
                console.error("Error updating script status:", error);
                setSnackbar({ open: true, message: error.message, severity: 'error' });
            } finally {
                setLoading(false);
            }
        }
    }, [scriptData, fetchData]);

    const handleSelectChange = useCallback((event, endpoint) => {
        setSelectedOptions(prev => ({
            ...prev,
            [endpoint]: event.target.value
        }));
    }, []);

    const getStatusChip = useMemo(() => (status) => {
        switch (status) {
            case 0:
                return <Chip color="success" label="Success" />;
            case 1:
                return <Chip color="warning" icon={<SyncIcon />} label="Waiting to start" />;
            case 2:
                return <Chip color="info" icon={<SyncIcon />} label="In progress" />;
            case -1:
                return <Chip color="error" label="Error" />;
            default:
                return <Chip icon={<SyncIcon />} label="Unknown" />;
        }
    }, []);

    useEffect(() => {
        fetchData();
        onSetTitle('Les scripts');
        const intervalId = setInterval(fetchData, 5 * 60 * 1000);
        return () => {
            clearInterval(intervalId);
            onSetTitle('');
        };
    }, [onSetTitle, fetchData]);

    const handleCloseSnackbar = useCallback(() => {
        setSnackbar(prev => ({ ...prev, open: false }));
    }, []);

    if (loading && !scriptData.length) {
        return <CircularProgress />;
    }

    return (
        <div className="container-main">
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>Nom</TableCell>
                            <TableCell>Option</TableCell>
                            <TableCell>Date de lancement</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {scriptData.map((row, index) => (
                            <TableRow key={row.endpoint || index}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell>{row.label}</TableCell>
                                <TableCell>
                                    {row.options?.length > 0 && (
                                        <Select
                                            size="small"
                                            value={selectedOptions[row.endpoint] || ""}
                                            onChange={(event) => handleSelectChange(event, row.endpoint)}
                                        >
                                            {row.options.map((option) => (
                                                <MenuItem key={option.value} value={option.value}>
                                                    {option.value}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    )}
                                </TableCell>
                                <TableCell>{row.lastExecution}</TableCell>
                                <TableCell>{getStatusChip(row.status)}</TableCell>
                                <TableCell>
                                    <Button
                                        variant="contained"
                                        onClick={() => handleButtonClick(row.name)}
                                        disabled={loading}
                                        size="small"
                                    >
                                        {loading ? <CircularProgress size={20} /> : 'Lancer'}
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                message={snackbar.message}
            >
                <Alert severity={snackbar.severity} onClose={handleCloseSnackbar}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </div>
    );
}

export default React.memo(TrelloPage);
