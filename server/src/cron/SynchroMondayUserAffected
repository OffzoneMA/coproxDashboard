const vilogiService = require('../services/vilogiService');
const json2csv = require('json2csv').parse;
const coproService = require('../services/coproService');
const mondayService = require('../services/mondayService');
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
Boards.push({ "BoardID": 1429385759, "PersonColumn": "person" });
//Boards.push({ "BoardID": 1429379552, "PersonColumn": "person" }); /// gestion des acces
//Boards.push({ "BoardID": 1429385759, "PersonColumn": "person" }); //// Gestion des ventes



const SynchroMondayUserAffected = {
    start: async () => {
        console.log(Boards)
        console.log('Start Extraction ...');
        logs.logExecution("SynchroMondayUserAffected")
        try {
            for(board of Boards){
                let items = await mondayService.getItems(board.BoardID);
                //console.log(items)
    
                for(item of items){
                    //console.log(item.id)
                    let detailItems = await mondayService.getItemsDetails(item.id);
                    //console.log(detailItems.column_values)
                    for(column of detailItems.column_values ){
                        //console.log(column.id)
                        if (column.id === board.PersonColumn) {
                            
                            console.log(column.value,"FIIIIINNNNDE IIIIT ")
                            if(column.value === null){
                                console.log(item.id,"Culumn null -")
                            }else {
                                console.log(item.id,"break")
                                break
                            }
                        }
                        if (column.id === "texte0") {
                            if(column.value === null){
                                break
                            }else{
                                const [groupZendesk, personZendesk] = column.value.split(" - ").map(part => part.replace(/^"|"$/g, ''));
    
                                console.log(personZendesk);
                                
                                if (personZendesk === "15116020640413") {
                                    const valueData = {"person" : {"personsAndTeams":[{"id":55496685,"kind":"person"}]}}
                                    await mondayService.updateItem(board.BoardID,item.id,valueData)
                                    console.log("Aurelie ----------------------------");
                                }
                                
                                if (personZendesk === "15115995844637") {
                                    
                                    const valueData = {"person" : {"personsAndTeams":[{"id":57551950,"kind":"person"}]}}
                                    await mondayService.updateItem(board.BoardID,item.id,valueData)
                                    console.log("Lucile ----------------------------");
                                }
                                if (personZendesk === "15420362913693") {
                                    
                                    const valueData = {"person" : {"personsAndTeams":[{"id":57551928,"kind":"person"}]}}
                                    await mondayService.updateItem(board.BoardID,item.id,valueData)
                                    console.log("Anois ----------------------------");
                                }
                                if (personZendesk === "16310145706013") {
                                    
                                    const valueData = {"person" : {"personsAndTeams":[{"id":57551922,"kind":"person"}]}}
                                    await mondayService.updateItem(board.BoardID,item.id,valueData)
                                    console.log("Pauline ----------------------------");
                                }
                                if (personZendesk === "16427900046109") {
                                    
                                    const valueData = {"person" : {"personsAndTeams":[{"id":57551944,"kind":"person"}]}}
                                    await mondayService.updateItem(board.BoardID,item.id,valueData)
                                    console.log("Myriam ----------------------------");
                                }
                                if (personZendesk === "15206663482269") {
                                    
                                    const valueData = {"person" : {"personsAndTeams":[{"id":57551935,"kind":"person"}]}}
                                    await mondayService.updateItem(board.BoardID,item.id,valueData)
                                    console.log("Melanie ----------------------------");
                                }
                                
                                    
                            }  
    
                        }
    
                    }
    
                    
    
                }
            }

        } catch (error) {
            console.error('An error occurred:', error.message);
        }
    }
};




//extraction des contrat par copro

module.exports = SynchroMondayUserAffected;
