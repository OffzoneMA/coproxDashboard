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
const boardId = 1438946150;
const typeData="travaux"
const synchroTravaux = {
    start: async () => {
        logs.logExecution("synchroTravaux")
        console.log('Start Extraction ...');
        try {
            let copros = await coproService.listCopropriete();
            let FinalContrat = [];  // Initialize FinalContrat array
            let totalTravaux=0;
            for (const copro of copros) {
                console.log("ID Vilogi:", copro.idCopro);
                if (copro.idVilogi !== undefined) {
                    let travauxAll = await vilogiService.getCoproTravaux(copro.idVilogi);

                    const data = await mondayService.getItemsDetails(1487186054);
                    //console.log(data)
                    let NbTravaux=0;
                    for (const travaux of travauxAll) {
                        totalTravaux++;
                        NbTravaux++;
                        console.log(` Contrat numero ${totalTravaux}  Sync contrat Number :${travaux.id}   ---- ${copro.idCopro} -  [${NbTravaux}   /  ${travauxAll.length}] `)      
                        //let assemblee = await vilogiService.getCoproAssemblee(copro.idVilogi,travaux.assemblee);
                        const columnValues = {
                            
                            texte_1: travaux.description,
                            texte_3: travaux.contrat,
                            texte_32: travaux.montant,
                            texte_6: travaux.assemblee,
                            texte_8:travaux.nbEcheance,

                            ...(copro.idMonday != null && { board_relation: { "item_ids": [copro.idMonday] } }),
                            date:{"date" : travaux.dateDebut.split('/').reverse().join('-')},
                            date_1:{"date" : travaux.dateFin.split('/').reverse().join('-')}

                          };
                          

                          const itemName = `${travaux.nom}`;
                          
                          try {
                            await saveMonday(itemName,columnValues,travaux.id)
                            //await delay(300);
                            //monday.api(`mutation {change_multiple_column_values(item_id:${newItem.id},board_id:${boardId}, column_values: \"{\\\"board_relation\\\" : {\\\"item_ids\\\" : [${copro.idMonday}]}}\") {id}}` )
                          } catch (error) {
                            console.error("Erreur lors de la création de l'élément:", error);
                          }
                        
                    }
                    
                }
            }
            console.log(totalTravaux)
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

module.exports = synchroTravaux;
