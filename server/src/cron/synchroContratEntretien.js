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
const boardId = 1455203182;
const typeData="contratEntretien"
const synchroContratEntretien = {
    start: async () => {
        logs.logExecution("synchroContratEntretien")
        console.log('Start Extraction ...');
        try {
            let copros = await coproService.listCopropriete();
            let FinalContrat = [];  // Initialize FinalContrat array
            console.log(await mondayService.getItemsDetails("1455213576"))
            let TotalContrat=0
            for (const copro of copros) {
                console.log("ID Vilogi:", copro.idCopro);
                if (copro.idVilogi !== undefined) {
                    let contrats = await vilogiService.getCoproContratEntretien(copro.idVilogi);
                    //console.log(contrats);
                    
                    let NbContrat=0
                    for (const contrat of contrats) {
                        NbContrat++
                        TotalContrat++
                        // Define a regular expression pattern to match the desired format
                        const regex = /^(\d+)-(.*)$/;
                        
                        // Check if the variable contrat.fournisseur matches the pattern
                        const match = contrat.fournisseur.match(regex);
                        let infoFournisseur = {};
                    
                        if (match) {
                            // Extract the numbers from the match
                            const fournisseurID = match[1];
                            infoFournisseur = await vilogiService.getPrestataireById(fournisseurID, copro.idVilogi);
                            //console.log(`${copro.idCopro} - ${match[1]} - ${match[2]}` )
                            //console.log(infoFournisseur)
                            
                        } else {
                            //console.log("Invalid format for contrat.fournisseur");
                        }
                        if (infoFournisseur === undefined){
                            console.log("Break");
                            break;
                        }else{

                        }
                        console.log(` Contrat numero ${TotalContrat}   Sync contrat Number :${contrat.id}   ---- ${copro.idCopro} -  [${NbContrat}   /  ${contrats.length}] `)                   
                        const columnValues = {
                            //copro: copro.idCopro,
                            texte_1: contrat.fournisseur,
                            texte_2: infoFournisseur.societe || "",
                            texte_3: contrat.typecontrat,
                            //texte_4: contrat.description,
                            date: {"date" : contrat.dateeffet.split('/').reverse().join('-')},
                            date_1: {"date" : contrat.dateecheance.split('/').reverse().join('-')},
                            date_2: {"date" : contrat.datefin.split('/').reverse().join('-')},
                            texte_8: infoFournisseur.adresse,
                            //texte_9: infoFournisseur.complement,
                            texte_10: infoFournisseur.ville,
                            texte_11: infoFournisseur.codepostal,
                            texte_16:infoFournisseur.email,
                            t_lephone:  {"phone" :infoFournisseur.telephone, "countryShortName" : "FR"},
                            ...(copro.idMonday != null && { board_relation: { "item_ids": [copro.idMonday] } }),
                            texte_15: infoFournisseur.secteur,
                            //dup__of_texte_155:infoFournisseur.secteur,
                            texte_14: contrat.idFichier
                            // Add other properties as needed
                        };
                        
                        const itemName = `${contrat.id}`;
                          
                          await saveMonday(itemName,columnValues,contrat.id)
                          await delay(100);
                    
                        if (contrat.idFichier) {
                            // await saveFileLocally(apiResponse, localFilePath, contrat)
                        }
                    }
                    
                }
            }
            console.log(TotalContrat)
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

module.exports = synchroContratEntretien;
