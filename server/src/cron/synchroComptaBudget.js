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
const boardId = 1478258411;
const typeData="synchroComptaBudget"

const synchroMandats = {
    start: async () => {
        console.log('Start Extraction ...');
        logs.logExecution("synchroComptaBudget")
        let counterStart =await vilogiService.countConenction();
        
        const LogId = await scriptService.logScriptStart('synchroComptaBudget');
        //console.log(await mondayService.getItemsDetails("1510643845"))
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
                    let exercices = await vilogiService.getCoproExercice(copro.idVilogi);
                    
                    for(exercice of exercices.list){
                        console.log(exercice)
                        // Verifier si l'exercice est cloturé
                        if(exercice.cloture==1)continue
                        
                        let budgets = await vilogiService.getbudgetCopro(copro.idVilogi,exercice.id);
                       


  
 
                        const groupedBudgets = new Map();

                        for (const budget of budgets) {
                          const { idCle, montant, idCompte, cle } = budget;
                      
                          // Retrieve budget compte details by date
                          let budgetj = await vilogiService.getbudgetComptebyDate(copro.idVilogi, idCompte, datedujour);
                          if (budgetj === undefined || budgetj === '' || Object.keys(budgetj).length === 0) continue;
                      
                          if (!groupedBudgets.has(idCle)) {
                            groupedBudgets.set(idCle, { montantTotal: 0, idComptes: new Set(), count: 0, soldeTotal: 0, cle: cle });
                          }
                      
                          const budgetGroup = groupedBudgets.get(idCle);
                          budgetGroup.montantTotal += parseFloat(montant);
                          budgetGroup.idComptes.add(idCompte);
                          budgetGroup.count += 1;
                          budgetGroup.soldeTotal += budgetj[0].solde; // Sum the solde for the idCompte
                        }
                      
                        // Convert the Set of idComptes back to an array if needed
                        const result = Array.from(groupedBudgets.entries()).reduce((acc, [idCle, { montantTotal, idComptes, count, soldeTotal, cle }]) => {
                          acc[idCle] = { montantTotal, idComptes: Array.from(idComptes), count, soldeTotal, cle };
                          return acc;
                        }, {});
                      
                        // Log each idCle with its corresponding cle, montantTotal, idComptes, count, and soldeTotal
                        for (const [idCle, { montantTotal, idComptes, count, soldeTotal, cle }] of Object.entries(result)) {
                          console.log(`idCle: ${idCle}, cle: ${cle}, montantTotal: ${montantTotal}, idComptes: ${idComptes.join(', ')}, count: ${count}, soldeTotal: ${soldeTotal}`);
                        }
                      
  
  
                        continue
                        let budgetj = await vilogiService.getbudgetComptebyDate(copro.idVilogi,budget.idCompte,datedujour);
                        if (budget === undefined || budget === '' )  continue
                        if (budgetj === undefined || budgetj === '' || budgetj.length === 0 )  continue
                        let j=0
                        //console.log(exercices)
    
                            
                            
                            j++;
                            //let assemblee = await vilogiService.getCoproAssemblee(copro.idVilogi,travaux.assemblee);
                        
                            const columnValues = {
                                
                                     ...(copro.idMonday != null && { connecter_les_tableaux__1: { "item_ids": [copro.idMonday] } }),
                                     chiffres__1:budgetj[0].solde,
                                     chiffres_1__1:budget.montant,
                                     texte__1:budget.idExercice,
                                     date__1:{"date" : exercice.datefin.split('/').reverse().join('-')},
                                     
                                  };                   
                            const itemName = `${budget.nomBudget}`;
                            const generateid = copro.idVilogi+budget.idCompte+budget.idCle+budget.idExercice
                            console.log(generateid)
                            await saveMonday(itemName,columnValues,generateid)
                    

                    }
                    
                    
                    //

                    //let assemblee = await vilogiService.getCoproAssemblee(copro.idVilogi,travaux.assemblee);
                    

   

  
                }
            }
            let counterEnd =await vilogiService.countConenction();
            
        let VolumeCalls = counterEnd[0].nombreAppel - counterStart[0].nombreAppel           
            await scriptService.updateLogStatus('synchroComptaBudget',LogId ,2 ,`Script executed successfully `, VolumeCalls );
            //console.log(FinalContrat)
            console.log('--------------------------------------------------------------------------------------------END Extraction ...');
        } catch (error) {
            let counterEnd =await vilogiService.countConenction(); 
            let VolumeCalls = counterEnd[0].nombreAppel - counterStart[0].nombreAppel           
            await scriptService.updateLogStatus('synchroComptaBudget',LogId ,-1,`An error occurred: ${error.message} `, VolumeCalls );
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
