const vilogiService = require('../services/vilogiService');
const json2csv = require('json2csv').parse;
const coproService = require('../services/coproService');
const mondayService = require('../services/mondayService');
const scriptService = require('../services/scriptService');
const mondayVilogiSyncService = require('../services/mondayVilogiSyncService');
const logs = require('../services/logs');
const fs = require('fs');
const boardId = 1750607040;
const typeData="synchoNomMandat"

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
let FinalContrat = [];

const synchoNomMandat = {
    start: async () => {
        logs.logExecution("synchoNomMandat")
        console.log('Start Extraction ...');
        let counterStart =await vilogiService.countConenction();
        const LogId = await scriptService.logScriptStart('synchoNomMandat');
        try {
            let mandats = await mondayService.getItems(boardId);
            let FinalContrat = [];  // Initialize FinalContrat array
            let TotalContrat=0
            //const data = await mondayService.getItemsDetails(1466840974);
            //console.log(data)

            for (const mandat of mandats) {
                console.log(mandat);
            
                const infomandat = await mondayService.getItemsDetails(mandat.id);
                let nameValue = '';
                let DateDebutValue = { date: '' };
                let DateFinValue = { date: '' };
                let coproName = '';
            
                for (const column_values of infomandat.column_values) {
                    switch (column_values.column.id) {
                        case "texte_mkkcwgf8":
                            nameValue = (column_values.value || '').replace(/"/g, ''); // Remove double quotes
                            break;
            
                        case "date_mkkc5eq5":
                            if (column_values.value==null) break;
                            DateDebutValue = JSON.parse(column_values.value).date || { date: '' }; // Fallback to an object with an empty date
                            break;
            
                        case "date_mkkcsy1c":
                            if (column_values.value==null) break;
                            DateFinValue = JSON.parse(column_values.value).date || { date: '' }; // Fallback to an object with an empty date
                            break;
            
                        case "connecter_les_tableaux_mkkc14w4":
                            if (column_values.value==null) {
                                coproName = ''; // Set empty if no value or no linkedPulseIds
                                break;
                            }
                            const valueObject = JSON.parse(column_values.value);
                            const coproID = valueObject.linkedPulseIds[0].linkedPulseId; // Safely access the first linkedPulseId
                            //console.log(coproID)
                            if (coproID==null) {
                                console.log("nuuuuuuuuul")
                            }
                            else{
                                const coproInfo = await mondayService.getItemsDetails(coproID);
                                coproName = coproInfo.name || ''; // Safeguard coproInfo.name
                                //console.log(coproInfo.name);
                            }
                            break;
                    }
                }
            
                let newMandatname = `${nameValue} | ${DateDebutValue || ''} | ${DateFinValue || ''}`;
                console.log(newMandatname);
            
                // Uncomment when ready to update
                 await mondayService.updateItemName(boardId, mandat.id, newMandatname);
            }
            //console.log(FinalContrat)

            let counterEnd =await vilogiService.countConenction();
            let VolumeCalls = counterEnd[0].nombreAppel - counterStart[0].nombreAppel           
            await scriptService.updateLogStatus('synchoNomMandat',LogId ,0 ,`Script executed successfully `, VolumeCalls );
            
            console.log('--------------------------------------------------------------------------------------------END Extraction ...');
        } catch (error) {
            let counterEnd =await vilogiService.countConenction(); 
            let VolumeCalls = counterEnd[0].nombreAppel - counterStart[0].nombreAppel           
            await scriptService.updateLogStatus('synchoNomMandat',LogId ,-1,`An error occurred: ${error.message} `, VolumeCalls );
            console.error('An error occurred:', error.message);
        }
    }
};



async function saveMonday(itemName,data,idVilogi) {
    try {
        const checkValue= await mondayVilogiSyncService.getItemsByInfo(boardId,idVilogi)
        console.log(checkValue)
        if(checkValue.length > 0){
            console.log(boardId, checkValue[0].mondayItenID, data)
            console.log("Already exist")
            const newItem = await mondayService.updateItem(boardId, checkValue[0].mondayItenID, data);
            await mondayService.updateItemName(boardId, checkValue[0].mondayItenID, itemName)
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

module.exports = synchoNomMandat;
