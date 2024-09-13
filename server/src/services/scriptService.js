const mongoose = require('mongoose');
const MongoDB = require('../utils/mongodb');
const { ObjectId } = require('mongodb');

mongoose.set('useFindAndModify', false);

// Helper function to connect to the database and execute a callback
async function connectAndExecute(callback) {
  try {
    await MongoDB.connectToDatabase();
    const result = await callback();
    return result;
  } catch (error) {
    console.error('Error connecting and executing:', error.message);
    throw error;
  }
}

// Update the script status
async function updateScriptStatus(scriptName, status) {
  try {
    return connectAndExecute(async () => {
    const scriptCollection = MongoDB.getCollection('ScriptState');
    const result = await scriptCollection.updateOne({ name: scriptName }, { $set: { status } });
    return result;
  });}
  catch (error) {
    console.error('Error connecting and executing:', error.message);
    throw error;
  }
  
}

// Get the script state by name
async function getScriptStateLogs() {
  try {
    return await connectAndExecute(async () => {
      const scriptCollection = MongoDB.getCollection('ScriptState');
      
      // Fetch all scripts
      const scripts = await scriptCollection.find().toArray();
      
      if (!scripts || scripts.length === 0) {
        throw new Error('No scripts found');
      }

      // Flatten logs from all scripts, sort by startTime, and map to the desired format
      const allLogs = scripts.flatMap(script => 
        script.logs
          .sort((a, b) => new Date(a.startTime) - new Date(b.startTime)) // Sort logs by startTime
          .map(log => {
            const startTime = new Date(log.startTime);
            const endTime = new Date(log.endTime);
            const duration = endTime - startTime; // Calculate duration in milliseconds

            return {
              ScriptName: script.name,
              Start: startTime,
              End: endTime,
              Duration: duration > 0 ? duration : 0, // Ensure non-negative duration
              Status: log.status,
            };
          })
      );

      return allLogs;
    });
  } catch (error) {
    console.error('Error connecting and executing:', error.message);
    throw error;
  }
}

// Log when the script starts
async function logScriptStart(scriptName) {
  try {
    console.log("Starting : ", scriptName);
    const logEntry = {
      logId: new ObjectId(), // Generate a unique ObjectID
      status: 1, // In progress
      startTime: new Date(),
    };
    return connectAndExecute(async () => {
      const scriptCollection = MongoDB.getCollection('ScriptState');
      const result = await scriptCollection.findOneAndUpdate(
        { name: scriptName },
        { $push: { logs: logEntry } },
        { returnDocument: 'after' } // Return the updated document
      );
      return logEntry.logId;
    });
  } catch (error) {
    console.error('Error logging script start:', error.message);
    throw error;
  }
}

// Update log entry for script success or failure
async function updateLogStatus(scriptName, logId, status, message) {
  try {
    const endTime = new Date();
    return await connectAndExecute(async () => {
      const scriptCollection = MongoDB.getCollection('ScriptState');
      const result = await scriptCollection.updateOne(
        { name: scriptName, 'logs.logId': logId },
        {
          $set: {
            'logs.$.status': status,
            'logs.$.endTime': endTime,
            'logs.$.message': message,
          },
        }
      );
      if (result.matchedCount === 0) {
        throw new Error('No log entry found with the given logId');
      }
      return logId; // Assuming you want to return the logId that was updated
    });
  } catch (error) {
    console.error('Error updating log status:', error.message);
    throw error;
  }
}

module.exports = {
  updateScriptStatus,
  getScriptStateLogs,
  logScriptStart,
  updateLogStatus
};