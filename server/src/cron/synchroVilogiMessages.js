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
const synchroVilogiMessages = {
    start: async () => {
        console.log('Start Extraction ...');
        logs.logExecution("synchroVilogiMessages")
        let counterStart =await vilogiService.countConenction();
        const LogId = await scriptService.logScriptStart('synchroVilogiMessages');
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
                            console.log(hasMessage[message].id," ------ ",copro.idVilogi," ------ ",hasMessage[message].adherant," ------ ",hasMessage[message].date_envoi," ------ ",person.email," ------ ",person.nom," ", person.prenom," ------ ", hasMessage[message].lu)
                            // The date string you want to check
                            const dateEnvoi = hasMessage[message].date_envoi;

                            // Convert the date strings to Date objects
                            const envoiDate = new Date(dateEnvoi.split('/').reverse().join('-'));
                            const comparisonDate = new Date('2025-01-01');

                            // Compare the dates
                            if (envoiDate > comparisonDate) {
                              try {
                            //if(hasMessage[message].lu==1){
                            console.log("The date is after 01/01/2024");
                            createTicketZendesk(hasMessage[message],person)
                            //await vilogiService.getUserMessagePushLu(hasMessage[message].id,person.id,copro.idVilogi)
                            } catch (error) {
                              console.error('An error occurred:', error.url + + error.message);
                          }
                            } else {
                                console.log('le message est deja enregistré :',hasMessage[message].id)
                            }
                        }


                        await delay(300)
                    }
                    
                    
                }
                
            }
                    let counterEnd =await vilogiService.countConenction();
                                
                            let VolumeCalls = counterEnd[0].nombreAppel - counterStart[0].nombreAppel 
            //console.log(FinalContrat)
            await scriptService.updateLogStatus('synchroVilogiMessages',LogId ,2 ,`Script executed successfully `, VolumeCalls );
            console.log('--------------------------------------------------------------------------------------------END Extraction ...');
        } catch (error) {
            console.error('An error occurred:', error.url + + error.message);
        }
    }
};


async function createTicketZendesk(message,person) {
    try {
        const newTicket = {
            ticket: {
              subject: message.titre,
              description: `Bonjour,
 
Nous vous remercions pour votre message 😊
 
Pour garantir un traitement rapide et efficace de votre demande, merci de suivre ces instructions :
 
➡️ Si votre demande porte sur une question privative (charges, accès, vente, demandes personnelles, etc.) :
Vous êtes au bon endroit 📍. Votre message sera pris en charge dans les meilleurs délais ⏳
 
➡️ Si votre demande concerne les parties communes :
Votre demande ne peut-être traitée depuis cette boîte email ⚠️. Veuillez svp utiliser le réseau privé de la copropriété MACOPRO où est connectée la Coproxteam gestion des copropriétés : 👉 https://macopro.coprox.immo. 
 
Ce réseau vous offre 🎁 une totale transparence sur les actions que nous menons et nous permet de traiter efficacement les dossiers de votre copropriété 💪. (si vous rencontrez une difficulté à vous connecter dites le nous en répondant à cet email). 
 
➡️ Pour consulter vos documents personnels :
Rendez-vous sur 👉 https://www.vilogi.com.
Les identifiants figurent sur les appels de fonds.
 
Merci de votre coopération 🤝
La Coproxteam, toujours à votre écoute 👂 `,
              requester: {
                name: "Youssef DIOURI",//person.nom + " " + person.prenom,
                email: "contact@youssefdiouri.net",//person.email
              },
            }
          };
        
        const newTicketData = await zendeskService.createTicket(newTicket)
        await delay(300)
        console.log('Message publique:', newTicketData[0].id);
        const messageData = {
            ticket: {
              comment: {
                body: message.description,
                public: false  //private note
              }
            }
          };
          console.log('Message privée:', newTicketData[0].id);
        await zendeskService.updateTicket(newTicketData[0].id,messageData)
    } catch (error) {
        console.error("Erreur lors de la création de l'élément:", error);
      }
}


//extraction des contrat par copro

module.exports = synchroVilogiMessages;
