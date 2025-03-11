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
const boardId = 1499536236;
const typeData="synchroComptaList"

const synchroMandats = {
    start: async () => {
        console.log('Start Extraction ...');
        logs.logExecution("synchroComptaList472")
        let counterStart =await vilogiService.countConenction();
        
        const LogId = await scriptService.logScriptStart('synchroComptaList472');
        //console.log(await mondayService.getItemsDetails("1499568922"))
        try {
            let copros = await coproService.listCopropriete();
            let FinalManda = [];  // Initialize FinalContrat array

            for (const copro of copros) {
                console.log("ID Vilogi:", copro.idCopro);
                if (copro.idVilogi !== undefined) {

                    const today = new Date();
                    const formatDate = date => {
                        const d = date.getDate().toString().padStart(2, '0');
                        const m = (date.getMonth() + 1).toString().padStart(2, '0');
                        const y = date.getFullYear();
                        return `${d}/${m}/${y}`;
                    };

                    const datedujour = formatDate(today);
                    const thirtyDaysAgo = formatDate(new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000));


                    let budgetj30 = await vilogiService.getbudgetComptebyDate(copro.idVilogi,"47200000",thirtyDaysAgo);
                    let budgetj = await vilogiService.getbudgetComptebyDate(copro.idVilogi,"47200000",datedujour);
                    console.log(budgetj30)
                    console.log(budgetj)
                    //let assemblee = await vilogiService.getCoproAssemblee(copro.idVilogi,travaux.assemblee);
                    //console.log(budgetj)
                    if (budgetj30 === undefined || budgetj30 === '' || budgetj30.length === 0 )  continue
                    if (budgetj === undefined || budgetj === '' || budgetj.length === 0 )  continue
                    let j=0
                    //console.log(exercices)

                        
                        
                        j++;
                        //let assemblee = await vilogiService.getCoproAssemblee(copro.idVilogi,travaux.assemblee);
                    
                        const columnValues = {
                            
                                 ...(copro.idMonday != null && { connecter_les_tableaux__1: { "item_ids": [copro.idMonday] } }),
                                 chiffres__1:budgetj[0].solde,
                                 chiffres6__1:budgetj30[0].solde,
                              };                   
                              const itemName = `Compte 472 - ${copro.idCopro}`;
                              await saveMonday(itemName,columnValues,copro.idVilogi)

                                      
                    
                    
                }
            }            
            //console.log(FinalContrat)
            let counterEnd =await vilogiService.countConenction();
            
        let VolumeCalls = counterEnd[0].nombreAppel - counterStart[0].nombreAppel           
            await scriptService.updateLogStatus('synchroComptaList472',LogId ,2 ,`Script executed successfully `, VolumeCalls );
            
            console.log('--------------------------------------------------------------------------------------------END Extraction ...');
        } catch (error) {
            let counterEnd =await vilogiService.countConenction(); 
            let VolumeCalls = counterEnd[0].nombreAppel - counterStart[0].nombreAppel           
            await scriptService.updateLogStatus('synchroComptaList472',LogId ,-1,`An error occurred: ${error.message} `, VolumeCalls );
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
