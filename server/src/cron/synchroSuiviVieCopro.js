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

const today = new Date();

// Fonction pour formater une date en 'YYYY-MM-DD'
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
const boardIdRead = 1882791012;
const boardIdCreate = 1973176600;

const synchroMandats = {
    start: async () => {
        console.log('Start Extraction ...');
        logs.logExecution("synchroSuiviVieCopro")
        const LogId = await scriptService.logScriptStart('synchroSuiviVieCopro');
        //console.log(await mondayService.getItemsDetails("1431956408"))
        try {
            let copros = await mondayService.getItems(boardIdRead)
            for (const copro of copros){
              let actions = await mondayService.getItemsDetails(copro.id)
              let numbersArray = [];

              actions.column_values.forEach(col => {
                if (col.type === 'numbers' && col.value !== null) {
                  try {
                    // Remove quotes manually
                    const cleanedValue = col.value.replace(/^"|"$/g, '');
                    const numericValue = Number(cleanedValue);
              
                    if (isNaN(numericValue)) {
                      throw new Error(`Final parsed value is not a number: ${cleanedValue}`);
                    }
              
                    numbersArray.push({
                      id: col.id,
                      value: numericValue,
                      title: col.column?.title || '(No Title)' ////// copro.name +" - "+col.column?.title
                    });
                  } catch (e) {
                    console.log(e.message)
                    console.warn(`Could not parse value for ${col.id}:`, col.value, '| Error:', e.message);
                  }
                }
              });
              await generateData(numbersArray, copro)             
              console.log(numbersArray);
                       
            }
            

            //console.log(FinalContrat)
            await scriptService.updateLogStatus('synchroSuiviVieCopro',LogId ,0 ,"Script executed successfully");
  
            console.log('--------------------------------------------------------------------------------------------END Extraction ...');
        } catch (error) {
            await scriptService.updateLogStatus('synchroSuiviVieCopro',LogId ,-1,`An error occurred: ${error.message} `, 0 );
           console.error('An error occurred:', error.message);
        }
    }
};


async function generateData(data, copro) {
  try {
    console.log("Start generateData for ...", copro.name);

    for (const item of data) {
      let verifResult = await verification(item, copro.name);
      if (!verifResult.status) continue;

      const today = new Date();
      const futureDate = new Date(today);

      let daysToAdd = Number(item.value); // Ensure it's a number
      if (isNaN(daysToAdd)) {
        console.error("Invalid item.value (not a number):", item.value);
        continue;
      }

      console.log(`Adding ${daysToAdd} business days to ${today}`);

      let iterationCounter = 0; // Safety counter
      while (daysToAdd > 0 && iterationCounter < 365) { // max 365 iterations
        futureDate.setDate(futureDate.getDate() + 1);
        const day = futureDate.getDay(); // 0 = Sunday, 6 = Saturday
        if (day !== 0 && day !== 6) {
          daysToAdd--;
        }
        iterationCounter++;
      }

      if (iterationCounter >= 365) {
        console.error("Too many iterations - possible infinite loop.");
        continue;
      }

      console.log("Today:", today);
      console.log("Future date (excluding weekends):", futureDate);

      const columnValues = {
        date_mkr7ah56: { date: formatDate(today) },
        date_mkr7ctp1: { date: formatDate(futureDate) },
        ...(verifResult.coproData.idMonday != null && {
          board_relation_mkr7h5hy: {
            item_ids: [verifResult.coproData.idMonday],
          },
        }),
        color_mkr8ptyc: item.title,
      };

      console.log("columnValues", columnValues);

      await saveMonday(copro.name + " - " + item.title, columnValues);
      await coproService.editCopropriete(
        coproData._id,
        { [`suiviCopro.${item.title}`]: formatDate(futureDate) }
      );
    }
  } catch (error) {
    console.error("Erreur lors de la création de l'élément:", error);
  }
}

async function verification(item,copro) {
  try {
  coproData= await coproService.detailsCoproprieteByidCopro(copro)
  console.log("coproData",coproData)
  if (coproData.status == "Inactif") {
    //console.log("Copro Inactif", coproData.status)
    return {status:false}
  }

  if (coproData.suiviCopro && coproData.suiviCopro.hasOwnProperty(item.title)) {
    const suiviDate = new Date(coproData.suiviCopro[item.title]);
    console.log("Found in suiviCopro:", suiviDate);
  
    if (suiviDate > today) {
      console.log("✅ Date is in the future — skipping item.");
      return { status: false }; // or `continue` if you want to skip only this item
    }
  
    if (suiviDate <= today) {
      console.log("⛔ Date is in the past or today — proceeding.");
      return{
        "coproData": coproData,
        "status": true,
      }
    }
  } else {
    console.log(`🔍 '${item.title}' not found in suiviCopro — proceeding by default.`);
    return {
      "coproData": coproData,
      "status": true,
    }
  }
  
} catch (error) {
  console.error("Erreur lors de la verification de l'élement:", error);
}
}

async function saveMonday(itemName,data) {
    try {
        const newItem = await mondayService.createItem(boardIdCreate, itemName, data);
        await delay(300);
        //monday.api(`mutation {change_multiple_column_values(item_id:${newItem.id},board_id:${boardId}, column_values: \"{\\\"board_relation\\\" : {\\\"item_ids\\\" : [${copro.idMonday}]}}\") {id}}` )
      } catch (error) {
        console.error("Erreur lors de la création de l'élement sur monday", error);
      }
}






module.exports = synchroMandats;
