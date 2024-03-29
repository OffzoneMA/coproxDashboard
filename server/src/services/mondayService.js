// mondayService.js
const mondaySdk = require("monday-sdk-js");

// Initialize Monday SDK
const monday = mondaySdk();
monday.setApiVersion("2023-10");
monday.setToken(process.env.MONDAY_API_KEY)

async function executeGraphQLQuery(queryString) {
  try {
      console.log(queryString)
      const res = await monday.api(queryString);
      console.log(res.data);
      return res.data ;
    

  } catch (error) {
    if (error.response && error.response.data && error.response.data.errors) {
      const errorMessages = error.response.data.errors.map(err => err.message).join(', ');
      throw new Error(`Error executing GraphQL query: ${errorMessages}`);
    } else {
      throw new Error('Error executing GraphQL query:', error.response ? error.response.data : error.message);
    }
  }
}
let cachedItemFields;

async function fetchItemFields() {

  cachedItemFields="";      
const introspectionQuery = `query IntrospectionQuery {__schema {types {namefields {nametype {nameofType {name}}}}}}`;
 const introspectionResult = await monday.api(introspectionQuery);
  console.log(introspectionResult)
  const itemFields = introspectionResult.data.__schema.types.find(type => type.name === 'Item').fields;
  console.log(itemFields)
  cachedItemFields = itemFields.map(field => field.name);

  return cachedItemFields;
}

// Function to get all items in a board
async function getItems(boardId) {
  try {
    const query = `query { boards(ids: ${boardId}) { items_page (limit: 100) { cursor items { id  name  } } } }`;
    result=await executeGraphQLQuery(query)
    return result.boards[0]
  } catch (error) {
    throw new Error('Error fetching items:', error.message);
  }
}
async function getItemsDetails(itemID) {
  try {
    //await fetchItemFields()
    const query = `query { items(ids: ${itemID}) { id name column_values {column {id  title}  id type value    }} }`;
    const result = await executeGraphQLQuery(query);
    //console.log("name : ",result.items[0].name)
    //console.log("values : ",result.items[0].column_values[0].value)
    //for(column in result.items[0].column_values)
      //console.log("ColumnID : ",result.items[0].column_values[column].id,"                 Column : ",result.items[0].column_values[column].column.title,"                  Value : " ,result.items[0].column_values[column].value)
    //console.log(result.items[0])
    //console.log("---------------------------")
    return result.items[0];
  } catch (error) {
    throw new Error('Error fetching items:', error.message);
  }
}


async function getItemInBoardWhereName(name, boardID) {
  try {
    // Query to fetch the item based on its name within the specified board
    const query = `query { boards(ids: ${boardID}) { id state items_page(limit: 1, query_params: { rules: [{ column_id: \"name\", compare_value:  \"${name}\"}] }) { items { id name } } } }`;

    // Execute the query
    const response = await executeGraphQLQuery(query);

    
      // Return the first item found (assuming unique names)
      return response.boards[0].items_page.items[0];

  } catch (error) {
    // Handle any errors
    console.error("Error fetching item:", error);
    throw error;
  }
}

// Function to create a new item in a board
async function createItem(boardId, itemName, columnValues) {
  try {
    const query = `mutation {
      create_item (
        board_id: ${boardId},
        item_name: "${itemName}",
        column_values: "${JSON.stringify(columnValues).replace(/"/g, '\\"')}"
      ) {id name}}`;
    const response = await executeGraphQLQuery(query);
    return response.create_item;
  } catch (error) {
    throw new Error('Error creating item:', error.message);
  }
}

// Function to create a new item in a board
async function updateItem(boardId,itemId, columnValues) {
  try {
    const columnValuesString = JSON.stringify(columnValues).replace(/"/g, '\\"');
    const query = `mutation {
      change_multiple_column_values (
        item_id: ${itemId},
        board_id: ${boardId},
        column_values: "${columnValuesString}"
      ) {
        id
      }
    }`;
    const response = await executeGraphQLQuery(query);
    return response.change_multiple_column_values;
  } catch (error) {
    throw new Error('Error updating item:', error.message);
  }
}

// Function to create a subitem under a parent item
async function createSubitem(parentItemId, subitemName) {
  try {
    const response = await monday.api(`mutation { create_subitem (parent_item_id: ${parentItemId}, item_name: "${subitemName}") { id name } }`);
    return response.data.create_subitem;
  } catch (error) {
    throw new Error('Error creating subitem:', error.message);
  }
}

module.exports = {
  executeGraphQLQuery,
  getItems,
  getItemsDetails,
  getItemInBoardWhereName,
  createItem,
  updateItem,
  createSubitem,
};
