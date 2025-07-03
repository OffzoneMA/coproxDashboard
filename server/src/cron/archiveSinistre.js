const vilogiService = require('../services/vilogiService');
const json2csv = require('json2csv').parse;
const coproService = require('../services/coproService');
const mondayService = require('../services/mondayService');
const scriptService = require('../services/scriptService');
const mondayVilogiSyncService = require('../services/mondayVilogiSyncService');
const dropboxService = require('../services/dropboxService')
const logs = require('../services/logs');
const fs = require('fs');
// mondayService.js
const mondaySdk = require("monday-sdk-js");
const monday = mondaySdk();
monday.setApiVersion("2023-10");
const storageFilePath="downloads/archives/courrier/"
monday.setToken(process.env.MONDAY_API_KEY)

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
let FinalContrat = [];
const boardId = 1430679078;
const typeData="courriers"

const archiveCourrier = {
    start: async () => {
        console.log('Start Extraction ...');
        logs.logExecution("archiveCourriel")

        //const LogId = await scriptService.logScriptStart('archiveCourrier');
        //console.log(await mondayService.getItemsDetails(1638270065))
        try {
            const list =await mondayService.getItemsGroup(boardId)
            // Filter items by group title 'Courrier envoyé 📬'
            const courriersEnvoye = list.filter(item => item.group.title === 'Courrier envoyé 📬');

            for (let courrierEnvoye of courriersEnvoye) {
                console.log('Items in "Courrier envoyé 📬":', courrierEnvoye);
                await saveFileLocally(courrierEnvoye.id,courrierEnvoye.name);
            }

            //const itemid=1638281196
            await saveFileLocally(itemid)



            //await scriptService.updateLogStatus('archiveCourrier',LogId ,0 ,"Script executed successfully");
            
            //console.log(FinalContrat)
            console.log('--------------------------------------------------------------------------------------------END Extraction ...');
        } catch (error) {



            //await scriptService.updateLogStatus('archiveCourrier',LogId ,0 ,"Something went wrong");
            console.error('An error occurred:', error.message);
        }
    }
};


async function saveFileLocally(itemid,name) {
    try {
        const data = await mondayService.getItemsDetails(itemid);
        for (let element of data.column_values) {
          if (element.type === 'file') {
            if (element.value) {
              try {
                const parsedValue = JSON.parse(element.value);  // Assuming element.value is a JSON string
                if (parsedValue.files && parsedValue.files.length > 0) {
                  for (let file of parsedValue.files) {  // Replaced forEach with a regular for loop to support await
                    console.log(file);
                    const filename=name+" - "+file.assetId+" - "+file.name
                    await mondayService.downloadFileFromMonday(file.assetId, storageFilePath,filename);  // Download each file,
                    await saveFileToDropbox(storageFilePath,filename)
                  }
                } else {
                  console.log('No files found');
                }
              } catch (error) {
                console.error('Error parsing file value:', error);
              }
            }
          }
        }
        //await mondayService.moveItemToGroup(itemid,"nouveau_groupe64818__1")
    } catch (error) {
        console.error('Error getting file from API:', error);
    }
  }

  
  const saveFileToDropbox = async (filePath,filename) => {
    try {
        const buffer = await fs.promises.readFile(filePath+filename);
        
        const req = {
            filename: filename,
            buffer: buffer,
            foldername:`TCP COURRIERS/COURRIER ENVOYES`
            
        };
        
        const res = {
          json: (response) => console.log(response),
          status: (code) => ({ json: (response) => console.log(response) }),
        };
        await dropboxService.uploadFile(req, res);
    } catch (error) {
        console.log(error)
    }
    
  };


//extraction des contrat par copro

module.exports = archiveCourrier;
