// HomePage.js
import React, { useState, useEffect } from 'react';
import { fetchDataFromApi } from '@src/utils/api';
import DashboardBox from '../components/DashboardBox';

function HomePage({ onSetTitle }) {
  const [coproWithoutAGCount, setCoproWithoutAGCount] = useState(null);
  const [nonResolvedTicketsCount, setNonResolvedTicketsCount] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const responseCoproWithoutAG = await fetch('http://localhost:8081/copro/coprowithoutag');
        const dataCoproWithoutAG = await responseCoproWithoutAG.json();
        setCoproWithoutAGCount(dataCoproWithoutAG.count);

        const responseNonResolvedTickets = await fetch('http://localhost:8081/zendesk/non-resolved-tickets/count');
        const dataNonResolvedTickets = await responseNonResolvedTickets.json();
        setNonResolvedTicketsCount(dataNonResolvedTickets.count.value);

        // Pass the title to the parent component
        onSetTitle('Dashboard Coprox');
      } catch (error) {
        console.error('Error fetching data:', error.message);
        setCoproWithoutAGCount(0);
        setNonResolvedTicketsCount(0);
      }
    };

    fetchData();
  }, [onSetTitle]);

  return (
    <div className="container-main" >
      {/* Content of HomePage component */}
      <div  className="container-top" style={{  }}>
        <DashboardBox title="AG à lancer ce mois" data={5} />
        {coproWithoutAGCount === null ? (
          <p>Loading...</p>
        ) : (
          <DashboardBox title="Copropriétés sans AG" data={coproWithoutAGCount} />
        )}
        {nonResolvedTicketsCount === null ? (
          <p>Loading...</p>
        ) : (
          <DashboardBox title="Ticket Zendesk en cours" data={nonResolvedTicketsCount} />
        )}
        <DashboardBox title="Titre" data={50} />
        <DashboardBox title="Titre" data={480} />
      </div>
    </div>
  );
}

export default HomePage;
