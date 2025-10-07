const zendeskController = require('../controllers/zendeskController');
const ZendeskService = require('../services/zendeskService');
const scriptService = require('../services/scriptService');
const logs = require('../services/logs');

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const zendeskTicket = {
    start: async () => {
        console.log('Zendesk ticket start ...');
        logs.logExecution("zendeskTicket")

        //const LogId = await scriptService.logScriptStart('zendeskTicket');

        try {
            // Call controller function to fetch tickets
            const tickets = await zendeskController.getTicketsNew({}, {
                // Mock Express.js response object
                status: function (code) {
                    this.statusCode = code;
                    return this; // Return itself for method chaining
                },
                json: async data => {
                    // Call getUserFromID for each ticket
                    console.log('Fetched tickets:', data);
                    for (const ticket of data) {
                        //console.log(ticket.requester_id);


                        if (ticket.status == 'closed') {
                            console.log(`Skipping ticket ${ticket.id} because its status is Closed.`);
                          }
                          
                          else{
                            console.log('Ticket ID in start:',ticket.id)

                            if(ticket.custom_fields){
                                
                                const targetField = ticket.custom_fields.find(field => field.id === 15261491191197);
                                console.log("la valeur du champ copro est : ",targetField.value)
                                if (targetField && targetField.value == null) {
                                    await processUserOrganization(ticket.id,ticket.requester_id, ticket.subject)
                                }
                                else{
                                    await processUserOrganization(ticket.id,ticket.requester_id, ticket.subject)
                                }
                            }


                            //await processUserTags(ticket.id,ticket.requester_id);
                        
                          }
                          await delay(1000); 
                    }
                },
                // ... other Express.js response methods that you might use
            });

            // Add your additional synchronization logic here, using the fetched tickets data
        } catch (error) {
            // Handle errors
            //await scriptService.updateLogStatus('synchroFactureOCR', LogId, -1, `An error occurred: ${error.message}`);
            console.error('An error occurred:', error.message);
        }
    },
};

async function processUserOrganization(ticket_id, requesterId, subject) {
    const user = await zendeskController.getUserFromID({ params: { ID: requesterId } }, {
        status: function (code) {
            this.statusCode = code;
            return this;
        },
        json: async data => {
            const userOrganizationId = data[0].organization_id;
            if (userOrganizationId) {
                let organisation = await ZendeskService.getOrganizationsById(userOrganizationId)
                let coproName = organisation[0].name
                const pattern = /^S\d{3}$/;


                // Test if the value matches the pattern
                if (pattern.test(coproName)) {
                    console.log(subject)
                    if (!pattern.test(subject) && !subject.startsWith(coproName)) {
                        subject = `${coproName} - ${subject}`;
                        console.log("New subject : ",subject)
                    }
                    // If organization ID is available, you can update the data
                    console.log('starting update ticket : ', ticket_id,' With Organisation in Custom field : ', coproName);
                    const updateData = {
                        "ticket": {
                        "subject": subject,
                        "custom_fields": [
                            {
                            "id": "15261491191197",
                            "value": userOrganizationId,
                            }]
                        }
                    };
                    
                    await ZendeskService.updateTicket(ticket_id,updateData)
                }
                await delay(1000); 
            }else{
                await delay(1000); 
                console.log("User's Orgnisation is empty - No  update")
            }

        },
    });

    // If you need to perform additional actions based on the organization, you can do it here
    // checkAndPerformOtherAction(ticket_id, userOrganization);
}

async function processUserTags(ticket_id, requesterId) {
    //console.log('Ticket ID in processUserTags:', ticket_id);
    const user = await zendeskController.getUserFromID({ params: { ID: requesterId } }, {
        // Mock Express.js response object for getUserFromID
        status: function (code) {
            this.statusCode = code;
            return this; // Return itself for method chaining
        },
        json: async data => {
            const userTags = data[0].tags;
            console.log(userTags);

            if (userTags && userTags.length > 0) {
                // If user tags are not empty, perform actions
                checkAndPerformAction(ticket_id, userTags);

            }
        },
        // ... other Express.js response methods that you might use
    });
}


async function checkAndPerformAction(ticket_id, tags) {
    console.log('starting with tags: ', tags);
    console.log()
    body={ticket: {tags: tags}};
    params ={  ticket_id: ticket_id, tagToAdd: tags};

    
    zendeskController.updateTicket({ params});
    // Use Promise.all to wait for all updateTicket promises to complete
    await Promise.all(tags.map(async (tag) => {
        console.log('------------------------------------------- here is the tag', tag, '------------------for ticket', ticket_id);
  
        switch (tag) {
            
            case 'cs':
                console.log('cs')
            case 'locataire':
                console.log('locataire') 
            case 'locataire':
                console.log('locataire')    
            default:
                // Default case if the tag is not matched
                return Promise.resolve(); // Resolve with a promise for default case
        }
    }));
}

module.exports = zendeskTicket;
