// models/scriptModel.js

const mongoose = require('mongoose');

// Schema to track individual execution history (success, failure, etc.)
const ExecutionHistorySchema = new mongoose.Schema({
  endTime: {
    type: Date,
    required: true
  },
  status: {
    type: Number,
    required: true,
    enum: [0, -1] // 0: Success, -1: Error
  },
  message: {
    type: String,
    required: true
  }
});

// New schema to track logs for each execution instance
const LogSchema = new mongoose.Schema({
  logId: {
    type: mongoose.Schema.Types.ObjectId, // Unique ID for each log entry
    default: () => new mongoose.Types.ObjectId(),
  },
  status: {
    type: Number,
    required: true,
    enum: [1, 2, -1], // 1: In Progress, 2: Success, -1: Error
    default: 1, // Default is 'In Progress'
  },
  apicalls: {
    type: Number,
  },
  startTime: {
    type: Date,
    required: true,
    default: Date.now,
  },
  endTime: {
    type: Date,
  },
  message: {
    type: String,
  }
});

// The main schema for the script
const ScriptSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: Number,
    required: true,
    enum: [0, 1, 2, -1], // 0: Not started, 1: Queued, 2: In Progress, -1: Error
    default: 0
  },
  endpoint: {
    type: String,
    required: true
  },
  label: {
    type: String,
    required: true
  },
  options: {
    type: String,
    default: ''
  },
  execution_history: {
    type: [ExecutionHistorySchema],
    default: []
  },
  logs: {
    type: [LogSchema],
    default: []
  }
});

const ScriptModel = mongoose.model('ScriptState', ScriptSchema);

module.exports = ScriptModel;