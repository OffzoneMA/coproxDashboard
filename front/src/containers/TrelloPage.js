import React, { useState, useEffect } from 'react';
import { fetchDataFromApi } from '@src/utils/api';
import ChecklistItemsList from '../components/ChecklistItemsList';
import CoproList from '../components/coprolist';

import Sidebar from '../components/Sidebar';
import CssBaseline from '@mui/material/CssBaseline';

function TrelloPage() {
  const [trelloData, setTrelloData] = useState([]);
  const [selectedCheckItem, setSelectedCheckItem] = useState('Item 1'); // Default value
  const [selectedTask, setSelectedTask] = useState('');
  
  const handleSelectChange = (task) => {
    setSelectedTask(task);
  };


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
        <h1>Trello Page</h1>
        {/* Other components or content */}
        <ChecklistItemsList onSelectChange={handleSelectChange} />
        <CoproList selectedTask={selectedTask} />
      </div>


    </div>
  );
}

export default TrelloPage;