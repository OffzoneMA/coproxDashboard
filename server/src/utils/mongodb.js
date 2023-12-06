const mongoose = require('mongoose');

class MongoDB {
  static async connectToDatabase() {
    try {
      if (!mongoose.connection.readyState) {
        const username = 'apocair';
        const password = 'ZAO0krsyGD9R2na0';
        const clusterName = 'cluster0.ng3zsum.mongodb.net';
        const dbName = 'coprox';

        const connectionString = `mongodb+srv://${username}:${password}@${clusterName}/${dbName}?retryWrites=true&w=majority`;

        await mongoose.connect(connectionString, { useNewUrlParser: true, useUnifiedTopology: true });

        console.log('Connected to MongoDB using Mongoose');
      }
    } catch (error) {
      console.error('Error connecting to MongoDB:', error.message);
      throw error;
    }
  }

  static async closeConnection() {
    try {
      if (mongoose.connection.readyState) {
        await mongoose.disconnect();
        console.log('MongoDB connection closed');
      }
    } catch (error) {
      console.error('Error closing MongoDB connection:', error.message);
      throw error;
    }
  }

  static getCollection(collectionName) {
    console.log("getting the collection")
    return mongoose.connection.collection(collectionName);
  }
}

module.exports = MongoDB;
