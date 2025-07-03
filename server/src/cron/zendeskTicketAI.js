
const ZendeskService = require('../services/zendeskService');
const axios = require('axios');
const scriptService = require('../services/scriptService');
const logs = require('../services/logs');
require('dotenv').config();


async function generateAnswerToEmail(emailContent) {
  try {
    const messageaEnvoyer = `Je suis syndic de copropriété et je gère différentes copropriétés. J'ai reçu un e-mail de la part de l'une des copropriétés que j'administre. Pourrait tu savoir si cette personne se plein du service que nous proposant en tant que syndic de coproprieté.la réponse doit etre au format suivant : Oui ou Non. Voici son e-mail :  ${emailContent}.\n "`
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'user', content: messageaEnvoyer },
      ],
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_TOKEN}`,
      },
    });
    //console.log(messageaEnvoyer)
    const message = response.data.choices[0].message.content;
    return message;
  } catch (error) {
    console.error('Error categorizing email:', error.message);
    throw error;
  }
}

async function fetchZendeskTickets() {
  try {
    const response = await axios.get(`https://${process.env.ZENDESK_SUBDOMAIN}.zendesk.com/api/v2/tickets.json?status=new&sort_by=created_at&sort_order=desc&per_page=1"`, {
      auth: {
        username: process.env.ZENDESK_USERNAME,
        password: process.env.ZENDESK_PASSWORD,
      },
    });

    return response.data.tickets;
  } catch (error) {
    console.error(`Error fetching Zendesk tickets with status news:`, error.message);
    throw error;
  }
}

async function HandleTickets(ticket,ticketDetails) {
  if (ticket.status == 'solved' || ticket.status == 'pending' || ticket.status == 'closed' || ticket.custom_status_id =='15662538914333') {
    console.log(`Skipping ticket ${ticket.id} because its status is not new.`);
    return null;
  }

  const emailContent = ticketDetails.body; // Assuming the ticket content is in the description field

  try {
    const message = await generateAnswerToEmail(emailContent);
    //await updateZendeskTicketCategory(ticket.id, message);
    console.log(message)
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
  let users = [15116020640413, 15115995844637];
  let coproxUsers = [15116020640413, 15115995844637,16427900046109,15114640058525,15206663482269,15420362913693,16310145706013];
  

  if (ticket.custom_status_id == 15662538914333) {
    // break if the AI already generated a message to the ticket 
    break;
  }
  if (users.includes(ticket.assignee_id)) {
    const ticketDetails = await ZendeskService.getTicketsComments(ticket.id);
    const lengthComment = ticketDetails.length;


    // If Last message from AI break
    if(coproxUsers.includes(ticketDetails[lengthComment-1].author_id)){

    }else{
      for (let i = lengthComment - 1; i >= 0; i--) {


        if (coproxUsers.includes(ticketDetails[i].author_id)) {
          // Do something when coproxUsers includes the author_id
        } else {
            console.log(ticketDetails[i].author_id)
            const result = await HandleTickets(ticket, ticketDetails[i]);
            answeredTickets.push(result);
            // Increment the counter
            ticketCount++;
          break;
        }
        console.log("-------------------------------------------------------------------------------------------------------------");
      }
    }



  }


    // Add a delay between tickets (e.g., 5000 milliseconds = 5 seconds)
    await delay(500);

  

    // Break the loop if the counter reaches 10
    if (ticketCount === 10) {
        break;
    }
}

    return answeredTickets;
  } catch (error) {
    console.error('Error generating answer to Zendesk tickets:', error.message);
    throw error;
  }
}

// Modified code for zendeskTicketAI
const zendeskTicketAI = {
  start: async () => {
    logs.logExecution("zendeskTicketAI")
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
module.exports = zendeskTicketAI;
