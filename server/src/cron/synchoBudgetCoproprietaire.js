const vilogiService = require('../services/vilogiService');
const json2csv = require('json2csv').parse;
const coproService = require('../services/coproService');
const personService = require('../services/personService');
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
const boardId = 1479667897;
const typeData="BudgetCoproprietaire"
const subItemBoards=1487007597;

const synchroMandats = {
    start: async () => {
        console.log('Start Extraction ...');
        logs.logExecution("synchoBudgetCoproprietaire")
        //console.log(await mondayService.getItemsDetails("1487595725"))
        try {
            let copros = await coproService.listCopropriete();
            let FinalManda = [];  // Initialize FinalContrat array

            for (const copro of copros) {
                console.log("ID Vilogi:", copro.idCopro);
                if (copro.idVilogi !== undefined) {
                    let personnes = await personService.getPersonsByCoproId(copro._id);
                    
                    const data = await mondayService.getItemsDetails(1487165988);
                    //console.log(data)
                    let j=0
                    for (const personne of personnes) {
                        
                        console.log(personne.idCompteVilogi)
                        if (personne.idCompteVilogi === undefined || personne.idCompteVilogi === '')  continue
                        console.log("compte :" , personne.idCompteVilogi)
                        const today = new Date();
                        const formatDate = date => {
                            const d = date.getDate().toString().padStart(2, '0');
                            const m = (date.getMonth() + 1).toString().padStart(2, '0');
                            const y = date.getFullYear();
                            return `${d}/${m}/${y}`;
                        };

                        const datedujour = formatDate(today);
                        const thirtyDaysAgo = formatDate(new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000));
                        const sixtyDaysAgo = formatDate(new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000));
                        const ninetyDaysAgo = formatDate(new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000));

                        let budgetj90 = await vilogiService.getbudgetComptebyDate(copro.idVilogi,personne.idCompteVilogi,ninetyDaysAgo);
                        let budgetj60 = await vilogiService.getbudgetComptebyDate(copro.idVilogi,personne.idCompteVilogi,sixtyDaysAgo);
                        let budgetj30 = await vilogiService.getbudgetComptebyDate(copro.idVilogi,personne.idCompteVilogi,thirtyDaysAgo);
                        let budgetj = await vilogiService.getbudgetComptebyDate(copro.idVilogi,personne.idCompteVilogi,datedujour);
                        j++;
                        //let assemblee = await vilogiService.getCoproAssemblee(copro.idVilogi,travaux.assemblee);
                        //console.log(budgetj)
                        if (budgetj === undefined || budgetj === '' || budgetj.length === 0 )  continue
                        if (budgetj30 === undefined || budgetj30 === '' || budgetj30.length === 0 )  continue
                        if (budgetj30 === undefined || budgetj30 === '' || budgetj30.length === 0 )  continue
                        if (budgetj === undefined || budgetj === '' || budgetj.length === 0 )  continue
                        try {
                            
                        const columnValues = {
                            
                            chiffres__1:budgetj60[0].solde,
                            chiffres_1__1:budgetj30[0].solde,
                            chiffres_2__1:budgetj[0].solde,
                            chiffres4__1:budgetj90[0].solde,

                            chiffres_3__1:budgetj60[0].solde-budgetj[0].solde,
                            chiffres0__1:budgetj30[0].solde-budgetj[0].solde,
                            chiffres_17__1:budgetj90[0].solde-budgetj60[0].solde,
                             ...(copro.idMonday != null && { board_relation__1: { "item_ids": [copro.idMonday] } }),
                          };

                          
                          const itemName = `${personne.idVilogi} - ${personne.nom} - ${personne.prenom}`;
                          const IDLine= `${copro.idCopro} - ${personne.idCompteVilogi}`
                          const newItemData=await saveMonday(itemName,columnValues,IDLine,boardId)
                          await delay(100);
                          const relances = await vilogiService.getRelanceAdherant(personne.idVilogi,copro.idVilogi)

                          for (relance of relances){
                            // Split the date string into its components
                            let [datePart, timePart] = relance.dateRelance.split(" ");
                            let [day, month, year] = datePart.split("/");
                            const dateRelance = `${year}-${month}-${day}`;
                             [datePart, timePart] = relance.dateRelance.split(" ");
                             [day, month, year] = datePart.split("/");
                            const dateCreation = `${year}-${month}-${day}`;
                            const columnValues = {
                                date_1__1:{"date" : dateRelance},
                                date_2__1:{"date" : dateRelance},
                                chiffres__1:relance.montant,
                                chiffres_1__1:relance.frais,
                                statut_1__1:relance.typeRelance,
                                //t_l_phone__1:,
                                //date0
                                //e_mail__1
                                //...(checkValue[0].mondayItenID != null && { board_relation__1: { "item_ids": [checkValue[0].mondayItenID] } }),
                              };
                              //console.log(newItemData)
                              const checkValue= await mondayVilogiSyncService.getItemsByInfo(subItemBoards,relance.id)
                              //console.log(checkValue)
                              if(checkValue.length > 0){
                                await saveMonday(`${relance.typeRelance}-${dateCreation}-${personne.nom} ${personne.prenom}`,columnValues,relance.id,subItemBoards)
                                continue
                              }
                              const val = await mondayService.createSubitem(newItemData,`${relance.typeRelance}-${dateCreation}-${personne.nom} ${personne.prenom}`)
                              const dataMongo={
                                boardID:subItemBoards,
                                mondayItenID:val.id,
                                vilogiEndpoint:typeData,
                                //vilogiEndpointData:mandat,
                                vilogiItemID:relance.id
                            }

                            await mondayVilogiSyncService.addItem(dataMongo)
                            await saveMonday(`${relance.typeRelance}-${dateCreation}`,columnValues,relance.id,subItemBoards)
                            console.log(relance.typeRelance)
                          }
                                 
                        } catch (error) {
                            console.error('An error occurred:', error.message);
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


async function saveMonday(itemName,data,idVilogi,boardIDFunction) {
    try {
        let returnID;
        const checkValue= await mondayVilogiSyncService.getItemsByInfo(boardIDFunction,idVilogi)
        //console.log(checkValue)
        if(checkValue.length > 0){
            //console.log("Already exist")
            const newItem = await mondayService.updateItem(boardIDFunction, checkValue[0].mondayItenID, data);
            returnID=newItem.id
        }else{
            const newItem = await mondayService.createItem(boardIDFunction, itemName, data);
            //console.log("Nouvel élément créé:", newItem);
            const dataMongo={
                boardID:boardIDFunction,
                mondayItenID:newItem.id,
                vilogiEndpoint:typeData,
                //vilogiEndpointData:mandat,
                vilogiItemID:idVilogi
            }
            returnID=newItem.id
            await mondayVilogiSyncService.addItem(dataMongo)
            //console.log("check before send " ,newItem.id)
            
        }
        
        await delay(300);
        return returnID
        //monday.api(`mutation {change_multiple_column_values(item_id:${newItem.id},board_id:${boardId}, column_values: \"{\\\"board_relation\\\" : {\\\"item_ids\\\" : [${copro.idMonday}]}}\") {id}}` )
      } catch (error) {
        console.error("Erreur lors de la création de l'élément:", error);
      }
}


//extraction des contrat par copro

module.exports = synchroMandats;
