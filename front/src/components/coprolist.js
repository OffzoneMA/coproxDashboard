// src/components/coprolist.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const CoproList = ({ selectedTask }) => {
  const [cardsWithCheckItems, setCardsWithCheckItems] = useState([]);

  useEffect(() => {
    const fetchCardsWithCheckItems = async () => {
      try {
        if (selectedTask) {
          const response = await axios.post('http://localhost:8081/trello/cardsWithCheckItems', {
            checkItemNames: [selectedTask], // Assuming selectedTask is a single checkItemName
          });

          setCardsWithCheckItems(response.data);
        }
      } catch (error) {
        console.error('Error fetching cards with check items:', error.message);
      }
    };

    fetchCardsWithCheckItems();
  }, [selectedTask]);

  return (
    <div>
      <h2>Cards with Check Items</h2>
      <ul>
        {cardsWithCheckItems.map((card, index) => (
          <li key={index}>{card}</li>
        ))}
      </ul>
    </div>
  );
};

export default CoproList;
