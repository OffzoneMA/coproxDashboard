const mongoose = require('mongoose');
require('dotenv').config();
const path = require('path');

class MongoDB {
  /**
   * Establish a MongoDB connection using Mongoose
   */
  static async connectToDatabase() {
    try {
      // Already connected
      if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
      }

      // If connecting, wait until it's ready
      if (mongoose.connection.readyState === 2) {
        await new Promise((resolve, reject) => {
          mongoose.connection.once('connected', resolve);
          mongoose.connection.once('error', reject);
        });
        return mongoose.connection;
      }

      const username = process.env.MONGODB_USERNAME;
      const password = process.env.MONGODB_PASSWORD;
      const clusterName = process.env.MONGODB_CLUSTER_NAME;
      const dbName = process.env.MONGODB_DB_NAME;

      if (!username || !password || !clusterName || !dbName) {
        throw new Error('Missing MongoDB environment variables');
      }

      const connectionString = `mongodb+srv://${username}:${password}@${clusterName}/${dbName}?retryWrites=true&w=majority`;

      await mongoose.connect(connectionString, {
        serverSelectionTimeoutMS: 10000, // 10s
        connectTimeoutMS: 10000,        // 10s
      });

      console.log('✅ Connected to MongoDB with Mongoose');
      return mongoose.connection;
    } catch (error) {
      console.error('❌ Error connecting to MongoDB:', error.message);
      throw error;
    }
  }

  /**
   * Close MongoDB connection
   */
  static async closeConnection() {
    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
        console.log('🔌 MongoDB connection closed');
      }
    } catch (error) {
      console.error('❌ Error closing MongoDB connection:', error.message);
      throw error;
    }
  }

  /**
   * Get a raw collection reference
   */
  static getCollection(collectionName) {
    if (mongoose.connection.readyState !== 1) {
      throw new Error('Database not connected. Call connectToDatabase() first.');
    }
    return mongoose.connection.collection(collectionName);
  }

  /**
   * Load a schema from /models and attach middleware
   */
  static addSaveMiddleware(modelName) {
    const modelPath = path.join(__dirname, '..', 'models', modelName.toLowerCase());
    const model = require(modelPath);

    const collectionSchema = new mongoose.Schema(model.schema);

    // Add pre-save hook
    collectionSchema.pre('save', function (next) {
      // console.log(`Saving document to ${modelName}`);
      next();
    });

    return mongoose.models[modelName] || mongoose.model(modelName, collectionSchema);
  }
}

module.exports = MongoDB;