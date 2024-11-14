const vilogiService = require('../services/vilogiService');
const json2csv = require('json2csv').parse;
const coproService = require('../services/coproService');
const zendeskService = require('../services/zendeskService');

const scriptService = require('../services/scriptService');
const mondayVilogiSyncService = require('../services/mondayVilogiSyncService');
const logs = require('../services/logs');
const fs = require('fs');
// mondayService.js
const mondaySdk = require("monday-sdk-js");
const monday = mondaySdk();
monday.setApiVersion("2023-10");
monday.setToken(process.env.MONDAY_API_KEY)

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
let FinalContrat = [];
const boardId = 1437344331;
const typeData="manda"

const synchroMandats = {
    start: async () => {
        console.log('Start Extraction ...');
        logs.logExecution("synchroVilogiMessages")
        //console.log(await mondayService.getItemsDetails("1455188129"))
        try {
            let copros = await coproService.listCopropriete();
            let FinalManda = [];  // Initialize FinalContrat array

            for (const copro of copros) {
                console.log("ID Vilogi:", copro.idCopro);
                if (copro.idVilogi !== undefined) {
                    let persons = await vilogiService.getAllAdherents(copro.idVilogi);
                    for(const person of persons){
                        let hasMessage = await vilogiService.getUserHasMessage(person.id,copro.idVilogi)
                        for(const message in hasMessage){
                            console.log(hasMessage[message].id," ------ ",hasMessage[message].adherant," ------ ",hasMessage[message].date_envoi," ------ ", hasMessage[message].lu)
                            // The date string you want to check
                            const dateEnvoi = hasMessage[message].date_envoi;

                            // Convert the date strings to Date objects
                            const envoiDate = new Date(dateEnvoi.split('/').reverse().join('-'));
                            const comparisonDate = new Date('2024-01-01');

                            // Compare the dates
                            //if (envoiDate > comparisonDate) {
 
                            if(true){
                            console.log("The date is after 01/01/2024");
                            createTicketZendesk(hasMessage[message])
                            } else {
                                
                               //console.log(hasMessage[message].id,"   ",person.id,"   ",copro.idVilogi)
                               //await vilogiService.getUserMessagePushLu(hasMessage[message].id,person.id,copro.idVilogi)
                            }
                            if(hasMessage[message].lu==0){
                                //console.log(hasMessage[message])
                            }
                        }

                        await delay(300)
                    }
                    
                    
                }
                
            }
                    
            //console.log(FinalContrat)
            await scriptService.updateLogStatus('synchroVilogiMessages',LogId ,2 ,"Script executed successfully");
            console.log('--------------------------------------------------------------------------------------------END Extraction ...');
        } catch (error) {
            console.error('An error occurred:', error.message);
        }
    }
};


async function createTicketZendesk(message) {
    try {
        const newTicket = {
            ticket: {
              subject: message.titre,
              description: `🚨⚠️ L'équipe de gestion des signalements n'a pas accès à cette messagerie. 🚨⚠️

                    Bonjour à vous,

                    Vous recevez ce message automatique 🧑‍💻 qui vous informe que votre message a bien été réceptionné et ne s'est pas égaré 📬 !

                    Si votre question concerne une demande portant sur les charges, une demande d'accès, une question d'ordre privative de manière générale vous êtes au bon endroit 📍, une réponse vous sera apportée.

                    En revanche, si votre demande concerne un dossier lié à la copropriété, vous devez réorienter votre demande ou votre signalement ici =>  https://macopro.coprox.immo

                    En effet, à des fins d'efficacité, aucune demande de signalement ou de suivi de dossiers impactant les parties communes ne sera traitée par courriel. Cette boîte e-mail est exclusivement réservée à répondre aux questions privatives des copropriétaires et à recevoir les factures des prestataires.

                    Chez Coprox, nous offrons à chaque copropriété un espace réservé aux copropriétés accessible à chaque copropriétaire et locataire avec son e-mail enregistré chez Coprox. Votre participation sur le réseau contribue à conserver l'historique de votre copropriété et à favoriser la communication entre les voisins🤝. En utilisant ce réseau, vous nous aidez à être réactifs dans le traitement des demandes 🏃‍♀️.

                    En cas de difficultés de connexion, il vous suffit de nous demander votre code immeuble. Notre équipe de gestion est constamment connectée 👩‍💻pour vous fournir une réponse rapide en fonction de l'urgence de votre demande ⏱.

                    En attendant d'échanger sur le bon canal nous vous souhaitons une belle journée ☀️ ou fin de journée 🌙.`,
              requester: {
                name: "Youssef DIOURI",
                email: "contact@youssefdiouri.net"
              },
            }
          };
        
        const newTicketData = await zendeskService.createTicket(newTicket)
        await delay(300)
        console.log('Ticket ID:', newTicketData[0].id);
        const messageData = {
            ticket: {
              comment: {
                body: message.description,
                public: false  //private note
              }
            }
          };
          console.log('Ticket 2  ID:', newTicketData[0].id);
        await zendeskService.updateTicket(newTicketData[0].id,messageData)
    } catch (error) {
        console.error("Erreur lors de la création de l'élément:", error);
      }
}


//extraction des contrat par copro

module.exports = synchroMandats;
