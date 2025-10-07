// src/logger.js
const fs = require('fs-extra');
const path = require('path');
const winston = require('winston');

const DailyRotateFile = (() => {
  try { return require('winston-daily-rotate-file'); } catch { return null; }
})();

// Single project-wide folders (same server/folder)
const ROOT_LOG_DIR =
  process.env.LOG_DIR || (process.env.VERCEL ? '/tmp' : path.join(process.cwd(), 'logs'));

// Put combined errors in the same folder (or override with LOG_ERRORS_DIR)
const ERRORS_LOG_DIR = process.env.LOG_ERRORS_DIR || ROOT_LOG_DIR;

fs.ensureDirSync(ROOT_LOG_DIR);
fs.ensureDirSync(ERRORS_LOG_DIR);

function redact(value) {
  if (!value) return value;
  const s = String(value);
  return s
    .replace(/(token|api(?:_)?key|authorization|pwd|password|idSyndic)\s*=?\s*([A-Za-z0-9._\-]+)/gi, '$1=[REDACTED]')
    .replace(/[?&](token|pwd|password|idSyndic)=[^&]+/gi, m => m.replace(/=.*/, '=[REDACTED]'))
    .slice(0, 5000);
}

function jsonOrPrintf(service) {
  const base = [
    winston.format.timestamp(),
    winston.format((info) => { info.service = service; return info; })(),
  ];
  if (process.env.LOG_JSON === 'true') {
    return winston.format.combine(...base, winston.format.json());
  }
  return winston.format.combine(
    ...base,
    winston.format.printf(info =>
      `${info.timestamp} ${info.level.toUpperCase()} [${info.service}]: ${info.message}` +
      (info.meta ? ` ${JSON.stringify(info.meta)}` : '')
    )
  );
}

/** Create a logger for a named service within the same project/folder */
function createServiceLogger(serviceName) {
  const level = process.env.LOG_LEVEL || 'info';
  const useConsole = process.env.LOG_TO_CONSOLE !== 'false';

  const transports = [];

  if (DailyRotateFile) {
    transports.push(
      new DailyRotateFile({
        dirname: ROOT_LOG_DIR,
        filename: `${serviceName}.%DATE%.log`, // per-service file
        datePattern: 'YYYY-MM-DD',
        maxSize: process.env.LOG_MAX_SIZE || '10m',
        maxFiles: process.env.LOG_MAX_FILES || '14d',
        zippedArchive: true,
        level,
      })
    );
    transports.push(
      new DailyRotateFile({
        dirname: ERRORS_LOG_DIR,
        filename: `errors.%DATE%.log`,       // shared daily errors
        datePattern: 'YYYY-MM-DD',
        maxSize: process.env.LOG_MAX_SIZE || '20m',
        maxFiles: process.env.LOG_MAX_FILES || '30d',
        zippedArchive: true,
        level: 'error',
      })
    );
  } else {
    transports.push(
      new winston.transports.File({
        dirname: ROOT_LOG_DIR,
        filename: `${serviceName}.log`,
        level,
        maxsize: 10 * 1024 * 1024,
        maxFiles: 3,
      })
    );
    transports.push(
      new winston.transports.File({
        dirname: ERRORS_LOG_DIR,
        filename: `errors.log`,
        level: 'error',
        maxsize: 20 * 1024 * 1024,
        maxFiles: 5,
      })
    );
  }

  if (useConsole) {
    transports.push(
      new winston.transports.Console({
        level,
        format: winston.format.combine(
          winston.format.colorize(),
          jsonOrPrintf(serviceName)
        ),
      })
    );
  }

  const logger = winston.createLogger({
    level,
    format: jsonOrPrintf(serviceName),
    transports,
    exitOnError: false,
    exceptionHandlers: [
      ...(DailyRotateFile
        ? [new DailyRotateFile({
            dirname: ERRORS_LOG_DIR,
            filename: `errors.%DATE%.log`,
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            level: 'error',
          })]
        : [new winston.transports.File({
            dirname: ERRORS_LOG_DIR,
            filename: `errors.log`,
            level: 'error',
          })]),
      ...(useConsole ? [new winston.transports.Console({ level: 'error' })] : []),
    ],
    rejectionHandlers: [
      ...(DailyRotateFile
        ? [new DailyRotateFile({
            dirname: ERRORS_LOG_DIR,
            filename: `errors.%DATE%.log`,
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            level: 'error',
          })]
        : [new winston.transports.File({
            dirname: ERRORS_LOG_DIR,
            filename: `errors.log`,
            level: 'error',
          })]),
      ...(useConsole ? [new winston.transports.Console({ level: 'error' })] : []),
    ],
  });

  function logError(err, message, meta = {}) {
    const payload = {
      ...meta,
      name: err?.name,
      message: err?.message,
      stack: err?.stack,
      status: err?.response?.status,
      api: err?.response?.data ? tryParse(err.response.data) : undefined,
    };
    logger.error(message || err?.message || 'Error', { meta: payload });
  }

  function tryParse(x) {
    try { return typeof x === 'string' ? JSON.parse(x) : x; }
    catch { return '[unparsable]'; }
  }

  return { logger, logError, redact, LOG_DIR: ROOT_LOG_DIR, ERRORS_LOG_DIR };
}

module.exports = { createServiceLogger, redact };
