import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Paper, Typography, Divider, CircularProgress } from '@mui/material';
import { Stepper, Step, StepLabel } from '@mui/material';
import DashboardBox from '../components/DashboardBox';

const LoadingComponent = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <CircularProgress />
  </div>
);

const DetailCopro = ({ onSetTitle }) => {
  const { id } = useParams();
  const [coproDetails, setCoproDetails] = useState(null);
  const [lebarocoproDetails, setLebarocoproDetails] = useState(null);
  const [nonResolvedTicketsCount, setNonResolvedTicketsCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [steps, setSteps] = useState([]);

  useEffect(() => {
    const fetchData = async (url, setter) => {
      try {
        const response = await axios.get(url);
        setter(response.data);
      } catch (error) {
        console.error(`Error fetching data from ${url}:`, error.message);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    const fetchCoproDetails = () => fetchData(`http://localhost:8081/copro/detailsCopro/${id}`, setCoproDetails);
    const fetchLebarocoproDetails = () => fetchData(`http://localhost:8081/lebarocopro/lebarocopro/${id}`, setLebarocoproDetails);
    const fetchAgSteps = () => fetchData('http://localhost:8081/trello/getAgSteps', setSteps);

    Promise.all([fetchCoproDetails(), fetchLebarocoproDetails(), fetchAgSteps()])
      .then(() => {
        const idCorpo = coproDetails?.idCorpo;
        if (idCorpo) {
          return fetchData(`http://localhost:8081/zendesk/organization/${idCorpo}/ticket/count`, setNonResolvedTicketsCount);
        }
      })
      .then(() => onSetTitle(coproDetails?.Nom || 'Copro Details')) 
      .catch((error) => {
        console.error('Error fetching data:', error.message);
        setError(error.message);
      });
  }, [id, onSetTitle, coproDetails]);

  const statusColor = coproDetails?.status === 'Actif' ? 'green' : 'red';

  if (loading) {
    return <LoadingComponent />;
  }

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
        <DashboardBox title="Fin éxercice comptable" data={`${coproDetails?.exerciceCT || 'N/A'} $`} />
        <DashboardBox title="Budget" data={`${coproDetails?.budget || 0} $`} />
        <DashboardBox title="Offre" data={coproDetails?.Offre || 'N/A'} />
        <DashboardBox
          title="Nombre de coproprietaire"
          data={coproDetails?.nombreCoproprietaire || 0}
        />
        <DashboardBox title="Satisfaction client" data={coproDetails?.satisfaction || 'N/A'} />
        <DashboardBox title="Lebarocopro" data={lebarocoproDetails || 'N/A'} />
      </div>

      <Stepper alternativeLabel activeStep={activeStep}>
        {steps.map((step) => (
          <Step key={step.id}>
            <StepLabel>{step.name}</StepLabel>
          </Step>
        ))}
      </Stepper>
    </div>
  );
};

export default DetailCopro;
