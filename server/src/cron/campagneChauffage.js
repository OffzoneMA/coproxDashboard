const coproService = require('../services/coproService');
const mondayService = require('../services/mondayService');
const logs = require('../services/logs');
const boardID=1430634804

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const campagneChauffage = {
    start: async () => {
        logs.logExecution("campagneChauffage")

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
            await mondayService.createItem(boardID,itemName,columnValues)
            await delay(300)
          }
        }
    }

}

module.exports = campagneChauffage;
