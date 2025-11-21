// TrelloPage.js
import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import ChecklistItemsList from '../components/ChecklistItemsList';
import CoproListTrello from '../components/coprolisttrello';

function TrelloPage({ onSetTitle }) {
  const [selectedTask, setSelectedTask] = useState('');

  useEffect(() => {
    // Fetch data or perform other operations as needed

    // Set the title dynamically
    onSetTitle('Trello Page');

    // Clean up the title when the component unmounts
    return () => {
      onSetTitle('');
    };
  }, [onSetTitle]);

  const handleSelectChange = (task) => {
    setSelectedTask(task);
  };

  return (
    <Box>
      {/* Content of TrelloPage */}
      <ChecklistItemsList onSelectChange={handleSelectChange} />
      <CoproListTrello selectedTask={selectedTask} />
    </Box>
  );
}

export default TrelloPage;
