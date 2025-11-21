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
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const { file } = require('pdfkit');
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
        response.data.pipe(fs.createWriteStream(outputFileName));

        await new Promise((resolve, reject) => {
            response.data.on('end', resolve);
            response.data.on('error', reject);
        });

        console.log('File downloaded successfully:', outputFileName);
    } catch (error) {
        console.error('Error downloading file:', error.message);
    }
};

async function addAnnotationToPdf(filePath, text) {
    const existingPdfBytes = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const pages = pdfDoc.getPages();
    const firstPage = pages[0];

    const { width, height } = firstPage.getSize();

    const fontSize = 14;
    const margin = 20;

    const textWidth = font.widthOfTextAtSize(text, fontSize);

    const x = width - textWidth - margin;
    const y = height - fontSize - margin;

    firstPage.drawText(text, {
        x,
        y,
        size: fontSize,
        font,
        color: rgb(162, 54, 101)
    });

    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(filePath, pdfBytes);
}

async function ManageFileFunction(copro, filepath, annotation) {
    console.log("Adding annotation to PDF:", filepath); 
    console.log("Annotation text:", annotation);
    console.log("Copro:", copro);

    const annotationText = ` ${annotation}`;

    try {
        await addAnnotationToPdf(filepath, annotationText);
        await delay(100);

        // Sending to Vilogi OCR
        await vilogiService.sendFactureToOCR(copro, filepath);
    } catch (error) {
        console.error("Annotation failed for file:", filepath, error.message);
        throw new Error(`Annotation failed for ${filepath}`);
    }
}

const synchroFactureOCRMonday = {
    start: async () => {
        console.log('Start Extraction ...');
        logs.logExecution("synchroFactureOCRMonday");
        let counterStart = await vilogiService.countConenction();
        const LogId = await scriptService.logScriptStart('synchroFactureOCRMonday');

        console.log(LogId);
        try {
            let data = null;
            let dataContent = null;
            let fileSaved = [];
            let coproID = null;

            let facturesMonday = await mondayService.getItemsGroup(boardId, "topics");

            for (let factureMonday of facturesMonday) {
                //console.log(factureMonday.group.id, "-", factureMonday.group.title);

                let detailFactureMonday = await mondayService.getItemsDetails(factureMonday.id);


                let coproID = null;
                let data = null;
                let dataContent = null;
                let fileSaved = [];

                for (let columns of detailFactureMonday.column_values) {
                    if (columns.id === "statut__1") {
                        console.log(columns.id, "-", columns.value);
                        data = JSON.parse(columns.value);
                        if (data == null || data.index != 106) break;
                    }

                    if (columns.id === "long_text_mksnymnt") {
                        dataContent = JSON.parse(columns.value);
                        if (dataContent == null) continue;
                        console.log(columns.id, "-", columns.value);
                    }

                    if (columns.id === "connecter_les_tableaux__1") {
                        console.log(columns.id, "-", columns.value);

                        try {
                            if (!columns.value) {
                                console.log("columns.value is null or empty, breaking...");
                                break;
                            }

                            const parsedValue = JSON.parse(columns.value);

                            if (parsedValue?.linkedPulseIds?.length > 0) {
                                coproID = await coproService.getCoprobyMondayId(
                                    parsedValue.linkedPulseIds[0].linkedPulseId
                                );
                            } else {
                                console.log("No linked pulses found, breaking...");
                                break;
                            }
                        } catch (err) {
                            console.error("Error handling columns.value:", err);
                            break;
                        }

                        console.log("CoproID", coproID);
                        if (coproID == null) break;
                    }

                    if (columns.id === "file_mkvcm99f") {
                        try {
                            const parsedValue = JSON.parse(columns.value || "null");
                            if (!parsedValue || !parsedValue.files || !Array.isArray(parsedValue.files)) {
                                continue;
                            }

                            const files = parsedValue.files;
                            for (const file of files) {
                                await mondayService.downloadFileFromMonday(
                                    file.assetId,
                                    "downloads/factureOCR/",
                                    `monday - ${factureMonday.id} - ${file.name}`
                                );

                                await delay(500);

                                fileSaved.push(`downloads/factureOCR/monday - ${factureMonday.id} - ${file.name}`);
                                await delay(500);
                            }
                        } catch (err) {
                            console.error("Error parsing columns.value:", columns.value, err);
                        }
                    }

                    console.log(coproID, dataContent?.text, fileSaved);
                    if (data != null && coproID != null && dataContent != null) {
                        let allFilesOk = true;

                        for (const filepath of fileSaved) {
                            try {
                                console.log("Processing File:", filepath);
                                await ManageFileFunction(coproID, filepath, dataContent.text);
                            } catch (err) {
                                
                                console.error("Annotation failed, skipping this Monday item:", err.message);
                                await mondayService.updateItem(boardId, factureMonday.id, {
                                "statut__1": { "index": 109 }
                                });
                                allFilesOk = false;
                                break; // Skip this item
                            }
                        }

                        if (allFilesOk) {
                            await mondayService.updateItem(boardId, factureMonday.id, {
                                "statut__1": { "index": 110 }
                            });
                        }

                        break;
                    }
                }
            }

            console.log('--------------------------------------------------------------------------------------------END Extraction ...');

            let counterEnd = await vilogiService.countConenction();
            let VolumeCalls = counterEnd[0].nombreAppel - counterStart[0].nombreAppel;
            await scriptService.updateLogStatus('synchroFactureOCRMonday', LogId, 0, `Script executed successfully`, VolumeCalls);
            console.log('END Extraction ...');
        } catch (error) {
            let counterEnd = await vilogiService.countConenction();
            let VolumeCalls = counterEnd[0].nombreAppel - counterStart[0].nombreAppel;
            await scriptService.updateLogStatus('synchroFactureOCRMonday', LogId, -1, `An error occurred: ${error.message}`, VolumeCalls);
            console.error('An error occurred:', error.message);
        }
    }
};

module.exports = synchroFactureOCRMonday;