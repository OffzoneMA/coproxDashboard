// HomePage.js
import React, { useState, useEffect } from 'react';
import { fetchDataFromApi } from '@src/utils/api';
import DashboardBox from '../components/DashboardBox';

function HomePage({ onSetTitle }) {
  const [coproWithoutAGCount, setCoproWithoutAGCount] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:8081/copro/coprowithoutag');
        const data = await response.json();
        setCoproWithoutAGCount(data.count);
        // Pass the title to the parent component
        
      } catch (error) {
        console.error('Error fetching copro without AG count:', error.message);
        setCoproWithoutAGCount(0);
      }
    };
    
    fetchData();
    onSetTitle('Dashboard Coprox');
  }, [onSetTitle]);

  return (
    <div>
      {/* Content of HomePage component */}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <DashboardBox title="AG à lancer ce mois" data={5} />
        {coproWithoutAGCount === null ? (
          <p>Loading...</p>
        ) : (
          <DashboardBox title="Copropriétés sans AG" data={coproWithoutAGCount} />
        )}
        <DashboardBox title="Ticket Zendesk en cours" data={304} />
        <DashboardBox title="Titre" data={50} />
        <DashboardBox title="Titre" data={480} />
      </div>
    </div>
  );
}

export default HomePage;
