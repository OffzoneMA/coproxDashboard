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
const boardId = 1431956324;
const typeData="exercices"

const synchroMandats = {
    start: async () => {
        console.log('Start Extraction ...');
        logs.logExecution("synchroExercices")
        console.log(await mondayService.getItemsDetails("1431956408"))
        try {
            let copros = await coproService.listCopropriete();
            let FinalManda = [];  // Initialize FinalContrat array

            for (const copro of copros) {
                console.log("ID Vilogi:", copro.idCopro);
                if (copro.idVilogi !== undefined) {
                    let exercices = await vilogiService.getCoproExercice(copro.idVilogi);
                    
                    //const data = await mondayService.getItemsDetails(1439055076);
                    //console.log(data)
                    let j=0
                    //console.log(exercices)
                    for (const exercice of exercices.list) {
                        
                        //console.log(exercice)
                        j++;
                        //let assemblee = await vilogiService.getCoproAssemblee(copro.idVilogi,travaux.assemblee);
                    
                        const columnValues = {
                            
                                 date__1:{"date" : exercice.datedebut.split('/').reverse().join('-')},
                                 date_1__1:{"date" : exercice.datefin.split('/').reverse().join('-')},
                                 ...(copro.idMonday != null && { board_relation9: { "item_ids": [copro.idMonday] } }),
                                 statut__1:exercice.cloture,
                              };
                              await delay(100);

                              
                              const itemName = `${copro.idCopro} - ${exercice.id}`;
                              await saveMonday(itemName,columnValues,exercice.id)
                              await delay(100);
                                      
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
