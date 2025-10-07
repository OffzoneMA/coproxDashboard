const fs = require('fs');
const fsExtra = require('fs-extra');
const path = require('path');
const axios = require('axios');
const winston = require('winston');

const scriptService = require('../services/scriptService');
const zendeskService = require('../services/zendeskService');
const mondayVilogiSyncService = require('../services/mondayVilogiSyncService');

// Logger setup
fsExtra.ensureDirSync('logs');
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(
      info => `${info.timestamp} ${info.level.toUpperCase()}: ${info.message}`
    )
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/zendesk-archive.log' }),
    new winston.transports.Console()
  ]
});

const DOWNLOAD_DIR = path.join(__dirname, '../downloads/archives/zendesk');
const DELAY_MS = 500;

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function saveAttachmentFile(url, ticketId, filename) {
  try {
    const response = await axios.get(url, { responseType: 'stream' });

    const filePath = path.join(DOWNLOAD_DIR, `zendesk - ${ticketId} - ${filename}`);
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });

    const writeStream = fs.createWriteStream(filePath);
    response.data.pipe(writeStream);

    await new Promise((resolve, reject) => {
      response.data.on('end', resolve);
      response.data.on('error', reject);
    });

    logger.info(`✅ File downloaded: ${filePath}`);
    return true;
  } catch (error) {
    logger.error(`❌ Failed to download file for ticket ${ticketId}: ${error.message}`);
    return false;
  }
}

async function redactAttachmentFromComment(ticketId, commentId, attachmentId) {
  try {
    await zendeskService.redactCommentAttachment(ticketId, commentId, attachmentId);
    logger.info(`🧽 Redacted attachment ${attachmentId} from ticket ${ticketId}`);
  } catch (error) {
    logger.error(`❌ Failed to redact attachment ${attachmentId} from ticket ${ticketId}: ${error.message}`);
  }
}

const archiveZendesk = {
  start: async () => {
    logger.info('🚀 Starting Zendesk ticket extraction...');
    // const logId = await scriptService.logScriptStart('archiveZendesk');

    try {
      const tickets = await zendeskService.getTicketsold();
      logger.info(`🎟️  Total tickets fetched: ${tickets.length}`);

      for (const ticket of tickets) {
        const comments = await zendeskService.getTicketsComments(ticket.id);

        for (let i = comments.length - 1; i >= 0; i--) {
          const { attachments, id: commentId } = comments[i];

          if (attachments && attachments.length > 0) {
            for (const attachment of attachments) {
              logger.info(`📎 Downloading: ${attachment.file_name}`);
              const success = await saveAttachmentFile(
                attachment.content_url,
                ticket.id,
                attachment.file_name
              );

              if (success) {
                await redactAttachmentFromComment(ticket.id, commentId, attachment.id);
              }

              await delay(DELAY_MS);
            }
          }
        }
      }

      // await scriptService.updateLogStatus('archiveZendesk', logId, 0, 'Script executed successfully');
      logger.info('✅ Zendesk ticket extraction and redaction completed successfully.');
    } catch (error) {
      // await scriptService.updateLogStatus('archiveZendesk', logId, -1, `Error: ${error.message}`);
      logger.error(`❌ Error during Zendesk extraction: ${error.message}`);
    }
  }
};

module.exports = archiveZendesk;