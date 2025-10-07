const vilogiService = require('../services/vilogiService');
const json2csv = require('json2csv').parse;
const coproService = require('../services/coproService');
const mondayService = require('../services/mondayService');

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
const boardId = 1438946150;
const typeData="travaux"
const synchroTravaux = {
    start: async () => {
        logs.logExecution("synchroTravaux")
        const LogId = await scriptService.logScriptStart('synchroTravaux');
        console.log('LogId:', LogId);

        let counterStart =await vilogiService.countConenction();
        console.log('test 2 ');
        console.log('Start Extraction ...');
        try {
            console.log('test 3 ');
            let copros = await coproService.listCopropriete();
            console.log('test 4 ');
            let FinalContrat = [];  // Initialize FinalContrat array
            console.log('test 5 ');
            let totalTravaux=0;
            for (const copro of copros) {
                console.log('test 6 ');
                console.log("ID Vilogi:", copro.idCopro);
                //if (copro.idCopro !== "S047") continue
                if (copro.idVilogi !== undefined) {
                    let travauxAll = await vilogiService.getCoproTravaux(copro.idVilogi);

                    const data = await mondayService.getItemsDetails(1772265497);
                    console.log(data)
                    let NbTravaux=0;
                    for (const travaux of travauxAll) {
                        totalTravaux++;
                        NbTravaux++;
                        console.log(` Decision numero ${totalTravaux}  identifiant travaux Number :${travaux.id}   ---- ${copro.idCopro} -  [${NbTravaux}   /  ${travauxAll.length}] `)      
                        const assemblee = await vilogiService.getCoproAssemblee(copro.idVilogi,travaux.assemblee);
                        const columnValues = {
                            
                            texte_1: travaux.description,
                            texte_3: travaux.contrat,
                            texte_32: travaux.montant,
                            ...(assemblee && assemblee.dateassemblee ? { texte_6: assemblee.dateassemblee } : {}),//TODO changer la colonne avec la date de l'ag au liaux de l'identifiant de l'AG
                            texte_8:travaux.nbEcheance,

                            ...(copro.idMonday != null && { board_relation: { "item_ids": [copro.idMonday] } }),
                            date:{"date" : travaux.dateDebut.split('/').reverse().join('-')},
                            date_1:{"date" : travaux.dateFin.split('/').reverse().join('-')}

                          };
                          
                          console.log(columnValues)
                          const itemName = `${copro.idCopro} - ${travaux.nom}`;
                          
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
            let counterEnd =await vilogiService.countConenction();
            let VolumeCalls = counterEnd[0].nombreAppel - counterStart[0].nombreAppel           
            await scriptService.updateLogStatus('synchroTravaux',LogId ,0 ,`Script executed successfully `, VolumeCalls );

            console.log('--------------------------------------------------------------------------------------------END Extraction ...');
        } catch (error) {
                        let counterEnd =await vilogiService.countConenction();
            
            let VolumeCalls = counterEnd[0].nombreAppel - counterStart[0].nombreAppel           
            await scriptService.updateLogStatus('synchroTravaux',LogId ,-1,`An error occurred: ${error.message} `, VolumeCalls );
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
            await mondayService.updateItemName(boardId, checkValue[0].mondayItenID, itemName)
            //const newItem = await mondayService.updateItem(boardId, checkValue[0].mondayItenID, data);
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
