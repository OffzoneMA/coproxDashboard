import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import {
  Paper,
  Typography,
  Divider,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Tabs,
  Tab,
} from '@mui/material';
import { Stepper, Step, StepLabel } from '@mui/material';
import DashboardBox from '../components/DashboardBox';
require('dotenv').config(); // Load environment variables from .env

const LoadingComponent = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <CircularProgress />
  </div>
);

const TabPanel = ({ value, index, children }) => (
  <div hidden={value !== index} style={{ width: '100%' }}>
    {value === index && children}
  </div>
);

const DetailCopro = ({ onSetTitle }) => {
  const { id } = useParams();
  const [coproDetails, setCoproDetails] = useState(null);
  const [lebarocoproDetails, setLebarocoproDetails] = useState(null);
  const [nonResolvedTicketsCount, setNonResolvedTicketsCount] = useState(null);
  const [coproData, setCoproData] = useState(null);
  const [councilMembers, setCouncilMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [steps, setSteps] = useState([]);
  const [tabValue, setTabValue] = useState(0);

  const fetchData = async (url, setter) => {
    try {
      const response = await axios.get(url);
      setter(response.data);
    } catch (error) {
      console.error(`Error fetching data from ${url}:`, error.message);
      setError(error.message);
    }
  };
 
  const fetchCoproDetails = async () => {
    await fetchData(`${process.env.BACKEND_URL}/copro/detailsCopro/${id}`, setCoproDetails);
  };

  const fetchLebarocoproDetails = async () => {
    await fetchData(`${process.env.BACKEND_URL}/lebarocopro/lebarocopro/${id}`, setLebarocoproDetails);
  };

  const fetchAgSteps = async () => {
    await fetchData(`${process.env.BACKEND_URL}/trello/getAgSteps`, setSteps);
  };

  const fetchCoproData = async () => {
    await fetchData(`${process.env.BACKEND_URL}/vilogi/getCoproData/${coproDetails?.idVilogi}`, setCoproData);
  };

  const fetchCouncilMembers = async () => {
    await fetchData(`${process.env.BACKEND_URL}/vilogi/getCoproData/${coproDetails?.idVilogi}`, setCouncilMembers);
  };

  const fetchNonResolvedTicketsCount = async () => {
    const idCorpo = coproDetails?.idCorpo;
    if (idCorpo) {
      await fetchData(`${process.env.BACKEND_URL}/zendesk/organization/${idCorpo}/ticket/count`, setNonResolvedTicketsCount);
    }
  };

  useEffect(() => {
    const fetchDataAsync = async () => {
      try {
        await Promise.all([
          fetchCoproDetails(),
          fetchLebarocoproDetails(),
          fetchAgSteps(),
          fetchCoproData(),
          fetchCouncilMembers(),
          fetchNonResolvedTicketsCount(),
        ]);
        onSetTitle(coproDetails?.Nom || 'Copro Details');
      } catch (error) {
        console.error('Error fetching data:', error.message);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDataAsync();
  }, [id, onSetTitle, coproDetails]);

  const statusColor = coproDetails?.status === 'Actif' ? 'green' : 'red';

  if (loading) {
    return <LoadingComponent />;
  }

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <div className="container-main">
      {error && <div>Error: {error}</div>}

      <Paper elevation={3} style={{ padding: '16px', marginBottom: '16px' }}>
        <Typography variant="h5">{coproDetails?.idCopro}</Typography>
        <Divider style={{ margin: '8px 0' }} />
        <Typography variant="subtitle1" style={{ color: statusColor }}>
          Status: {coproDetails?.status}
        </Typography>
      </Paper>



      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <DashboardBox title="Zendesk Ticket" data={nonResolvedTicketsCount || 0} />
        <DashboardBox title="Fin éxercice comptable" data={`${coproDetails?.exerciceCT || 'N/A'} `} />
        <DashboardBox title="Budget" data={`${coproDetails?.budget || 0} $`} />
        <DashboardBox title="Offre" data={coproDetails?.Offre || 'N/A'} />
        <DashboardBox title="Nombre de coproprietaire" data={coproDetails?.nombreCoproprietaire || 0} />
        <DashboardBox title="Satisfaction client" data={coproDetails?.satisfaction || 'N/A'} />
        <DashboardBox title="Lebarocopro" data={lebarocoproDetails || 'N/A'} />
        {/* Additional DashboardBoxes as needed */}
      </div>
      <div style={{ width: '100%' }}>
        <Tabs value={tabValue} onChange={handleTabChange} indicatorColor="primary" textColor="primary" centered>
          <Tab label="Avancement AG" />
          <Tab label="Conseil Syndical" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Stepper alternativeLabel activeStep={activeStep}>
            {steps.map((step) => (
              <Step key={step.id}>
                <StepLabel>{step.name}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {councilMembers.length > 0 && (
            <div style={{ width: '45%' }}>
              <Typography variant="h6" gutterBottom>Liste conseil syndical</Typography>
              <Paper elevation={3} style={{ padding: '16px', marginBottom: '16px' }}>
                <List>
                  {councilMembers.map((member) => (
                    <ListItem key={member.id}>
                      <ListItemText primary={member.autreNom} />
                      {/* Add more information as needed */}
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </div>
          )}
        </TabPanel>
      </div>
      
      </div>
  );
};

export default DetailCopro;
