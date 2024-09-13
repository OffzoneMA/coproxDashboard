const vilogiService = require('../services/vilogiService');
const json2csv = require('json2csv').parse;
const coproService = require('../services/coproService');
const mondayService = require('../services/mondayService');
const scriptService = require('../services/ScriptService');
const zendeskService = require('../services/zendeskService');
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
let Boards = [];

Boards.push({ "BoardID": 1524894296, "PersonColumn": "" , "coproColumn": "connecter_les_tableaux__1"}); // Tableau facture


Boards.push({ "BoardID": 1511021735, "PersonColumn": "personnes__1" , "coproColumn": "board_relation"}); // tableau Tache copro
Boards.push({ "BoardID": 1511021735, "PersonColumn": "person" , "coproColumn": "board_relation"});// tableau tach copro 
//Boards.push({ "BoardID": 1429379552, "PersonColumn": "person" }); /// gestion des acces
//Boards.push({ "BoardID": 1429385759, "PersonColumn": "person" }); //// Gestion des ventes
Boards.push({ "BoardID": 1549773496, "PersonColumn": "" , "coproColumn": "connecter_les_tableaux__1"}); // tableau des avis de virements



const SynchroMondayUserAffected = {
    start: async () => {
        console.log(Boards)
        console.log('Start Extraction ...');
        logs.logExecution("synchroMondayUserAffected")
        const LogId = await scriptService.logScriptStart('synchroMondayUserAffected');
        try {
            for(board of Boards){
                await delay(500)
                let items = await mondayService.getItems(board.BoardID);
                //console.log(items)
    
                for(item of items){
                    //console.log(item.id)
                    let detailItems = await mondayService.getItemsDetails(item.id);
                    //console.log(detailItems.column_values)
                    for(column of detailItems.column_values ){
                        //console.log(column.id)
                        
                        if (column.id === "zendesk_ticket__1") {
                            const data = JSON.parse(column.value)
                            console.log(data,"---------------------------------------------------------------------------------------- ")
                            if(data === null || data === undefined || data === '' ){

                            }else{
                                await delay(500)
                                await managementAffectation(data.entity_id,board,item.id)
                            }
                                

                            continue
                            if(column.value === null){
                                console.log(item.id,"Culumn null -")
                            }else {
                                console.log(item.id,"break")
                                //break
                            }
                        }
    
                    }              
    
                }
            }
            await scriptService.updateLogStatus('synchroMondayUserAffected',LogId ,2 ,"Script executed successfully");
        } catch (error) {
            console.error('An error occurred:', error.message);
        }
    }
};

async function managementAffectation(idTicket,board,ItemID,) {
    try {
        console.log(board)
        await delay (100)
        let ticketData = await zendeskService.getTicketsById(idTicket)
        if(board.PersonColumn!=""){
            AffectInMondayPerson(ticketData[0].assignee_id,board.BoardID, ItemID,board.PersonColumn)
            await delay (100)
        }
        const coproField = ticketData[0].custom_fields.find(field => field.id === 15261491191197);
        AffectInMondayCopro(coproField.value,board.BoardID, ItemID,board.coproColumn)
        await delay(100)
    } catch (error) {
        
    }

}
async function AffectInMondayPerson(personZendesk,BoardID, ItemID,fieldID) {
    
    await delay (100)
    console.log(personZendesk)
    if (personZendesk === 15116020640413) {
        const valueData = {[fieldID] : {"personsAndTeams":[{"id":55496685,"kind":"person"}]}}
        await mondayService.updateItem(BoardID,ItemID,valueData)
        console.log("Aurelie ----------------------------");
    }
    
    if (personZendesk === 15115995844637) {
        
        const valueData = {[fieldID]  : {"personsAndTeams":[{"id":57551950,"kind":"person"}]}}
        await mondayService.updateItem(BoardID,ItemID,valueData)
        console.log("Lucile ----------------------------");
    }
    if (personZendesk === 15420362913693) {
        
        const valueData = {[fieldID]  : {"personsAndTeams":[{"id":61788924,"kind":"person"}]}}
        await mondayService.updateItem(BoardID,ItemID,valueData)
        console.log("Myriam ----------------------------");
    }
    if (personZendesk === 16310145706013) {
        
        const valueData = {[fieldID]  : {"personsAndTeams":[{"id":57551922,"kind":"person"}]}}
        await mondayService.updateItem(BoardID,ItemID,valueData)
        console.log("Pauline ----------------------------");
    }
    if (personZendesk === 16427900046109) {
        
        const valueData = {[fieldID] : {"personsAndTeams":[{"id":61788926,"kind":"person"}]}}
        await mondayService.updateItem(BoardID,ItemID,valueData)
        console.log("Radmila ----------------------------");
    }
    if (personZendesk === 15206663482269) {
        
        const valueData = {[fieldID] : {"personsAndTeams":[{"id":61951130,"kind":"person"}]}}
        await mondayService.updateItem(BoardID,ItemID,valueData)
        console.log("Melanie ----------------------------");
    }
    if (personZendesk === 19963936076061) {
        
        const valueData = {[fieldID] : {"personsAndTeams":[{"id":62858174,"kind":"person"}]}}
        await mondayService.updateItem(BoardID,ItemID,valueData)
        console.log("Melanie ----------------------------");
    }
}


async function AffectInMondayCopro(coproIDZendesk,BoardID, ItemID,fieldID) {
    
    await delay (100)
    console.log(coproIDZendesk)
    const coproZendesk= await zendeskService.getOrganizationsById(coproIDZendesk)
    //console.log(coproZendesk[0].name)
    const copro=await coproService.detailsCoproprieteByidCopro(coproZendesk[0].name)
    //console.log(copro)
    const valueData = {...(copro.idMonday != null && { [fieldID]: { "item_ids": [copro.idMonday] } })}

    await mondayService.updateItem(BoardID,ItemID,valueData)

}

//extraction des contrat par copro

module.exports = SynchroMondayUserAffected;

