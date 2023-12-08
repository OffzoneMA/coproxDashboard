const axios = require('axios');
require('dotenv').config(); 

const API_KEY  = process.env.TRELLO_API_KEY;
const TOKEN  = process.env.TRELLO_TOKEN;
const BOARD_ID  = process.env.TRELLO_BOARD_ID;
const LIST_NAME  = process.env.TRELLO_LIST_NAME;

const CHECKLISTS  = [
  {
    name: process.env.TRELLO_CHECKLISTS_0_NAME,
    items: [process.env.TRELLO_CHECKLISTS_0_ITEMS_0, process.env.TRELLO_CHECKLISTS_0_ITEMS_1],
  },
  {
    name: process.env.TRELLO_CHECKLISTS_1_NAME,
    items: [
      process.env.TRELLO_CHECKLISTS_1_ITEMS_0,
      process.env.TRELLO_CHECKLISTS_1_ITEMS_1,
      process.env.TRELLO_CHECKLISTS_1_ITEMS_2,
      process.env.TRELLO_CHECKLISTS_1_ITEMS_3,
      process.env.TRELLO_CHECKLISTS_1_ITEMS_4,
    ],
  },
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
            cardsWithIncompleteCheckItems.push({
              id: card.id,
              name: card.name,
              link: card.url, // Assuming Trello card URL is the link you want
            });
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

exports.getAgSteps = async () => {
  try {
    const { data: lists } = await trelloAPI.get(`/boards/${BOARD_ID}/lists`);
    const allLists = [];

    for (const list of lists) {
      allLists.push({
        id: list.id,
        name: list.name,
      });
    }

    return allLists;
  } catch (error) {
    console.error('Error fetching Trello lists:', error.message);
    throw error;
  }
};


exports.getCardInfo = async (cardId) => {
  try {
    // Get card details
    const { data: card } = await trelloAPI.get(`/cards/${cardId}`);

    // Get the list details for the card
    const { data: list } = await trelloAPI.get(`/lists/${card.idList}`);

    // Get checklist items for the card
    const { data: checklists } = await trelloAPI.get(`/cards/${cardId}/checklists`);

    const checklistItems = [];
    for (const checklist of checklists) {
      for (const item of checklist.checkItems) {
        checklistItems.push({
          name: item.name,
          status: item.state,
        });
      }
    }

    const cardInfo = {
      id: card.id,
      name: card.name,
      list:  list.name,
      checklistItems,
    };

    return cardInfo;
  } catch (error) {
    console.error('Error fetching Trello card information:', error.message);
    throw error;
  }
};
