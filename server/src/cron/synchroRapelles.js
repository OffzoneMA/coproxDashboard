const json2csv = require('json2csv').parse;
const scriptService = require('../services/scriptService');

const zendeskService = require('../services/zendeskService');
const mondayVilogiSyncService = require('../services/mondayVilogiSyncService');
const logs = require('../services/logs');
const fs = require('fs');
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


const synchroRapelles = {
    start: async () => {
        console.log('Start Extraction ...');
        logs.logExecution("synchroRapelles")
        const LogId = await scriptService.logScriptStart('synchroRapelles');
        try {
            let tickets = await zendeskService.getTicketsByStatus('17225670202781');
            console.log("Nombre de tickets ouverts:", tickets.length);

            let rappelles = [];

            for (const ticket of tickets) {
              const hasRappel = ticket.tags.some(tag => tag.startsWith('rappele_dans_'));

            if (!hasRappel) {
                    ticketData = {
                        ticket: {
                            "status": "30388622603805",
                        }
                    }
                    await zendeskService.updateTicket(ticket.id, ticketData)
            }
            const updatedAt = new Date(ticket.updated_at);
            const today = new Date();

            const diffInMs = today - updatedAt;
            const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

            for (const tag of ticket.tags) {
                if (tag.startsWith('rappele_dans_')) {
                const expectedDelayDays = parseRappelTag(tag);

                if (expectedDelayDays !== null && diffInDays >= expectedDelayDays) {
                    ticketData = {
                        ticket: {
                            "status": "open",
                            "tags": ticket.tags.filter(t => !t.startsWith('rappele_dans_'))
                        }
                    }
                    await zendeskService.updateTicket(ticket.id, ticketData)
                    console.log(`🛎️ Rappel à réaliser pour le ticket ${ticket.id} (${tag}): mis à jour il y a ${diffInDays} jours`);
                    // Optionally trigger reminder action here
                }else{
                    console.log(`🛎️ Rappel en attente pour le ticket ${ticket.id} (${tag}): mis à jour va etre dans ${diffInDays} jours`);
                }
                }
            }
            }
            await scriptService.updateLogStatus('synchroRapelles', LogId, 0, "Script executed successfully");
            console.log('Rappels traités:', rappelles);
            // console.log(FinalContrat);
            console.log('--------------------------------------------------------------------------------------------END Extraction ...');
        } catch (error) {
                //let counterEnd =await vilogiService.countConenction(); 
                //let VolumeCalls = counterEnd[0].nombreAppel - counterStart[0].nombreAppel           
                await scriptService.updateLogStatus('synchroRapelles',LogId ,-1,`An error occurred: ${error.message} ` );
                console.error('An error occurred:', error.message);
        }
    }
};



function parseRappelTag(tag) {
  const regex = /rappele_dans_(\d+)_([a-zé]+)/i;
  const match = tag.match(regex);

  if (!match) return null;

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 'jours':
      return value;
    case 'semaine':
    case 'semaines':
      return value * 7;
    case 'mois':
      return value * 30; // Approximate
    default:
      return null;
  }
}
//extraction des contrat par copro

module.exports = synchroRapelles;

