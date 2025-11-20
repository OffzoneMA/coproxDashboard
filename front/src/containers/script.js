import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchDataFromApi, fetchApiData } from '@src/utils/api';
import { 
    Table, Select, MenuItem, Chip, TableBody, TableCell, Button, 
    TableContainer, TableHead, TableRow, Paper, CircularProgress, 
    Alert, Snackbar, Tooltip, Box, Typography, Dialog, DialogTitle, 
    DialogContent, DialogActions, TextField, FormControlLabel, Switch,
    IconButton
} from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ScheduleIcon from '@mui/icons-material/Schedule';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import '@src/assets/styles/App.css';

function TrelloPage({ onSetTitle }) {
    const [selectedOptions, setSelectedOptions] = useState({});
    const [scriptData, setScriptData] = useState([]);
    const [cronData, setCronData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

    // Dialog states
    const [openAddScript, setOpenAddScript] = useState(false);
    const [openCronConfig, setOpenCronConfig] = useState(false);
    const [newScript, setNewScript] = useState({ name: '', content: '' });
    const [currentCron, setCurrentCron] = useState({ 
        name: '', 
        schedule: '0 0 * * *', 
        enabled: true, 
        description: '',
        scriptName: '' 
    });

    const fetchData = useCallback(async () => {
        console.log('🔄 Starting to fetch data...');
        setLoading(true);
        try {
            console.log('📡 Calling script API...');
            const scriptResponse = await fetchDataFromApi('script/');
            
            // Extract data array from API response (now includes cron info)
            const scriptData = scriptResponse?.data || [];
            
            console.log('✅ Script data received:', scriptData?.length || 0, 'items');
            console.log('✅ Scripts with cron enabled:', scriptData.filter(s => s.cronEnabled).length);
            setScriptData(scriptData);
            setCronData([]); // No longer needed as cron data is embedded in scripts
            setError(null);
        } catch (error) {
            console.error("❌ Error fetching data:", error);
            console.error("❌ Error details:", {
                message: error.message,
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data
            });
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
        const script = scriptData.find(s => s.name === scriptName);
        
        if (!script || !script.cronEnabled) return { 
            frequency: "Non programmé", 
            lastRun: null, 
            enabled: false,
            runCount: 0,
            errorCount: 0
        };
        
        return {
            frequency: script.cronFrequency || formatCronSchedule(script.cronSchedule),
            lastRun: script.cronLastRun,
            enabled: script.cronEnabled,
            runCount: script.cronRunCount || 0,
            errorCount: script.cronErrorCount || 0
        };
    }, [scriptData, formatCronSchedule]);

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

    const handleAddScript = async () => {
        if (!newScript.name || !newScript.content) {
            setSnackbar({ open: true, message: "Nom et contenu requis", severity: 'warning' });
            return;
        }

        try {
            setLoading(true);
            await fetchApiData('script/add', 'POST', {
                scriptName: newScript.name,
                scriptContent: newScript.content
            });
            setSnackbar({ open: true, message: "Script ajouté avec succès", severity: 'success' });
            setOpenAddScript(false);
            setNewScript({ name: '', content: '' });
            fetchData();
        } catch (error) {
            setSnackbar({ open: true, message: "Erreur lors de l'ajout du script", severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCronDialog = (script) => {
        const cronInfo = getCronInfoForScript(script.name);
        setCurrentCron({
            name: script.name, // Use script name as cron name by default
            schedule: script.cronSchedule || '0 0 * * *',
            enabled: script.cronEnabled !== false,
            description: script.cronDescription || '',
            scriptName: script.name,
            isUpdate: !!script.cronSchedule // Flag to know if we are updating or creating
        });
        setOpenCronConfig(true);
    };

    const handleSaveCron = async () => {
        try {
            setLoading(true);
            
            // 1. Create or Update Cron Config
            const configData = {
                name: currentCron.name,
                schedule: currentCron.schedule,
                enabled: currentCron.enabled,
                description: currentCron.description
            };

            if (currentCron.isUpdate) {
                await fetchApiData(`cron-config/${currentCron.name}`, 'PUT', configData);
            } else {
                await fetchApiData('cron-config', 'POST', configData);
                // 2. Add script to cron if it's new
                await fetchApiData(`cron-config/${currentCron.name}/scripts`, 'POST', {
                    name: currentCron.scriptName,
                    modulePath: `../cron/${currentCron.scriptName}`,
                    enabled: true
                });
            }

            setSnackbar({ open: true, message: "Configuration Cron sauvegardée", severity: 'success' });
            setOpenCronConfig(false);
            fetchData();
        } catch (error) {
            console.error(error);
            setSnackbar({ open: true, message: "Erreur lors de la sauvegarde Cron", severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    if (loading && !scriptData.length) {
        return <CircularProgress />;
    }

    return (
        <div className="container-main">
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h5">Gestion des Scripts</Typography>
                <Button 
                    variant="contained" 
                    startIcon={<AddIcon />} 
                    onClick={() => setOpenAddScript(true)}
                >
                    Nouveau Script
                </Button>
            </Box>

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
                                    <TableCell>{row.label || row.name}</TableCell>
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
                                        <Box display="flex" alignItems="center" gap={1}>
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
                                            <IconButton size="small" onClick={() => handleOpenCronDialog(row)}>
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                        </Box>
                                        {cronInfo.runCount > 0 && (
                                            <Typography variant="caption" color="textSecondary" display="block">
                                                {cronInfo.runCount} exécution(s)
                                                {cronInfo.errorCount > 0 && ` • ${cronInfo.errorCount} erreur(s)`}
                                            </Typography>
                                        )}
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

            {/* Add Script Dialog */}
            <Dialog open={openAddScript} onClose={() => setOpenAddScript(false)} maxWidth="md" fullWidth>
                <DialogTitle>Ajouter un nouveau script</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Nom du script (ex: monScript.js)"
                        fullWidth
                        value={newScript.name}
                        onChange={(e) => setNewScript({ ...newScript, name: e.target.value })}
                    />
                    <TextField
                        margin="dense"
                        label="Contenu du script"
                        fullWidth
                        multiline
                        rows={10}
                        value={newScript.content}
                        onChange={(e) => setNewScript({ ...newScript, content: e.target.value })}
                        sx={{ fontFamily: 'monospace' }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenAddScript(false)}>Annuler</Button>
                    <Button onClick={handleAddScript} variant="contained">Ajouter</Button>
                </DialogActions>
            </Dialog>

            {/* Cron Config Dialog */}
            <Dialog open={openCronConfig} onClose={() => setOpenCronConfig(false)}>
                <DialogTitle>Configuration Cron pour {currentCron.scriptName}</DialogTitle>
                <DialogContent>
                    <TextField
                        margin="dense"
                        label="Expression Cron (ex: 0 0 * * *)"
                        fullWidth
                        value={currentCron.schedule}
                        onChange={(e) => setCurrentCron({ ...currentCron, schedule: e.target.value })}
                        helperText="Format: minute heure jour mois jour-semaine"
                    />
                    <TextField
                        margin="dense"
                        label="Description"
                        fullWidth
                        value={currentCron.description}
                        onChange={(e) => setCurrentCron({ ...currentCron, description: e.target.value })}
                    />
                    <FormControlLabel
                        control={
                            <Switch
                                checked={currentCron.enabled}
                                onChange={(e) => setCurrentCron({ ...currentCron, enabled: e.target.checked })}
                            />
                        }
                        label="Activer la planification"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenCronConfig(false)}>Annuler</Button>
                    <Button onClick={handleSaveCron} variant="contained">Sauvegarder</Button>
                </DialogActions>
            </Dialog>

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
