const vilogiService = require('../services/vilogiService');
const json2csv = require('json2csv').parse;
const coproService = require('../services/coproService');
const mondayService = require('../services/mondayService');
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
                            if (envoiDate > comparisonDate) {
                            console.log("The date is after 01/01/2024");
                            } else {
                                console.log(hasMessage[message].id,"   ",person.id,"   ",copro.idVilogi)
                               //await vilogiService.getUserMessagePushLu(hasMessage[message].id,person.id,copro.idVilogi)
                            }
                            if(hasMessage[message].lu==0){
                                console.log(hasMessage[message])
                            }
                        }

                        await delay(300)
                    }
                    
                    
                }
                
            }
                    
            //console.log(FinalContrat)
            console.log('--------------------------------------------------------------------------------------------END Extraction ...');
        } catch (error) {
            console.error('An error occurred:', error.message);
        }
    }
};


async function createTicketZendesk(itemName,data,idVilogi) {
    try {
        const checkValue= await mondayVilogiSyncService.getItemsByInfo(boardId,idVilogi)
        console.log(checkValue)
        if(checkValue.length > 0){
            console.log("Already exist")
            const newItem = await mondayService.updateItem(boardId, checkValue[0].mondayItenID, data);
        }else{
            const newItem = await mondayService.createItem(boardId, itemName, data);
            //console.log("Nouvel élément créé:", newItem);
            const dataMongo={
                boardID:boardId,
                mondayItenID:newItem.id,
                vilogiEndpoint:typeData,
                //vilogiEndpointData:mandat,
                vilogiItemID:idVilogi

            }
            mondayVilogiSyncService.addItem(dataMongo)
        }
        await delay(300);
        //monday.api(`mutation {change_multiple_column_values(item_id:${newItem.id},board_id:${boardId}, column_values: \"{\\\"board_relation\\\" : {\\\"item_ids\\\" : [${copro.idMonday}]}}\") {id}}` )
      } catch (error) {
        console.error("Erreur lors de la création de l'élément:", error);
      }
}


//extraction des contrat par copro

module.exports = synchroMandats;
