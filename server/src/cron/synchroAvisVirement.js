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
// mondayService.js
const mondaySdk = require("monday-sdk-js");
const monday = mondaySdk();
monday.setApiVersion("2023-10");
monday.setToken(process.env.MONDAY_API_KEY)

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
let FinalContrat = [];
const boardId = 1549773496;
const typeData="AvisVirements"

const synchroMandats = {
    start: async () => {
        console.log('Start Extraction ...');
        logs.logExecution("synchroAvisVirement")
        const LogId = await scriptService.logScriptStart('synchroAvisVirement');
        console.log(await mondayService.getItemsDetails("1554378383"))
        try {
            let AvisVirementsMonday = await mondayService.getItemsGroup(boardId,"topics");
            for (AvisVirementMonday of AvisVirementsMonday){
                detailAvisVirementMonday = await mondayService.getItemsDetails(AvisVirementMonday.id)
                //console.log(detailAvisVirementMonday.column_values)
                if(AvisVirementMonday.group.id=="topics"){
                  for (columns of detailAvisVirementMonday.column_values){
                    if (columns.id =="zendesk_ticket__1"){
                        const data = JSON.parse(columns.value)
                        if (data == null)continue
                        await manageZendeskTicketAvisVirement(data.entity_id,AvisVirementMonday.id)

                    }
                }
                }
                
            }
            

            //console.log(FinalContrat)
            await scriptService.updateLogStatus('synchroAvisVirement',LogId ,0 ,"Script executed successfully");
  
            console.log('--------------------------------------------------------------------------------------------END Extraction ...');
        } catch (error) {
            let VolumeCalls = counterEnd[0].nombreAppel - counterStart[0].nombreAppel           
            await scriptService.updateLogStatus('synchroAvisVirement',LogId ,-1,`An error occurred: ${error.message} `, VolumeCalls );
           console.error('An error occurred:', error.message);
        }
    }
};



async function manageZendeskTicketAvisVirement(idTicket,itemID) {
  try {
    let ticketData = await zendeskService.getTicketsById(idTicket)
    const ticketDetails = await zendeskService.getTicketsComments(idTicket);
    const lengthComment = ticketDetails.length;
    //console.log(ticketData);
    for (let i = lengthComment - 1; i >= 0; i--) {
      if (ticketDetails[i].attachments) {
        for (const attachment of ticketDetails[i].attachments) {
            console.log(attachment.file_name)
          await saveFile(attachment.content_url,idTicket,attachment.file_name)
          await delay(500)
          const filePath = await path.join(__dirname, `../../downloads/zendesk/avisVirement - ${idTicket} - ${attachment.file_name}`); // Replace with your file path
          await mondayService.uploadFileToMonday(filePath,itemID,"file_mkxxm0k9");
          //await saveFileToDropbox(`downloads/zendesk/zendesk - ${idTicket} - ${attachment.file_name}`,`zendesk - ${ticket.id} - ${attachment.file_name}`)
        }

      } else {

      }
    }
    const { tags } = ticketData[0];
  } catch (error) {
    console.log(error)
  }


}

const saveFile = async (Url,ticketID,filename) => {

    try {
      const response = await axios({
        method: 'get',
        url: `${Url}`,
        responseType: 'stream',
      });    
  
      let outputFileName= `downloads/zendesk/avisVirement - ${ticketID} - ${filename}`
      // Pipe the response stream to a file
      response.data.pipe(fs.createWriteStream(outputFileName));
  
      // Wait for the file to be fully written
      await new Promise((resolve, reject) => {
        response.data.on('end', resolve);
        response.data.on('error', reject);
      });
  
      console.log('File downloaded successfully:', outputFileName);
    } catch (error) {
      console.error('Error downloading file:', error.message);
    }
  };

//extraction des contrat par copro

module.exports = synchroMandats;
