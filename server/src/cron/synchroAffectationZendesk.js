const vilogiService = require('../services/vilogiService');
const json2csv = require('json2csv').parse;
const coproService = require('../services/coproService');
const mondayService = require('../services/mondayService');
const scriptService = require('../services/scriptService');
const zendeskService = require('../services/zendeskService');
const mondayVilogiSyncService = require('../services/mondayVilogiSyncService');
const logs = require('../services/logs');
const fs = require('fs');
const path = require('path');
const axios = require('axios');


function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


const synchroAffectationZendesk = {
    start: async () => {
        console.log('Start Extraction ...');
        logs.logExecution("synchroAffectationZendesk")
        //const LogId = await scriptService.logScriptStart('synchroAffectationZendesk');
        //console.log(await mondayService.getItemsDetails("1431956408"))
        try {
          let tickets = await zendeskService.ticketsNotAssigned()
          for (ticket of tickets){
            if (ticket.group_id=== null || ticket.assignee_id !== null)continue
            if (ticket.custom_fields) {
                const targetField = ticket.custom_fields.find(field => field.id === 15261491191197);
                if (targetField && targetField.value !== null) {
                    console.log("la valeur du champ copro est : ", targetField.value);
                    let organisation = await zendeskService.getOrganizationsById(targetField.value)
                    console.log("L'organisation est : ", organisation );
                    if (ticket.group_id=== 28006068293021)//🌸 Référente Vie Copro
                    {}
                    if (ticket.group_id=== 28006084012445)//👑 Référente Copro
                    {}
                    if (ticket.group_id=== 28005995850397)//🚒 Référente pb équipement GENANT
                    {}
                    if (ticket.group_id=== 28006102203933)//✍️ Référente Nuisances - Accès - Adm Copro
                    {}
                    
                        let updateData = {
                          "ticket": {
                              "assignee_id": 4412125236573,
                              "group_id": 360011606578
                          }
                        };
                        //await zendeskService.updateTicket(ticket.id, updateData);
                        await delay(1000);
                      } else {
                        console.log("No item found for coproName : ", coproName)
                      }
                    
                } else {
                  console.log(`Skipping ticket ${ticket.id} because its custom field is null or missing.`);
                }
                            
          }

            

            //console.log(FinalContrat)
            await scriptService.updateLogStatus('synchroAffectationZendesk',LogId ,0 ,"Script executed successfully");
  
            console.log('--------------------------------------------------------------------------------------------END Extraction ...');
        } catch (error) {
            //let VolumeCalls = counterEnd[0].nombreAppel - counterStart[0].nombreAppel           
            //await scriptService.updateLogStatus('synchroAffectationZendesk',LogId ,-1,`An error occurred: ${error.message} ` );
           console.error('An error occurred:', error.message);
        }
    }
};






module.exports = synchroAffectationZendesk;
