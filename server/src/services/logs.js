const fs = require('fs');
const path = require('path');

// Ensure logs are written to /tmp on Vercel
const LOG_DIR = process.env.LOG_DIR || '/tmp';

const logFilePath = path.join(LOG_DIR, 'cronExecution.log');
const logFileErrorPath = path.join(LOG_DIR, 'cronExecutionError.log');
const logFileCounter = path.join(LOG_DIR, 'cronVilogiCounter.log');

async function logExecution(...args) {
    const logMessage = `${new Date().toISOString()} ${args.join(' ')}\n`;
    fs.appendFile(logFilePath, logMessage, (err) => {
        if (err) console.error(`Error writing to ${logFilePath}:`, err);
    });
    process.stdout.write(logMessage); // Optional: Write to console
}

async function logExecutionError(...args) {
    const logMessage = `${new Date().toISOString()} ${args.join(' ')}\n`;
    fs.appendFile(logFileErrorPath, logMessage, (err) => {
        if (err) console.error(`Error writing to ${logFileErrorPath}:`, err);
    });
    process.stdout.write(logMessage); // Optional: Write to console
}

async function logVilogiCounter(...args) {
    let lastValue = null;

    try {
        // Read the last log entry
        if (fs.existsSync(logFileCounter)) {
            const logContent = fs.readFileSync(logFileCounter, 'utf8');
            const logLines = logContent.trim().split('\n').filter(line => line);

            if (logLines.length > 0) {
                const lastLine = logLines[logLines.length - 1];
                const lastValueMatch = lastLine.match(/\d+(?=\s\(Diff:)/) || lastLine.match(/\d+$/);
                if (lastValueMatch) {
                    lastValue = parseInt(lastValueMatch[0], 10);
                }
            }
        }
    } catch (err) {
        console.warn("Impossible de lire le dernier log :", err.message);
    }

    const timestamp = new Date().toISOString();
    const currentValue = parseInt(args[0], 10); // Assume first argument is the counter
    const difference = lastValue !== null ? currentValue - lastValue : 'N/A';
    const logMessage = `${timestamp} ${currentValue} (Diff: ${difference})\n`;

    fs.appendFile(logFileCounter, logMessage, (err) => {
        if (err) console.error(`Error writing to ${logFileCounter}:`, err);
    });

    process.stdout.write(logMessage); // Optional: Write to console
}

module.exports = {
    logExecution,
    logExecutionError,
    logVilogiCounter,
};