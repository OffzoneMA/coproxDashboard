const mongoose = require('mongoose');
require('dotenv').config(); 
const path = require('path');

class MongoDB {
  static async connectToDatabase() {
    try {
      if (!mongoose.connection.readyState) {
        const username = process.env.MONGODB_USERNAME;
        const password = process.env.MONGODB_PASSWORD;
        const clusterName = process.env.MONGODB_CLUSTER_NAME;
        const dbName = process.env.MONGODB_DB_NAME;

        
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
    console.log("getting the collection");
    return mongoose.connection.collection(collectionName);
  }

  static addSaveMiddleware(modelName) {
    const modelPath = path.join(__dirname, '..', 'models', modelName.toLowerCase());
    const model = require(modelPath);

    const collectionSchema = new mongoose.Schema(model.schema);

    // Add a middleware function before saving a document
    collectionSchema.pre('save', function (next) {
      console.log(`Middleware: Saving document to ${modelName}`);
      next();
    });

    return mongoose.model(modelName, collectionSchema);
  }
}

module.exports = MongoDB;
