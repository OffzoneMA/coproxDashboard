const fs = require('fs');
const zendeskController = require('../controllers/zendeskController');
const zendeskService = require('../services/zendeskService');

const logFilePath = 'logs/syncZendeskTagsLogs.txt';

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function log(message) {
    // Log to console
    console.log(message);

    // Log to file
    fs.appendFileSync(logFilePath, `${new Date().toISOString()} - ${message}\n`, 'utf8');
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
            log(`Error occurred: ${error.message}`);
        }
    }
};

async function PushTagToTicket(userTags, ticketTags, ticketId) {
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
            log(`Update data: ${ticketId} by adding tag: ${userTag} `);
            
            await zendeskService.updateTicket(ticketId, updateData);
        }
    }
}

module.exports = syncZendeskTags;
