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
    });
  } catch (error) {
    console.error('Error connecting and executing:', error.message);
    throw error;
  }
}

async function getScriptState(scriptName) {
  try {
    return await connectAndExecute(async () => {
      const scriptCollection = MongoDB.getCollection('ScriptState');
      const scripts = await scriptCollection.findOne({ name: scriptName });
      return scripts; // Return the result of the query
    });
  } catch (error) {
    console.error('Error connecting and executing:', error.message);
    throw error;
  }
}

async function getScriptStateLogs() {
  try {
    return await connectAndExecute(async () => {
      const scriptCollection = MongoDB.getCollection('ScriptState');
      
      // Fetch all scripts
      const scripts = await scriptCollection.find().toArray();
      
      if (!scripts || scripts.length === 0) {
        throw new Error('No scripts found');
      }
      
      // Flatten logs from all scripts, map to the desired format, and sort by Start time
      const allLogs = scripts.flatMap(script => 
        Array.isArray(script.logs) ? 
          script.logs
            .map(log => {
              const startTime = new Date(log.startTime);
              const endTime = new Date(log.endTime);
              const durationMillis = endTime - startTime;
              const durationMinutes = durationMillis > 0 ? durationMillis / 60000 : 0; // Convert to minutes

              return {
                ScriptName: script.name,
                Start: startTime,
                End: endTime,
                Duration: durationMinutes, // Duration in minutes
                Status: log.status,
              };
            }) : [] // Return empty array if logs is not an array
      );

      // Sort the final logs by start time
      allLogs.sort((a, b) => new Date(a.Start) - new Date(b.Start));

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

async function logExecutionHistory(name, startTime, endTime, status, message){
  try {
    const historyData = {
      status: status, // In progress
      endTime: endTime,
      startTime: startTime,
      message:message
    };
    return connectAndExecute(async () => {
      const scriptCollection = MongoDB.getCollection('ScriptState');
      const result = await scriptCollection.findOneAndUpdate(
        { name: name },
        { $push: { execution_history: historyData } },
        { returnDocument: 'after' } // Return the updated document
      );
      return result;
    });
  }catch (error) {
    console.error('Error updating log status:', error.message);
    throw error;
  }
}

// Sync function
async function getListScripts(req, res) {
  const scriptName = req.params.scriptName;

  // Update script state to 1 (started) in the database
  try {
    return connectAndExecute(async () => {
      console.log(scriptName);
      const coproprieteCollection = MongoDB.getCollection('ScriptState');
      const scriptArray = await coproprieteCollection.find({}).toArray();

      scriptArray.forEach(script => {
        if (script.execution_history && script.execution_history.length > 0) {
          const lastExecution = script.execution_history[script.execution_history.length - 1].endTime;
          script.lastExecution = lastExecution;
          delete script.execution_history;
        }
      });

      console.log(scriptArray);
      res.status(200).json(scriptArray);
      return;
    });
  } catch (error) {
    res.status(500).send(`Error setting ${scriptName} script state to started: ${error}`);
  }
}

module.exports = {
  updateScriptStatus,
  getScriptState,
  getScriptStateLogs,
  logScriptStart,
  updateLogStatus,
  logExecutionHistory,
  getListScripts
};