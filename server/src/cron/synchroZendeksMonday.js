const vilogiService = require('../services/vilogiService');
const json2csv = require('json2csv').parse;
const coproService = require('../services/coproService');
const mondayService = require('../services/mondayService');
const zendeskService = require('../services/zendeskService');
const logs = require('../services/logs');
const fs = require('fs');
listIDBoards=[1429379552]

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const synchroZendeksMonday = {
    start: async () => {
        console.log('Start Extraction ...');
        try {
            for (const boardID in listIDBoards){
                const tableData=await mondayService.getItems(listIDBoards[boardID]);
                //console.log(tableData.items_page.items)
                for( const item in tableData.items_page.items){
                    console.log(tableData.items_page.items[item])
                    const itemDetail=await mondayService.getItemsDetails(tableData.items_page.items[item].id);
                    for(column in itemDetail.column_values)
                        console.log("ColumnID : ",itemDetail.column_values[column].id,"                 Column : ",itemDetail.column_values[column].column.title,"                  Value : " ,itemDetail.column_values[column].value)
                }
                //let detailCopro = await coproService.detailsCopropriete(idCopro);
            }


            console.log('--------------------------------------------------------------------------------------------END Extraction ...');
        } catch (error) {
            console.error('An error occurred:', error.message);
        }
    }
};

//extraction des contrat par copro

module.exports = synchroZendeksMonday;
