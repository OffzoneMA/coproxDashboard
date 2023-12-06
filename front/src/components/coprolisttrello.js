import React, { useEffect, useState } from 'react';
import axios from 'axios';
import CircularProgress from '@mui/material/CircularProgress';

const CoproListTrello = ({ selectedTask }) => {
  const [cardsWithCheckItems, setCardsWithCheckItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCardsWithCheckItems = async () => {
      try {
        if (selectedTask) {
          // Set loading to true when starting the API call
          setLoading(true);

          const response = await axios.post('http://localhost:8081/trello/cardsWithCheckItems', {
            checkItemNames: [selectedTask],
          });

          setCardsWithCheckItems(response.data);
        }
      } catch (error) {
        console.error('Error fetching cards with check items:', error.message);
      } finally {
        // Set loading to false when API call is complete
        setLoading(false);
      }
    };

    fetchCardsWithCheckItems();
  }, [selectedTask]);

  return (
    <div>
      <h2>Cards with Check Items</h2>
      {loading ? (
        // Show CircularProgress while loading
        <CircularProgress />
      ) : (
        <ul>
          {cardsWithCheckItems.map((card, index) => (
            <li key={index}>
              <a href={card.link} target="_blank" rel="noopener noreferrer">
                {card.name}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CoproListTrello;
