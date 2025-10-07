const axios = require('axios');
require('dotenv').config(); 
const { createServiceLogger, redact } = require('./logger');
const { logger, logError } = createServiceLogger('trello');

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
    logger.info('Finding Trello list ID', { meta: { BOARD_ID, LIST_NAME } });
    const { data: lists } = await trelloAPI.get(`/boards/${BOARD_ID}/lists`);
    const list = lists.find(list => list.name === LIST_NAME);

    if (!list) {
      throw new Error('List not found');
    }

    logger.info('Found Trello list', { meta: { listId: list.id } });
    return list.id;
  } catch (error) {
    logError(error, 'Error finding Trello list ID', { BOARD_ID, LIST_NAME });
    throw error;
  }
};

const createCard = async (listId, cardName) => {
  try {
    logger.info('Creating Trello card', { meta: { listId, cardName } });
    const { data: card } = await trelloAPI.post('/cards', { idList: listId, name: cardName });
    logger.info('Created Trello card', { meta: { cardId: card.id } });
    return card.id;
  } catch (error) {
    logError(error, 'Error creating Trello card', { listId, cardName });
    throw error;
  }
};

const createChecklist = async (cardId, checklistName, checkItems) => {
  try {
    logger.info('Creating Trello checklist', { meta: { cardId, checklistName } });
    const { data: checklist } = await trelloAPI.post(`/checklists`, { idCard: cardId, name: checklistName });

    for (const itemName of checkItems) {
      await trelloAPI.post(`/checklists/${checklist.id}/checkItems`, { name: itemName });
    }

    logger.info('Created Trello checklist', { meta: { checklistId: checklist.id, items: checkItems?.length || 0 } });
    return checklist.id;
  } catch (error) {
    logError(error, 'Error creating Trello checklist', { cardId, checklistName });
    throw error;
  }
};

exports.createTicket = async (cardName) => {
  try {
    logger.info('Creating Trello ticket flow start', { meta: { cardName } });
    const listId = await findListId();
    const cardId = await createCard(listId, cardName);

    for (const { name, items } of CHECKLISTS) {
      await createChecklist(cardId, name, items);
    }

    logger.info('Trello ticket flow completed', { meta: { cardId } });
    return 'Ticket and checklists created successfully';
  } catch (error) {
    logError(error, 'Error creating Trello ticket', { cardName });
    throw error;
  }
};

exports.getCardsWithIncompleteCheckItems = async (checkItemNames) => {
  try {
    logger.info('Fetching Trello cards');
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

    logger.info('Fetched Trello cards with incomplete check items', { meta: { count: cardsWithIncompleteCheckItems.length } });
    return cardsWithIncompleteCheckItems;
  } catch (error) {
    logError(error, 'Error fetching Trello cards with incomplete check items');
    throw error;
  }
};

exports.getAllChecklistItems = async () => {
  try {
    logger.info('Fetching Trello checklist items');
    const { data: cards } = await trelloAPI.get(`/boards/${BOARD_ID}/cards`);

    const allChecklistItems = await Promise.all(
      cards.map(async (card) => {
        const { data: cardChecklists } = await trelloAPI.get(`/cards/${card.id}/checklists`);
        return cardChecklists.flatMap((checklist) => checklist.checkItems.map((checkItem) => checkItem.name));
      })
    );

    const uniqueChecklistItems = [...new Set(allChecklistItems.flat())];

    logger.info('Fetched Trello checklist items', { meta: { count: uniqueChecklistItems.length } });
    return uniqueChecklistItems;
  } catch (error) {
    logError(error, 'Error fetching Trello checklist items');
    throw error;
  }
};

exports.getAgSteps = async () => {
  try {
    logger.info('Fetching Trello AG steps');
    const { data: lists } = await trelloAPI.get(`/boards/${BOARD_ID}/lists`);
    const allLists = [];

    for (const list of lists) {
      allLists.push({
        id: list.id,
        name: list.name,
      });
    }

    logger.info('Fetched Trello AG steps', { meta: { count: allLists.length } });
    return allLists;
  } catch (error) {
    logError(error, 'Error fetching Trello lists');
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

    logger.info('Fetched Trello card info', { meta: { cardId } });
    return cardInfo;
  } catch (error) {
    logError(error, 'Error fetching Trello card information', { cardId });
    throw error;
  }
};
