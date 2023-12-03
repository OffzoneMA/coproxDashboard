import React, { useState, useEffect } from 'react';
import { fetchDataFromApi } from '@src/utils/api';

function TrelloPage() {
  const [trelloData, setTrelloData] = useState([]);
  const [selectedCheckItem, setSelectedCheckItem] = useState('Item 1'); // Default value

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await fetchDataFromApi('trello/cards', { checkItem: selectedCheckItem });
        setTrelloData(result);
      } catch (error) {
        // Handle error
      }
    };

    fetchData();
  }, [selectedCheckItem]);

  return (
    <div className="trello-page">
      <h1>Trello Page</h1>
      {/* Rest of the component */}
    </div>
  );
}

export default TrelloPage;
