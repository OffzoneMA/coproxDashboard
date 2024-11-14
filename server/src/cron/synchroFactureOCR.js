const vilogiService = require('../services/vilogiService');
const json2csv = require('json2csv').parse;
const coproService = require('../services/coproService');
const mondayService = require('../services/mondayService');
const scriptService = require('../services/ScriptService');
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
const downloadPath="downloads/factureOCR/"
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
let FinalContrat = [];
const boardId = 1524894296;
const typeData="factures"

const synchroMandats = {
    start: async () => {
        console.log('Start Extraction ...');
        logs.logExecution("synchroFactureOCR")
        const LogId = await scriptService.logScriptStart('synchroFactureOCR');
        //console.log(await mondayService.getItemsGroup("1553168953"))
        try {
            let facturesMonday = await mondayService.getItemsGroup(boardId,"nouveau_groupe93577__1");
            //console.log(facturesMonday)
            for (factureMonday of facturesMonday){
                detailFactureMonday = await mondayService.getItemsDetails(factureMonday.id)
                //console.log(detailFactureMonday.column_values)
                if(factureMonday.group.id!="nouveau_groupe93577__1"){
                  
                  // await vilogiService.OCRvilogifacture()
                  //factureMonday.id
                  let data =await mondayService.getItemsDetails("1632413039")
                  console.log(data.column_values)
                  for (column of data.column_values){
                    if (column.id=="fichier__1"){
                      console.log("heeeeeere- ----------  -----------------------------------------------------")
                      const parsedData = JSON.parse(column.value);
                      for (const file of parsedData.files) {
                        await mondayService.downloadFileFromMonday(file.assetId, downloadPath, file.name);
                        
                        await vilogiService.sendFactureToOCR(`${process.env.VILOGI_test_IDCOPROEXEMPLE}`,downloadPath+file.name) 
                      }
                      for (file of column.value.files){
                        console.log(file)
                        }
                          
                    }
                      
                  }
                  //await mondayService.moveItemToGroup(factureMonday.id,"nouveau_groupe11385__1")
                    
                }
                
                
            }
            

            //console.log(FinalContrat)
            await scriptService.updateLogStatus('synchroFactureOCR',LogId ,2 ,"Script executed successfully");
  
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

async function manageZendeskTicketFacture(idTicket,itemID) {
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
          const filePath = await path.join(__dirname, `../../downloads/zendesk/zendesk - ${idTicket} - ${attachment.file_name}`); // Replace with your file path
          await mondayService.uploadFileToMonday(filePath,itemID,"fichier__1");
          //await saveFileToDropbox(`downloads/zendesk/zendesk - ${idTicket} - ${attachment.file_name}`,`zendesk - ${ticket.id} - ${attachment.file_name}`)
        }

      } else {

      }
    }
    const { tags } = ticketData[0];

    let updateData = {
      ticket: {
        comment: {
          body: `ce ticket a été transferer à monday pour pouvoir suivre ce ticket merci de vous connecter sur l'espace facture: https://coprox.monday.com/boards/1524894296/pulses/${itemID}`,
          public: false
        }
      }
    };
    
    console.log(tags)
    if (!tags.includes('avis_cs_en_cours')) {//// !tags.includes('monday') &&  removed if tags include monday
      console.log("-------------------------------------------------------------------------------------------------")
      updateData.ticket.status = "solved";
    }
    
    await zendeskService.updateTicket(idTicket, updateData);
    //console.log(ticketData)
    await delay(100)
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
  
      let outputFileName= `downloads/zendesk/zendesk - ${ticketID} - ${filename}`
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
