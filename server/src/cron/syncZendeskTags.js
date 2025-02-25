const fs = require('fs');
const zendeskController = require('../controllers/zendeskController');

const scriptService = require('../services/scriptService');
const zendeskService = require('../services/zendeskService');
const path = require('path');
const logs = require('../services/logs');

// Ensure logs are written to /tmp on Vercel
const LOG_DIR = process.env.LOG_DIR || '/tmp';
const logFilePath = path.join(LOG_DIR, 'cron.log');

// Function to log messages
function FileLog(...args) {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} ${args.join(' ')}\n`;

    // Append to log file
    fs.appendFile(logFilePath, logMessage, (err) => {
        if (err) console.error(`Error writing to ${logFilePath}:`, err);
    });

    process.stdout.write(logMessage); // Optional: Write to console
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  

const syncZendeskTags = {
    start: async () => {
        logs.logExecution("syncZendeskTags")
        try {
            let copros = await zendeskService.getAllorganizations();

            for (const copro of copros) {
                console.log(`Analyzing users for organization: ${copro.name}`);
                let users = await zendeskService.getUsersByOrg(copro.id);

                for (const user of users) {
                    console.log(`Analyzing user: ${user.name}`);
                    let tickets = await zendeskService.getTicketsByUser(user.id);

                    for (const ticket of tickets) {
                        if(ticket.status=="closed") continue
                        
                        //console.log(`checking ticket ${ticket.id} by adding tags from user ${user.name}`);
                        await PushTagToTicket(user.tags, ticket.tags, ticket.id);
                    }

                    await delay(200);
                }

                await delay(200);
            }
        } catch (error) {
            FileLog('| syncZendeskTags | init | error :',error);

        }
    }
};

async function PushTagToTicket(userTags, ticketTags, ticketId) {
    try {
        for (const userTag of userTags) {
            if (!ticketTags.includes(userTag)) {
                console.log(`Updating ticket ${ticketId} by adding tag: ${userTag}`);
                console.log(`Old tags: ${ticketTags}`);
                
                ticketTags.push(userTag);
                
                console.log(`New tags: ${ticketTags}`);
                
                const updateData = {
                    "ticket": {
                        "tags": ticketTags
                    }
                };
                console.log(updateData)
                
                
                await zendeskService.updateTicket(ticketId, updateData);
            }
        }
    } catch (error) {
        FileLog('| syncZendeskTags | init | error :',error);

    }
}

module.exports = syncZendeskTags;
