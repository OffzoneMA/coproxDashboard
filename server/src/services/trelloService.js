const axios = require('axios');

const API_KEY = '93bce8f264373d72b9e48d4ab24a4fc0';
const TOKEN = '54e95d264d79e134e2e024738b1dc8ec9cc56bcf9ca1b46850a7c377975718d4';
const BOARD_ID = '655e5c6ba83dc919979f41fa';
const LIST_NAME = 'Initial';
const CHECKLISTS = [
  { name: 'Inscription questionaire ODG', items: ['Action 1.1', 'Action 1.2'] },
  { name: 'Ouverture de la CS macopro', items: ['Action 2.1', 'Action 1.3','Action 1.4','Action 1.5','Action 1.6'] },
];

const trelloAPI = axios.create({
  baseURL: 'https://api.trello.com/1',
  params: {
    key: API_KEY,
    token: TOKEN,
  },
});

const findListId = async () => {
  try {
    const { data: lists } = await trelloAPI.get(`/boards/${BOARD_ID}/lists`);
    const list = lists.find(list => list.name === LIST_NAME);

    if (!list) {
      throw new Error('List not found');
    }

    return list.id;
  } catch (error) {
    console.error('Error finding list ID:', error.message);
    throw error;
  }
};

const createCard = async (listId, cardName) => {
  try {
    const { data: card } = await trelloAPI.post('/cards', { idList: listId, name: cardName });
    return card.id;
  } catch (error) {
    console.error('Error creating Trello card:', error.message);
    throw error;
  }
};

const createChecklist = async (cardId, checklistName, checkItems) => {
  try {
    const { data: checklist } = await trelloAPI.post(`/checklists`, { idCard: cardId, name: checklistName });

    for (const itemName of checkItems) {
      await trelloAPI.post(`/checklists/${checklist.id}/checkItems`, { name: itemName });
    }

    return checklist.id;
  } catch (error) {
    console.error('Error creating Trello checklist:', error.message);
    throw error;
  }
};

exports.createTicket = async (cardName) => {
  try {
    const listId = await findListId();
    const cardId = await createCard(listId, cardName);

    for (const { name, items } of CHECKLISTS) {
      await createChecklist(cardId, name, items);
    }

    return 'Ticket and checklists created successfully';
  } catch (error) {
    console.error('Error creating Trello ticket:', error.message);
    throw error;
  }
};

exports.getCardsWithIncompleteCheckItems = async (checkItemNames) => {
  try {
    const { data: cards } = await trelloAPI.get(`/boards/${BOARD_ID}/cards`);
    const cardsWithIncompleteCheckItems = [];

    for (const card of cards) {
      const { data: cardChecklists } = await trelloAPI.get(`/cards/${card.id}/checklists`);

      for (const checklist of cardChecklists) {
        const { data: checklistCheckItems } = await trelloAPI.get(`/checklists/${checklist.id}/checkItems`);

        for (const checkItem of checklistCheckItems) {
          if (checkItemNames.includes(checkItem.name) && checkItem.state === 'incomplete') {
            cardsWithIncompleteCheckItems.push(card.name);
          }
        }
      }
    }

    return cardsWithIncompleteCheckItems;
  } catch (error) {
    console.error('Error fetching Trello cards with incomplete check items:', error.message);
    throw error;
  }
};






exports.getAllChecklistItems = async () => {
  try {
    const { data: cards } = await trelloAPI.get(`/boards/${BOARD_ID}/cards`);

    const allChecklistItems = await Promise.all(
      cards.map(async (card) => {
        const { data: cardChecklists } = await trelloAPI.get(`/cards/${card.id}/checklists`);
        return cardChecklists.flatMap((checklist) => checklist.checkItems.map((checkItem) => checkItem.name));
      })
    );

    const uniqueChecklistItems = [...new Set(allChecklistItems.flat())];

    return uniqueChecklistItems;
  } catch (error) {
    console.error('Error fetching Trello checklist items:', error.message);
    throw error;
  }
};
