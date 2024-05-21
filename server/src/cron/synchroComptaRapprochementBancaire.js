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
const boardId = 1499580809;
const typeData="synchroComptaRapprochementBancaire"

const synchroMandats = {
    start: async () => {
        console.log('Start Extraction ...');
        logs.logExecution("synchroComptaRapprochementBancaire")
        console.log(await mondayService.getItemsDetails("1499741576"))
        try {
            let copros = await coproService.listCopropriete();
            let FinalManda = [];  // Initialize FinalContrat array

            for (const copro of copros) {
                console.log("ID Vilogi:", copro.idCopro);

                if (copro.idVilogi !== undefined) {
                        const RBs = await vilogiService.getRapprochemetBancaire(copro.idVilogi)
                        // Initialize an array to store the values for the previous 12 months
                        let previousMonthsData = Array(12).fill(null);

                        // Get the current date
                        let currentDate = new Date();

                        // Iterate through RBs array
                        for (let rb of RBs) {
                            // Convert rb.dateRapprochement to a Date object
                            let rbDate = new Date(rb.dateRapprochement);

                            // Calculate the difference in months between current date and rbDate
                            let monthsDiff = (currentDate.getFullYear() - rbDate.getFullYear()) * 12 + currentDate.getMonth() - rbDate.getMonth();

                            // Check if rbDate falls within the previous 12 months
                            if (monthsDiff >= 0 && monthsDiff < 12) {
                                // Calculate the index in previousMonthsData array
                                let index = 11 - monthsDiff;

                                // Store rb.ecart value in the corresponding month's slot
                                previousMonthsData[index] = rb.ecart;
                                console.log(" rapprochements du ",copro.idCopro," - Index : ",index," - Date Rapprochement : ",rb.dateRapprochement," - Ecart de : ",rb.ecart)
                            }
                        }
                        const columnValues = {

                                 ...(copro.idMonday != null && { connecter_les_tableaux__1: { "item_ids": [copro.idMonday] } }),
                                 chiffres__1:previousMonthsData[11],
                                 chiffres_1__1:previousMonthsData[10],
                                 chiffres_2__1:previousMonthsData[9],
                                 chiffres_3__1:previousMonthsData[8],
                                 chiffres_4__1:previousMonthsData[7],
                                 chiffres_5__1:previousMonthsData[6],
                                 chiffres_6__1:previousMonthsData[5],
                                 chiffres_7__1:previousMonthsData[4],
                                 chiffres_8__1:previousMonthsData[3],
                                 chiffres_9__1:previousMonthsData[2],
                                 chiffres_10__1:previousMonthsData[1],
                                 chiffres_11__1:previousMonthsData[0],
                                 chiffres_12__1:previousMonthsData[11],
                              };                   
                              const itemName = `Rapprochement bancaures du - ${copro.idCopro}`;
                await saveMonday(itemName,columnValues,copro.idVilogi)

                                      
                    
                    
                }
            }            
            //console.log(FinalContrat)
            console.log('--------------------------------------------------------------------------------------------END Extraction ...');
        } catch (error) {
            console.error('An error occurred:', error.message);
        }
    }
};


async function saveMonday(itemName,data,idVilogi) {
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
