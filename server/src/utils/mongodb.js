// mongodb.js
const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017/your-database-name';
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function getCollection(collectionName) {
  await client.connect();
  return client.db().collection(collectionName);
}

module.exports = { getCollection };
