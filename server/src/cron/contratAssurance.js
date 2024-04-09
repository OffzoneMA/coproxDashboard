const vilogiService = require('../services/vilogiService');
const json2csv = require('json2csv').parse;
const coproService = require('../services/coproService');
const mondayService = require('../services/mondayService');
const logs = require('../services/logs');
const fs = require('fs');


function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
let FinalContrat = [];

const contratAssurance = {
    start: async () => {
        logs.logExecution("contratAssurance")
        console.log('Start Extraction ...');
        try {
            let copros = await coproService.listCopropriete();
            let FinalContrat = [];  // Initialize FinalContrat array

            for (const copro of copros) {
                console.log("ID Vilogi:", copro.idCopro);
                if (copro.idVilogi !== undefined) {
                    let contrats = await vilogiService.getCoproContratAssurance(copro.idVilogi);
                    //console.log(contrats);
                    const data = await mondayService.getItemsDetails(1436590141);
                    console.log(data)
                    
                    for (const contrat of contrats) {
                                     
                        const selectedData = {

                            copro: copro.idCopro,
                            typecontrat: contrat.typecontrat,
                            contrat: contrat.contrat,
                            description: contrat.description,
                            dateeffet: contrat.dateeffet,
                            dateecheance: contrat.dateecheance,
                            police: contrat.police,
                            assureur: contrat.assureur,
                            courtier: contrat.courtier,
                            compagnie: contrat.compagnie,
                            prime: contrat.prime,
                            compteCharge: contrat.compteCharge,
                            datefin: contrat.datefin,
                            file: contrat.idFichier
                            // Add other properties as needed
                        };
                    
                        FinalContrat.push(selectedData);
                        const columnValues = {
                            texte: copro.idCopro,
                            texte5: contrat.typecontrat,
                            //statut_1: contrat.typecontrat,
                            texte_3: contrat.contrat,
                            texte_4: contrat.description,
                            texte_5: contrat.dateeffet,
                            texte_1: contrat.dateecheance,
                            texte_2: contrat.police,
                            texte_6: contrat.assureur,
                            texte_7: contrat.courtier,
                            texte_8: contrat.compagnie,
                            chiffres: contrat.prime,
                            texte_10: contrat.compteCharge,
                            texte_11: contrat.datefin,
                            texte_12: contrat.idFichier,
                            ...(copro.idMonday != null && { board_relation: { "item_ids": [copro.idMonday] } }),
                          };
                          
                          const boardId = 1436546197;
                          const itemName = `Contrat d'assurance - ${copro.idCopro} - ${contrat.assureur}`;
                          
                          try {
                            const newItem = await mondayService.createItem(boardId, itemName, columnValues);
                            console.log("Nouvel élément créé:", newItem);
                          } catch (error) {
                            console.error("Erreur lors de la création de l'élément:", error);
                          }
                        
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

module.exports = contratAssurance;
