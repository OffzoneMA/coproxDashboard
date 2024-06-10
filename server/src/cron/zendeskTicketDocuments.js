
const ZendeskService = require('../services/zendeskService');
const dropboxService = require('../services/dropboxService');
const logs = require('../services/logs');
const axios = require('axios');
require('dotenv').config();
const fs = require('fs');


async function HandleTickets(ticket,ticketDetails) {
  if (ticket.status == 'solved' || ticket.status == 'pending' || ticket.status == 'closed' || ticket.custom_status_id =='15662538914333') {
    console.log(`Skipping ticket ${ticket.id} because its status is not new.`);
    return null;
  }

  const emailContent = ticketDetails.body; // Assuming the ticket content is in the description field

  try {
    const message = await generateAnswerToEmail(emailContent);
    await updateZendeskTicketCategory(ticket.id, message);
    console.log(emailContent)
    return { ticketId: ticket.id};
  } catch (error) {
    console.error(`Error categorizing Zendesk ticket ${ticket.id}:`, error.message);
    return { ticketId: ticket.id, error: error.message };
  }
}

async function updateZendeskTicketCategory(ticketId, message) {
  try {
    console.log("the category to update is : ",message)
    
    const updateData = {
      "ticket": {
        "comment": {
          "body": message,
          "public": false
        },
        "custom_status_id": "15662538914333",
      }
    };
    await ZendeskService.updateTicket(ticketId,updateData)
  } catch (error) {
    console.error(`Error updating Zendesk ticket ${ticketId} category:`, error.message);
    throw error;
  }
}

async function answerNewZendeskTickets() {
  try {
    const tickets = await ZendeskService.getTicketsNew();
    const delay = async (ms) => new Promise(resolve => setTimeout(resolve, ms));


    const answeredTickets = [];
    let ticketCount = 0;

  for (const ticket of tickets) {
    const ticketDetails = await ZendeskService.getTicketsComments(ticket.id);
    const lengthComment = ticketDetails.length;
  
    for (let i = lengthComment - 1; i >= 0; i--) {
      if (ticketDetails[i].attachments) {
        for (const attachment of ticketDetails[i].attachments) {
          await saveFile(attachment.content_url,ticket.id,attachment.file_name)
          await saveFileToDropbox(`downloads/zendesk/zendesk - ${ticket.id} - ${attachment.file_name}`,`zendesk - ${ticket.id} - ${attachment.file_name}`)
        }

      } else {

      }
      console.log("-------------------------------------------------------------------------------------------------------------");
    }
  


    // Add a delay between tickets (e.g., 5000 milliseconds = 5 seconds)
    await delay(500);

    // Increment the counter
    ticketCount++;

    // Break the loop if the counter reaches 10
    if (ticketCount === 0) {
        break;
    }
}

    return answeredTickets;
  } catch (error) {
    console.error('Error generating answer to Zendesk tickets:', error.message);
    throw error;
  }
}
const saveFileToDropbox = async (filePath,filename) => {
  const req = {
      filename: filename,
      buffer: await fs.promises.readFile(filePath),
      foldername:"coprox"

  };
  
  const res = {
    json: (response) => console.log(response),
    status: (code) => ({ json: (response) => console.log(response) }),
  };

  await dropboxService.uploadFile(req, res);
};

const saveFile = async (Url,ticketID,filename) => {

  try {
    const response = await axios({
      method: 'get',
      url: `${Url}`,
      responseType: 'stream',
    });    

    let outputFileName= `downloads/zendesk/zendesk - ${ticketID} - ${filename}`
    // Pipe the response stream to a file
    response.data.pipe(fs.createWriteStream(outputFileName));

    // Wait for the file to be fully written
    await new Promise((resolve, reject) => {
      response.data.on('end', resolve);
      response.data.on('error', reject);
    });

    console.log('File downloaded successfully:', outputFileName);
  } catch (error) {
    console.error('Error downloading file:', error.message);
  }
};

// Modified code for zendeskTicketAI
const zendeskTicketDocuments = {
  start: async () => {
    logs.logExecution("zendeskTicketDocuments")
    try {
      const answeredTickets = await answerNewZendeskTickets();
      console.log('answered Zendesk tickets:', answeredTickets);
    } catch (error) {
      console.error('Error:', error);
    }
  },
};

// Example usage
// Uncomment the line below if you want to use the existing example
// zendeskTicketAI.start();
module.exports = zendeskTicketDocuments;
