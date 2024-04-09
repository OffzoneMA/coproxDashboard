// controllers/mondayController.js

const mondayService = require('../services/mondayService');

// Controller function to handle requests
async function getItems(req, res) {
    const { boardId } = req.params;
    try {
      const items = await mondayService.getItems(boardId);
      console.log(items)
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
  
  async function createItem(req, res) {
    const { boardId, itemName } = req.body;
    try {
      const clientId = process.env.MONDAY_CLIENT_ID; // Assuming you have client ID in env variable
      const accessToken = await mondayService.getAccessToken(authorizationCode, redirectUri, clientId);
      const newItem = await mondayService.createItem(boardId, itemName, accessToken);
      res.json(newItem);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
  
  async function createSubitem(req, res) {
    const { parentItemId, subitemName } = req.body;
    try {
      const clientId = process.env.MONDAY_CLIENT_ID; // Assuming you have client ID in env variable
      const accessToken = await mondayService.getAccessToken(authorizationCode, redirectUri, clientId);
      const newSubitem = await mondayService.createSubitem(parentItemId, subitemName, accessToken);
      res.json(newSubitem);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
  
  module.exports = {
    getItems,
    createItem,
    createSubitem,
  };