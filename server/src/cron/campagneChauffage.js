const coproService = require('../services/coproService');
const mondayService = require('../services/mondayService');
const vilogiService = require('../services/vilogiService');
const scriptService = require('../services/ScriptService');
const mondayVilogiSyncService = require('../services/mondayVilogiSyncService');

const logs = require('../services/logs');
const boardID=1430634804
const boardContrat = 1455203182;
const subItemBoards=1468611672;
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const campagneChauffage = {
    start: async () => {
        logs.logExecution("campagneChauffage")
        const LogId = await scriptService.logScriptStart('campagneChauffage');
        //const data = await mondayService.getItemsDetails(1469479876);
        //console.log(data)
        const action="Ouverture"
        const copros = await coproService.listCopropriete();
        const année = new Date().getFullYear();
        await mondayService.createGroup(boardID,`${action} saison ${année}`)
        for (const copro of copros) {
          if(copro.typeChauffage==="COLLECTIF"){
            const itemName = `${action} ${copro.idCopro}`
            const columnValues = {
              ...(copro.idMonday != null && { board_relation: { "item_ids": [copro.idMonday] } }),
            };
            try {
              const IDItem = await mondayService.createItem(boardID,itemName,columnValues)
              await delay(300)
              const contrats = await vilogiService.getCoproContratEntretien(copro.idVilogi)
              for (contrat of contrats){
                //console.log(contrat)
                if (contrat.typecontrat ==="Maintenance chauffage primaire" && contrat.datefin===""){/// primaire
                  const checkValue= await mondayVilogiSyncService.getItemsByInfo(boardContrat,contrat.id)
                  console.log(checkValue[0].mondayItenID)
                  const columnValues = {
                    //t_l_phone__1:,
                    //date0
                    //e_mail__1
                    ...(checkValue[0].mondayItenID != null && { board_relation__1: { "item_ids": [checkValue[0].mondayItenID] } }),
                  };
                  const val = await mondayService.createSubitem(IDItem.id,"Maintenance chauffage primaire")
                  console.log(val.id)
                  await mondayService.updateItem(subItemBoards,val.id,columnValues)
  
                }
                if (contrat.typecontrat ==="Maintenance chauffage secondaire" && contrat.datefin===""){/// Secondaire
                  const checkValue= await mondayVilogiSyncService.getItemsByInfo(boardContrat,contrat.id)
                  console.log(checkValue[0].mondayItenID)
                  const columnValues = {
                    ...(checkValue[0].mondayItenID != null && { board_relation__1: { "item_ids": [checkValue[0].mondayItenID] } }),
                  };
                  const val = await mondayService.createSubitem(IDItem.id,"Maintenance chauffage secondaire")
                  console.log(val.id)
                  await mondayService.updateItem(subItemBoards,val.id,columnValues)
                  //console.log("MAINTENANCE CHAUFFAGE - P2 - RÉSEAU SECONDAIRE")
                }
                
              }
              await delay(300)
              await scriptService.updateLogStatus('campagneChauffage',LogId ,2 ,"Script executed successfully");
            } catch (error) {
              console.log(error)
            }

          }
        }
    }

}

module.exports = campagneChauffage;
