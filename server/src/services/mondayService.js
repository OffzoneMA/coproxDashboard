// mondayService.js
const mondaySdk = require("monday-sdk-js");
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const download = require('download');
const { createServiceLogger, redact } = require('./logger');
const { logger, logError } = createServiceLogger('monday');

// Initialize Monday SDK
const monday = mondaySdk();
monday.setApiVersion("2025-01");
monday.setToken(process.env.MONDAY_API_KEY);

// (Optional) one-liner replacement for your previous logExecution()
function logExecution(...args) {
  logger.info(args.join(' '));
}

/** ---------------------------------------------------------
 * Helpers
 * --------------------------------------------------------- */

/**
 * Escape a JS string for safe interpolation inside GraphQL quoted strings.
 * Escapes backslashes and double quotes.
 */
function escapeForGraphQL(str = "") {
  return String(str).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/**
 * Monday GraphQL expects column_values as a JSON string (i.e., stringified JSON).
 * When embedding that JSON string into a GraphQL string literal, we must:
 *   1) JSON.stringify() the object to get JSON text
 *   2) JSON.stringify() that JSON text again to produce a JS string literal with quotes
 * This returns the final token you can put unquoted in the GraphQL mutation:
 *
 *   column_values: ${asGraphQLJSONString({status: "Done"})}
 *
 * which expands to:
 *   column_values: "{\"status\":\"Done\"}"
 */
function asGraphQLJSONString(obj) {
  const json = JSON.stringify(obj ?? {});
  return JSON.stringify(json); // double-stringify for GraphQL embedding
}

/**
 * Remove CR/LF to avoid accidental GraphQL formatting issues inside strings.
 */
function stripNewlines(str = "") {
  return String(str).replace(/\r?\n|\r/g, "");
}

/** ---------------------------------------------------------
 * GraphQL wrapper with structured logging
 * --------------------------------------------------------- */
async function executeGraphQLQuery(queryString) {
  const startedAt = Date.now();
  logger.debug('GraphQL request', { meta: { query: redact(queryString) } });

  try {
    const res = await monday.api(queryString);
    const ms = Date.now() - startedAt;

    // Monday SDK returns { data, accountId, etc. }
    // If there were GraphQL errors, they’re on res.errors; surface them.
    if (res.errors && res.errors.length) {
      // Attach the raw GraphQL errors to the Error object so callers can inspect
      // and decide whether the error is recoverable (eg. inactive items).
      const err = new Error('Monday GraphQL error');
      err.graphQLErrors = res.errors;
      logError(err, 'GraphQL errors returned', { duration_ms: ms, errors: res.errors });
      throw err;
    }

    logger.info('GraphQL success', { meta: { duration_ms: ms } });
    return res.data;
  } catch (error) {
    const ms = Date.now() - startedAt;
    let errorMessage = 'Error executing GraphQL query';
    let meta = { duration_ms: ms };

    if (error.response) {
      meta.status = error.response.status;
      if (error.response.data) {
        meta.api_errors = error.response.data.errors || error.response.data.error_message;
        meta.api_error_code = error.response.data.error_code;
        meta.api_error_data = error.response.data.error_data;
      }
    } else if (error.errors || error.graphQLErrors) {
      // monday.api sometimes puts GraphQL errors on error.errors or we attached
      // them as error.graphQLErrors above. Normalize into meta.api_errors.
      meta.api_errors = error.errors || error.graphQLErrors;
    } else {
      meta.reason = error.message;
    }

    logError(error, errorMessage, meta);
    const thrown = new Error(
      `${errorMessage}: ${meta.status ? 'Status ' + meta.status + ' ' : ''}${meta.api_error_code || ''}`.trim()
    );
    // Preserve original GraphQL errors for callers
    if (meta.api_errors) thrown.api_errors = meta.api_errors;
    throw thrown;
  }
}

/** ---------------------------------------------------------
 * Queries & Mutations
 * --------------------------------------------------------- */

async function getItems(boardId) {
  try {
    logger.info('Fetching items', { meta: { boardId } });
    const query = `query {
      boards(ids: ${boardId}) {
        items_page (limit: 300) {
          cursor
          items { id name }
        }
      }
    }`;
    const result = await executeGraphQLQuery(query);
    const items = result.boards[0].items_page.items;
    logger.info('Fetched items', { meta: { boardId, count: items.length } });
    return items;
  } catch (error) {
    logError(error, 'Error fetching items', { boardId });
    throw error;
  }
}

async function getItemsGroup(boardId, groupID) {
  try {
    logger.info('Fetching items in group', { meta: { boardId, groupID } });
    // NOTE: You can add group filter via query_params if needed.
    const query = `query {
      boards(ids: ${boardId}) {
        items_page (limit: 500) {
          cursor
          items { id name group { id title } }
        }
      }
    }`;
    const result = await executeGraphQLQuery(query);
    return result.boards[0].items_page.items;
  } catch (error) {
    logError(error, 'Error fetching items (group)', { boardId, groupID });
    throw error;
  }
}

async function moveItemToGroup(itemId, targetGroupId) {
  try {
    logger.info('Moving item to group', { meta: { itemId, targetGroupId } });
    const mutation = `mutation {
      move_item_to_group (item_id: ${itemId}, group_id: "${escapeForGraphQL(targetGroupId)}") { id }
    }`;
    const response = await executeGraphQLQuery(mutation);
    return response.move_item_to_group;
  } catch (error) {
    logError(error, 'Error moving item to group', { itemId, targetGroupId });
    throw error;
  }
}

async function getItemsDetails(itemID) {
  try {
    logger.info('Fetching item details', { meta: { itemID } });
    const query = `query {
      items(ids: ${itemID}) {
        id
        name
        column_values {
          column { id title }
          id
          type
          value
        }
      }
    }`;
    const result = await executeGraphQLQuery(query);
    
    // Check if items array exists and has content
    if (!result.items || result.items.length === 0) {
      return null; // Item not found
    }
    
    return result.items[0];
  } catch (error) {
    logError(error, 'Error fetching item details', { itemID });
    return null; // Return null instead of throwing to allow graceful handling
  }
}

async function getItemInBoardWhereName(name, boardID) {
  try {
    logger.info('Searching item by name', { meta: { boardID, name } });
    const query = `query {
      boards(ids: ${boardID}) {
        id
        state
        items_page(
          limit: 1,
          query_params: {
            rules: [{ column_id: "name", compare_value: "${escapeForGraphQL(name)}" }]
          }
        ) {
          items { id name }
        }
      }
    }`;
    const response = await executeGraphQLQuery(query);
    return response.boards[0]?.items_page?.items?.[0];
  } catch (error) {
    logError(error, 'Error fetching item by name', { boardID, name });
    throw error;
  }
}

/**
 * CREATE ITEM — fixed escaping:
 * - item_name: escaped for GraphQL string
 * - column_values: embedded as a JSON string using asGraphQLJSONString()
 */
async function createItem(boardId, itemName, columnValues) {
  try {
    logger.info('Creating item', { meta: { boardId, itemName } });

    // Validate inputs
    if (!boardId || !itemName) {
      throw new Error('boardId and itemName are required for creating items');
    }

    const safeName = escapeForGraphQL(stripNewlines(itemName));
    const payload = columnValues || {};
    
    // Optional cleanup of multiline text fields and validate column values
    if (payload && typeof payload === 'object') {
      Object.keys(payload).forEach(k => {
        if (typeof payload[k] === 'string') {
          payload[k] = stripNewlines(payload[k]);
        }
      });
    }
    
    const columnValuesToken = asGraphQLJSONString(payload);

    const query = `
      mutation {
        create_item (
          board_id: ${boardId},
          item_name: "${safeName}",
          column_values: ${columnValuesToken}
        ) { id name }
      }
    `;

    logger.debug('Create item query built');
    const response = await executeGraphQLQuery(query);
    
    if (!response.create_item || !response.create_item.id) {
      throw new Error('Invalid response from Monday.com - no item ID returned');
    }
    
    return response.create_item;
  } catch (error) {
    logError(error, 'Error creating item', { boardId, itemName });
    throw error;
  }
}

/**
 * UPDATE ITEM NAME — Monday requires change_multiple_column_values with {"name": "..."} JSON string.
 */
async function updateItemName(boardId, itemId, newItemName) {
  let existingItem = null;
  try {
    logger.info('Updating item name', { meta: { boardId, itemId } });
    
    // First, check if the item exists
    existingItem = await getItemsDetails(itemId);
    if (!existingItem) {
      const error = new Error(`Could not find item with ID ${itemId} in board ${boardId}`);
      logError(error, 'Item not found for name update', { boardId, itemId, newItemName });
      throw error;
    }
    
    const payload = { name: stripNewlines(newItemName) };
    const columnValuesToken = asGraphQLJSONString(payload);

    const query = `
      mutation {
        change_multiple_column_values(
          board_id: ${boardId},
          item_id: ${itemId},
          column_values: ${columnValuesToken}
        ) { id name }
      }
    `;
    const response = await executeGraphQLQuery(query);
    return response.change_multiple_column_values;
  } catch (error) {
    // Handle specific Monday GraphQL error for inactive items: when the
    // API returns an error describing "inactive_pulse_ids" we treat this as
    // a non-retriable condition and skip updating the item.
    const apiErrors = error.api_errors || error.graphQLErrors || [];
    try {
      const errs = Array.isArray(apiErrors) ? apiErrors : [apiErrors];
      const inactiveErr = errs.find(e => {
        const data = e.extensions?.error_data || e.error_data || {};
        return data.inactive_pulse_ids && Array.isArray(data.inactive_pulse_ids) && data.inactive_pulse_ids.length;
      });
      if (inactiveErr) {
        logger.info('Item appears inactive/archived on Monday — creating a new item instead', { meta: { boardId, itemId, reason: inactiveErr } });
        try {
          const itemName = existingItem?.name || `Imported item ${Date.now()}`;
          const created = await createItem(boardId, itemName, {});
          logger.info('Created replacement item on Monday for inactive item (name update)', { meta: { boardId, newItemId: created.id } });
          return created;
        } catch (createError) {
          logError(createError, 'Error creating replacement item after inactive item name failure', { boardId, itemId, newItemName });
          throw createError;
        }
      }
    } catch (inner) {
      // ignore parsing errors and fall through to generic error handling
    }

    // If item doesn't exist, provide specific error message
    if (error.message && error.message.includes('Could not find item')) {
      logError(error, 'Item not found for name update', { boardId, itemId, newItemName });
    } else {
      logError(error, 'Error updating item name', { boardId, itemId, newItemName });
    }
    throw error;
  }
}

/**
 * UPDATE ITEM COLUMNS — same JSON-string rule as above.
 */
async function updateItem(boardId, itemId, columnValues) {
  let existingItem = null;
  try {
    logger.info('Updating item columns', { meta: { boardId, itemId } });
    
    // First, check if the item exists
    existingItem = await getItemsDetails(itemId);
    if (!existingItem) {
      const error = new Error(`Could not find item with ID ${itemId} in board ${boardId}`);
      logError(error, 'Item not found for column update', { boardId, itemId, columnValues });
      throw error;
    }

    const payload = columnValues || {};
    if (payload && typeof payload === 'object') {
      Object.keys(payload).forEach(k => {
        if (typeof payload[k] === 'string') payload[k] = stripNewlines(payload[k]);
      });
    }
    const columnValuesToken = asGraphQLJSONString(payload);

    const query = `mutation {
      change_multiple_column_values (
        item_id: ${itemId},
        board_id: ${boardId},
        column_values: ${columnValuesToken}
      ) { id name }
    }`;
    const response = await executeGraphQLQuery(query);
    return response.change_multiple_column_values;
  } catch (error) {
    // Detect inactive-pulse GraphQL error and skip update
    const apiErrors = error.api_errors || error.graphQLErrors || [];
    try {
      const errs = Array.isArray(apiErrors) ? apiErrors : [apiErrors];
      const inactiveErr = errs.find(e => {
        const data = e.extensions?.error_data || e.error_data || {};
        return data.inactive_pulse_ids && Array.isArray(data.inactive_pulse_ids) && data.inactive_pulse_ids.length;
      });
      if (inactiveErr) {
        logger.info('Item appears inactive/archived on Monday — creating a new item instead', { meta: { boardId, itemId, reason: inactiveErr } });
        try {
          const itemName = existingItem?.name || `Imported item ${Date.now()}`;
          const created = await createItem(boardId, itemName, columnValues);
          logger.info('Created replacement item on Monday for inactive item', { meta: { boardId, newItemId: created.id } });
          return created;
        } catch (createError) {
          logError(createError, 'Error creating replacement item after inactive item failure', { boardId, itemId });
          throw createError;
        }
      }
    } catch (inner) {
      // ignore parsing errors and continue to generic handling
    }

    // If item doesn't exist, provide specific error message
    if (error.message && error.message.includes('Could not find item')) {
      logError(error, 'Item not found for column update', { boardId, itemId, columnValues });
    } else {
      logError(error, 'Error updating item', { boardId, itemId });
    }
    throw error;
  }
}

async function createSubitem(parentItemId, subitemName) {
  try {
    logger.info('Creating subitem', { meta: { parentItemId, subitemName } });
    const query = `mutation {
      create_subitem (parent_item_id: ${parentItemId}, item_name: "${escapeForGraphQL(stripNewlines(subitemName))}") {
        id name
      }
    }`;
    const response = await executeGraphQLQuery(query);
    return response.create_subitem;
  } catch (error) {
    logError(error, 'Error creating subitem', { parentItemId });
    throw error;
  }
}

async function createGroup(boardId, groupName){
  try {
    logger.info('Creating group', { meta: { boardId, groupName } });
    const query = `mutation {
      create_group (board_id: ${boardId}, group_name: "${escapeForGraphQL(stripNewlines(groupName))}") { id title }
    }`;
    const response = await executeGraphQLQuery(query);
    return response.create_group;
  } catch (error) {
    logError(error, 'Error creating group', { boardId, groupName });
    throw error;
  }
}

async function uploadFileToMonday(filePath, ITEM_ID, COLUMN_ID) {
  const form = new FormData();
  const fileStream = fs.createReadStream(filePath);
  form.append('variables[file]', fileStream);
  form.append('query', `
    mutation ($file: File!) {
      add_file_to_column (file: $file, item_id: ${ITEM_ID}, column_id: "${escapeForGraphQL(COLUMN_ID)}") { id }
    }
  `);

  try {
    logger.info('Uploading file', { meta: { ITEM_ID, COLUMN_ID, filePath } });
    const response = await axios.post('https://api.monday.com/v2/file', form, {
      headers: { ...form.getHeaders(), Authorization: process.env.MONDAY_API_KEY },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 300000
    });
    logger.info('File uploaded', { meta: { ITEM_ID, COLUMN_ID } });
    return response?.data;
  } catch (error) {
    logError(error, 'Error uploading file', { ITEM_ID, COLUMN_ID });
    throw error;
  }
}

async function downloadFileFromMonday(assetId, downloadPath, fileName) {
  try {
    logger.info('Downloading file', { meta: { assetId, downloadPath, fileName } });
    const query = `query { assets(ids: ${assetId}) { public_url } }`;
    const response = await executeGraphQLQuery(query);
    const fileUrl = response.assets?.[0]?.public_url;
    if (!fileUrl) throw new Error('No file found for the provided asset ID.');

    await download(fileUrl, downloadPath, { filename: fileName });
    logger.info('File downloaded', { meta: { assetId, savedAs: path.join(downloadPath, fileName) } });
  } catch (error) {
    logError(error, 'Error downloading file', { assetId });
    throw error;
  }
}

// Backwards-compat alias kept (but improved escaping)
function removeFrenchSpecialCharacters(inputString) {
  return escapeForGraphQL(inputString);
}

module.exports = {
  executeGraphQLQuery,
  getItems,
  getItemsGroup,
  moveItemToGroup,
  getItemsDetails,
  getItemInBoardWhereName,
  createGroup,
  createItem,
  createSubitem,
  updateItemName,
  updateItem,
  uploadFileToMonday,
  downloadFileToMonday: downloadFileFromMonday, // alias if you used it elsewhere
  downloadFileFromMonday,
  // expose logger if you want to use it elsewhere
  logger,
};
