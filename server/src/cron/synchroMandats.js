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
        logs.logExecution("synchroMandats")
        console.log(await mondayService.getItemsDetails("1455188129"))
        try {
            let copros = await coproService.listCopropriete();
            let FinalManda = [];  // Initialize FinalContrat array

            for (const copro of copros) {
                console.log("ID Vilogi:", copro.idCopro);
                if (copro.idVilogi !== undefined) {
                    let madats = await vilogiService.getCoproManda(copro.idVilogi);
                    
                    //const data = await mondayService.getItemsDetails(1439055076);
                    //console.log(data)
                    let j=0
                    for (const mandat of madats) {
                        console.log(mandat.idFichier)
                        j++;
                        //let assemblee = await vilogiService.getCoproAssemblee(copro.idVilogi,travaux.assemblee);
                        urlMandat=`https://copro.vilogi.com/rest/mandatSyndic/getFile/${mandat.idFichier}?token=PE00FqnH93BRzvKp7LBR5o5Sk0M1aJ3f&idCopro=44378&idAdh=749799`
                        const columnValues = {
                            
                                /*id: mandat.id,
                                copropriete: copro.idCopro,
                                 numMandat : mandat.numMandat,
                                 typeMandat : mandat.typeMandat,
                                 dateDebut : mandat.dateDebut,
                                 dateFin : mandat.dateFin,
                                 dateSignature : mandat.dateSignature,
                                 nom : mandat.nom,
                                 adresse : mandat.adresse,
                                 complement : mandat.complement,
                                 
                                 idFichier : `https://copro.vilogi.com/rest/mandatSyndic/getFile/${mandat.idFichier}?token=PE00FqnH93BRzvKp7LBR5o5Sk0M1aJ3f&idCopro=44378&idAdh=749799`,
                                 ville : mandat.ville,
                                 codepostal : mandat.codepostal,*/
                                 chiffres:mandat.idFichier,
                                 lien_internet : {"url" : urlMandat, "text":"Lien vers mandat"},
                                 id:mandat.id,
                                 orderDate:mandat.dateDebut,
                                 date_1:{"date" : mandat.dateDebut.split('/').reverse().join('-')},
                                 date:{"date" : mandat.dateFin.split('/').reverse().join('-')},
                                 ...(copro.idMonday != null && { board_relation: { "item_ids": [copro.idMonday] } }),
                                 number:`${copro.idCopro} - ${j} `,
                              };
                              await delay(100);
                              FinalManda.push(columnValues)
                              
                                      
                    }
                    
                }
                FinalManda.sort((a, b) => {
                    const dateA = new Date(a.orderDate.split('/').reverse().join('/'));
                    const dateB = new Date(b.orderDate.split('/').reverse().join('/'));
                    return dateA - dateB;
                });
                //console.log(FinalManda)
            }
            let i =  1;
            FinalManda.forEach(async (item, index) => {
                
                const date =  new Date(item.orderDate.split('/').reverse().join('/'));
                const year =  date.getFullYear();
                const paddedIndex =   String(i).padStart(3, '0'); // Ensure i is always 3 digits
                const itemName = `${year} - ${paddedIndex} (${item.number})`;
                delete item.number
                delete item.orderDate;
                const itemID=item.id
                delete item.id;
                i++; 
                await saveMonday(itemName,item,itemID)
                await delay(300);
              });

            
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
