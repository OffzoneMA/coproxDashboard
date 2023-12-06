import React, { useState, useEffect } from 'react';
import { fetchDataFromApi } from '@src/utils/api';
import CoproList from '../components/coprolist';
import Sidebar from '../components/Sidebar';
import CircularProgress from '@mui/material/CircularProgress';

function Copro({ onSetTitle }) {
  const [trelloData, setTrelloData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCheckItem, setSelectedCheckItem] = useState('Item 1'); // Default value

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await fetchDataFromApi('trello/cards', { checkItem: selectedCheckItem });
        setTrelloData(result);
      } catch (error) {
        // Handle error
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // Move this outside of the fetchData function
    // This will update the title immediately
    onSetTitle('Les Coprox');
  }, [selectedCheckItem, onSetTitle]);

  return (
    <div>
      {/* Content of Copro component */}
      {loading ? (
        <CircularProgress />
      ) : (
        <CoproList />
      )}
    </div>
  );
}

export default Copro;
