const fs = require('fs');
const zendeskController = require('../controllers/zendeskController');
const zendeskService = require('../services/zendeskService');
const path = require('path');

const logFilePath = path.join(__dirname, '../../logs/cron.txt');
const logStream = fs.createWriteStream(logFilePath, { flags: 'a' }); // 'a' means append

function FileLog(...args) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} ${args.join(' ')}\n`;
  logStream.write(logMessage);
  process.stdout.write(logMessage); // Optional: Write to the console as well
}



const syncZendeskTags = {
    start: async () => {
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
