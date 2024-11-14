const fs = require('fs');
const path = require('path');
const logFilePath = path.join(__dirname, '../../logs/cronExecution.txt');
const logFileErrorPath = path.join(__dirname, '../../logs/cronExecutionError.txt');


async function logExecution(...args) {
    const logStream = fs.createWriteStream(logFilePath, { flags: 'a' }); // 'a' means append
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} ${args.join(' ')}\n`;
    logStream.write(logMessage);
    process.stdout.write(logMessage); // Optional: Write to the console as well
}
async function logExecutionError(...args) {
    const logStream = fs.createWriteStream(logFileErrorPath, { flags: 'a' }); // 'a' means append
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} ${args.join(' ')}\n`;
    logStream.write(logMessage);
    process.stdout.write(logMessage); // Optional: Write to the console as well
}

module.exports = {
    logExecution,
    logExecutionError,
  };