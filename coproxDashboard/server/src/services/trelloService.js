// src/services/trelloService.js
const axios = require('axios');

const API_KEY = '93bce8f264373d72b9e48d4ab24a4fc0';
const TOKEN = '54e95d264d79e134e2e024738b1dc8ec9cc56bcf9ca1b46850a7c377975718d4';
const BOARD_ID = '655e5c6ba83dc919979f41fa';
const LIST_NAME = 'Initial';
const CHECKLISTS = [
  { name: 'Inscription questionaire ODG', items: ['Action 1.1', 'Action 1.2'] },
  { name: 'Ouverture de la CS macopro', items: ['Action 2.1', 'Action 1.3','Action 1.4','Action 1.5','Action 1.6'] },
];

// Function to create a ticket
exports.createTicket = async (cardName) => {
  try {
    // Step 1: Get the list ID for the specified list name
    const listsResponse = await axios.get(`https://api.trello.com/1/boards/${BOARD_ID}/lists?key=${API_KEY}&token=${TOKEN}`);
    const list = listsResponse.data.find(list => list.name === LIST_NAME);

    if (!list) {
      throw new Error('List not found');
    }

    // Step 2: Create a card in the specified list
    const cardResponse = await axios.post(
      `https://api.trello.com/1/cards?key=${API_KEY}&token=${TOKEN}&idList=${list.id}&name=${cardName}`
    );

    const cardId = cardResponse.data.id;

    // Step 3: Add checklists to the card
    for (const { name, items } of CHECKLISTS) {
      const checklistResponse = await axios.post(
        `https://api.trello.com/1/checklists?key=${API_KEY}&token=${TOKEN}&idCard=${cardId}&name=${name}`
      );

      const checklistId = checklistResponse.data.id;

      // Step 4: Add check items to the checklist
      for (const itemName of items) {
        await axios.post(
          `https://api.trello.com/1/checklists/${checklistId}/checkItems?key=${API_KEY}&token=${TOKEN}&name=${itemName}`
        );
      }
    }

    return 'Ticket and checklists created successfully';
  } catch (error) {
    console.error('Error creating Trello ticket:', error.message);
    throw error;
  }
};


// Function to get cards with specific check items
exports.getCardsWithCheckItems = async (checkItemNames) => {
  try {
    // Step 1: Get cards from the board
    const cardsResponse = await axios.get(
      `https://api.trello.com/1/boards/${BOARD_ID}/cards?key=${API_KEY}&token=${TOKEN}`
    );

    const cards = cardsResponse.data;

    // Step 2: Filter cards with the specified check items
    const filteredCards = cards.filter(async (card) => {
      const cardChecklistsResponse = await axios.get(
        `https://api.trello.com/1/cards/${card.id}/checklists?key=${API_KEY}&token=${TOKEN}`
      );

      const cardChecklists = cardChecklistsResponse.data;

      for (const checklist of cardChecklists) {
        for (const checkItemName of checkItemNames) {
          const checkItemsResponse = await axios.get(
            `https://api.trello.com/1/checklists/${checklist.id}/checkItems?key=${API_KEY}&token=${TOKEN}`
          );

          const checkItems = checkItemsResponse.data;

          const checkItem = checkItems.find((item) => item.name === checkItemName);

          // If the check item is not found or is not marked as complete, exclude the card
          if (!checkItem || !checkItem.state === 'complete') {
            return false;
          }
        }
      }

      // Include the card in the result
      return true;
    });

    return filteredCards.map((card) => ({ id: card.id, name: card.name }));
  } catch (error) {
    console.error('Error fetching Trello data:', error.message);
    throw error;
  }
};

// Function to get cards with specific check items (used by trelloCheckItemController)
exports.getCardsWithCheckItemsFromService = async (checkItemNames) => {
  try {
    // Reusing the same logic as getCardsWithCheckItems
    const cards = await exports.getCardsWithCheckItems(checkItemNames);
    return cards;
  } catch (error) {
    console.error('Error fetching Trello data:', error.message);
    throw error;
  }
};
