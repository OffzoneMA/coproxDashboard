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
const boardId = 1505098640;
const typeData="synchroComptaList401"

const synchroMandats = {
    start: async () => {
        console.log('Start Extraction ...');
        logs.logExecution("synchroComptaList401")
        console.log(await mondayService.getItemsDetails("1508447961"))
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
                    const listComptes = await vilogiService.getPrestataires(copro.idVilogi)
                    let j=0
                    for (compte of listComptes){
                        await delay(100);
                        let budgetj30 = await vilogiService.getbudgetComptebyDate(copro.idVilogi,compte.idCompte,thirtyDaysAgo);
                        let budgetj = await vilogiService.getbudgetComptebyDate(copro.idVilogi,compte.idCompte,datedujour);
    
                        //let assemblee = await vilogiService.getCoproAssemblee(copro.idVilogi,travaux.assemblee);
                        //console.log(budgetj)
                        if (budgetj30 === undefined || budgetj30 === '' || budgetj30.length === 0 )  continue
                        if (budgetj === undefined || budgetj === '' || budgetj.length === 0 )  continue
                        if (budgetj[0].solde>0) {
                            console.log("Compte Numero : ",compte.idCompte," Solde J : ",budgetj[0].solde," Solde J-30 : ",budgetj30[0].solde)
                        }
                        else{
                            console.log("Compte Numero : ",compte.idCompte," Solde OK ")
                        }

                        j++;
                        //let assemblee = await vilogiService.getCoproAssemblee(copro.idVilogi,travaux.assemblee);
                    
                        const columnValues = {
                            
                                 ...(copro.idMonday != null && { connecter_les_tableaux__1: { "item_ids": [copro.idMonday] } }),
                                 chiffres__1:budgetj[0].solde,
                                 chiffres6__1:budgetj30[0].solde,
                              };                   
                        const itemName = `Compte 401 - ${compte.societe} - ${copro.idCopro}`;
                        await saveMonday(itemName,columnValues,compte.id)
                            
                    }


                    
                    //console.log(exercices)

                        
                        


                                      
                    
                    
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
