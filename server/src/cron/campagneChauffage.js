const coproService = require('../services/coproService');
const mondayService = require('../services/mondayService');
const vilogiService = require('../services/vilogiService');
const mondayVilogiSyncService = require('../services/mondayVilogiSyncService');

const logs = require('../services/logs');
const boardID=1430634804
const boardContrat = 1455203182;
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const campagneChauffage = {
    start: async () => {
        logs.logExecution("campagneChauffage")
        
        //const data = await mondayService.getItemsDetails(1469021637);
        //console.log(data)
        const action="Fermeture"
        const copros = await coproService.listCopropriete();
        const année = new Date().getFullYear();
        await mondayService.createGroup(boardID,`${action} saison ${année}`)
        for (const copro of copros) {
          if(copro.typeChauffage==="COLLECTIF"){
            const itemName = `${action} ${copro.idCopro}`
            const columnValues = {
              // ...(copro.idMonday != null && { board_relation: { "item_ids": [copro.idMonday] } }),
            };
            const IDItem = await mondayService.createItem(boardID,itemName,columnValues)
            await delay(300)
            const contrats = await vilogiService.getCoproContratEntretien(copro.idVilogi)
            for (contrat of contrats){
              if (contrat.typecontrat ==="Maintenance chauffage primaire"){/// primaire
                const columnValues = {
                };
                const checkValue= await mondayVilogiSyncService.getItemsByInfo(boardContrat,contrat.id)
                console.log(checkValue)
                await mondayService.createSubitem(IDItem.id,"Chauffage primaire",columnValues)

              }
              if (contrat.typecontrat ==="Maintenance chauffage secondaire"){/// Secondaire
                const checkValue= await mondayVilogiSyncService.getItemsByInfo(boardContrat,contrat.id)
                console.log(checkValue)
                const columnValues = {
                };
                await mondayService.createSubitem(IDItem.id,"Chauffage secondaire")
                //console.log("MAINTENANCE CHAUFFAGE - P2 - RÉSEAU SECONDAIRE")
              }
              
            }
            await delay(300)
          }
        }
    }

}

module.exports = campagneChauffage;
