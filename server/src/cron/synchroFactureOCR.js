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
const mondaySdk = require("monday-sdk-js");
const monday = mondaySdk();

monday.setApiVersion("2023-10");
monday.setToken(process.env.MONDAY_API_KEY);

const downloadPath = "downloads/factureOCR/";
const boardId = 1524894296;
const typeData = "factures";

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const saveFile = async (Url, ticketID, filename) => {
    try {
        const response = await axios({
            method: 'get',
            url: `${Url}`,
            responseType: 'stream',
        });

        let outputFileName = `downloads/factureOCR/zendesk - ${ticketID} - ${filename}`;
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

async function manageZendeskTicketFacture(idTicket) {
    try {
        let ticketData = await zendeskService.getTicketsById(idTicket);
        const categorie = ticketData[0].custom_fields.find(field => field.id === 15114688584221);
        console.log(categorie);
        const allowedCategories = ["facture_contrat","facture_fluide"];//, "facture_ocr", "facture_contrat", "facture_travaux"];

        if (!allowedCategories.includes(categorie.value)) {
            return;
        }
        const ticketDetails = await zendeskService.getTicketsComments(idTicket);
        const lengthComment = ticketDetails.length;

        for (let i = lengthComment - 1; i >= 0; i--) {
            if (ticketDetails[i].attachments) {
                for (const attachment of ticketDetails[i].attachments) {
                    console.log(attachment.file_name);
                    await saveFile(attachment.content_url, idTicket, attachment.file_name);
                    await delay(500);
                    const coproField = ticketData[0].custom_fields.find(field => field.id === 15261491191197);
                    console.log(coproField);
                    const coproZendesk = await zendeskService.getOrganizationsById(coproField.value);
                    console.log(coproZendesk[0].name);
                    const copro = await coproService.detailsCoproprieteByidCopro(coproZendesk[0].name);
                    console.log(copro.idVilogi);

                    const filePath = path.join(__dirname, `../../downloads/factureOCR/zendesk - ${idTicket} - ${attachment.file_name}`);
                    await vilogiService.sendFactureToOCR(copro.idVilogi, filePath);
                }
            }
        }

       
        let updateData = {
            ticket: {
                comment: {
                    body: `Ce ticket a été transféré vers l'OCR facture `,
                    public: false
                }
            }
        };
        const { tags } = ticketData[0];
        console.log(tags);

        if (tags.includes('contrat_rapport_intervention')) {

            /////TODO : Cloturer le ticket et Faire le changement au niveau de monday ay lieu de 
            updateData.ticket.status = "solved";
            updateData.ticket.custom_fields = [
                {
                    id: 15114688584221,
                    value: "rapport_facture"
                },
                {
                    id: 25146150608413,
                    value: true
                }
            ];
        } else if (tags.includes('travaux_rapport_intervention')) {
            console.log("travaux_rapport_intervention");
        } else if (tags.includes('rapport_intervention')) {
            console.log("rapport_intervention");
        } else {
            updateData.ticket.status = "solved";
            updateData.ticket.custom_fields = [
                {
                    id: 15114688584221,
                    value: "facture_ocr"
                }
            ];
        }

        await zendeskService.updateTicket(idTicket, updateData);
        await delay(100);
    } catch (error) {
        console.log(error);
    }
}

const synchroFactureOCR = {
    start: async () => {
        console.log('Start Extraction ...');
        logs.logExecution("synchroFactureOCR");
        let counterStart = await vilogiService.countConenction();
        const LogId = await scriptService.logScriptStart('synchroFactureOCR');
        
        console.log(LogId);
        try {
            let facturesMonday = await zendeskService.getTicketsByStatus("19622552342301");
            console.log("here")
            for (const factureMonday of facturesMonday) {
                console.log(factureMonday.id);
                await manageZendeskTicketFacture(factureMonday.id);
            }

            let counterEnd = await vilogiService.countConenction();
            let VolumeCalls = counterEnd[0].nombreAppel - counterStart[0].nombreAppel;
            await scriptService.updateLogStatus('synchroFactureOCR', LogId, 0, `Script executed successfully`, VolumeCalls);

            console.log('END Extraction ...');
        } catch (error) {
            let counterEnd = await vilogiService.countConenction();
            let VolumeCalls = counterEnd[0].nombreAppel - counterStart[0].nombreAppel;
            await scriptService.updateLogStatus('synchroFactureOCR', LogId, -1, `An error occurred: ${error.message}`, VolumeCalls);
            console.error('An error occurred:', error.message);
        }
    }
};

module.exports = synchroFactureOCR;