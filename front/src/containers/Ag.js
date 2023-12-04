import React, { useState, useEffect } from 'react';
import { fetchDataFromApi } from '@src/utils/api';
import Sidebar from '../components/Sidebar';
import CssBaseline from '@mui/material/CssBaseline';

function Ag() {
  const [trelloData, setTrelloData] = useState([]);
  const [selectedCheckItem, setSelectedCheckItem] = useState('Item 1'); // Default value

 /* useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await fetchDataFromApi('trello/cards', { checkItem: selectedCheckItem });
        setTrelloData(result);
      } catch (error) {
        // Handle error
      }
    };

    fetchData();
  }, [selectedCheckItem]);*/

  return (
    
    <div className="trello-page">
      <CssBaseline />
      <Sidebar />
      <div className="main-container">
        <h1>Les Coprox</h1>
        {/* Other components or content */}
      </div>

    </div>
  );
}

export default Ag;
