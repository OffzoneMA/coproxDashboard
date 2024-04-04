const fs = require('fs');
const path = require('path');
const logFilePath = path.join(__dirname, '../../logs/cronExecution.txt');
const logStream = fs.createWriteStream(logFilePath, { flags: 'a' }); // 'a' means append

async function logExecution(...args) {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} ${args.join(' ')}\n`;
    logStream.write(logMessage);
    process.stdout.write(logMessage); // Optional: Write to the console as well
}

module.exports = {
    logExecution,
  };