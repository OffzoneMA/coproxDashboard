import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchDataFromApi } from '@src/utils/api';
import { Table, Select, MenuItem, Chip, TableBody, TableCell, Button, TableContainer, TableHead, TableRow, Paper, CircularProgress, Alert, Snackbar, Tooltip, Box, Typography } from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ScheduleIcon from '@mui/icons-material/Schedule';
import '@src/assets/styles/App.css';

function TrelloPage({ onSetTitle }) {
    const [selectedOptions, setSelectedOptions] = useState({});
    const [scriptData, setScriptData] = useState([]);
    const [cronData, setCronData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

    const fetchData = useCallback(async () => {
        console.log('🔄 Starting to fetch data...');
        setLoading(true);
        try {
            console.log('📡 Calling APIs...');
            const [scriptResponse, cronResponse] = await Promise.all([
                fetchDataFromApi('script/'),
                fetchDataFromApi('cron-config/')
            ]);
            console.log('✅ Script data received:', scriptResponse?.length || 0, 'items');
            console.log('✅ Cron data received:', cronResponse?.length || 0, 'items');
            setScriptData(scriptResponse);
            setCronData(cronResponse);
            setError(null);
        } catch (error) {
            console.error("❌ Error fetching data:", error);
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

    const formatCronSchedule = useCallback((cronExpression) => {
        if (!cronExpression) return "Non programmé";
        
        // Simple format mapping for common patterns
        const patterns = {
            '*/5 * * * *': 'Toutes les 5 minutes',
            '0 1 * * *': 'Quotidien à 1h00',
            '0 3 * * *': 'Quotidien à 3h00', 
            '0 5 * * *': 'Quotidien à 5h00',
            '0 19 * * *': 'Quotidien à 19h00',
            '0 0 * * 0': 'Hebdomadaire (Dimanche)',
            '0 0 * * 6': 'Hebdomadaire (Samedi)',
        };
        
        return patterns[cronExpression] || cronExpression;
    }, []);

    const getCronInfoForScript = useCallback((scriptName) => {
        const cronConfig = cronData.find(config => 
            config.scripts?.some(script => script.name === scriptName)
        );
        
        if (!cronConfig) return { 
            frequency: "Non programmé", 
            lastRun: null, 
            enabled: false,
            runCount: 0,
            errorCount: 0
        };
        
        return {
            frequency: formatCronSchedule(cronConfig.schedule),
            lastRun: cronConfig.lastRun,
            enabled: cronConfig.enabled,
            runCount: cronConfig.runCount || 0,
            errorCount: cronConfig.errorCount || 0
        };
    }, [cronData, formatCronSchedule]);

    const formatLastRun = useCallback((lastRun) => {
        if (!lastRun) return "Jamais exécuté";
        
        const date = new Date(lastRun);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffMins < 1) return "À l'instant";
        if (diffMins < 60) return `Il y a ${diffMins} min`;
        if (diffHours < 24) return `Il y a ${diffHours}h`;
        if (diffDays < 7) return `Il y a ${diffDays} jour(s)`;
        
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }, []);

    useEffect(() => {
        fetchData();
        onSetTitle('Les scripts');
        // Refresh every 30 seconds to keep cron info updated
        const intervalId = setInterval(fetchData, 30 * 1000);
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
                            <TableCell>Fréquence</TableCell>
                            <TableCell>Dernière exécution</TableCell>
                            <TableCell>Date de lancement</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {scriptData.map((row, index) => {
                            const cronInfo = getCronInfoForScript(row.name);
                            return (
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
                                    <TableCell>
                                        <Box display="flex" flexDirection="column" gap={0.5}>
                                            <Tooltip title={cronInfo.enabled ? "Programmation active" : "Programmation désactivée"}>
                                                <Chip
                                                    icon={<ScheduleIcon />}
                                                    label={cronInfo.frequency}
                                                    color={cronInfo.enabled ? "primary" : "default"}
                                                    variant={cronInfo.enabled ? "filled" : "outlined"}
                                                    size="small"
                                                    className="cron-info-chip"
                                                />
                                            </Tooltip>
                                            {cronInfo.runCount > 0 && (
                                                <Typography variant="caption" color="textSecondary">
                                                    {cronInfo.runCount} exécution(s)
                                                    {cronInfo.errorCount > 0 && ` • ${cronInfo.errorCount} erreur(s)`}
                                                </Typography>
                                            )}
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Tooltip title={cronInfo.lastRun ? new Date(cronInfo.lastRun).toLocaleString('fr-FR') : "Jamais exécuté"}>
                                            <Chip
                                                icon={<AccessTimeIcon />}
                                                label={formatLastRun(cronInfo.lastRun)}
                                                color={cronInfo.lastRun ? "success" : "default"}
                                                variant="outlined"
                                                size="small"
                                                className="cron-info-chip"
                                            />
                                        </Tooltip>
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
                            );
                        })}
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
