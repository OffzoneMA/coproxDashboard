const vilogiService = require('../services/vilogiService');
const json2csv = require('json2csv').parse;
const coproService = require('../services/coproService');
const ZendeskService = require('../services/zendeskService');
const zendeskTicket = require('./zendeskTicket');
const logs = require('../services/logs');
const fs = require('fs');


function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
let FinalContrat = [];

const extractContratsEntretien = {
    start: async () => {
        console.log('Start Extraction ...');
        logs.logExecution("extractContratsEntretien")
        try {
            let copros = await coproService.listCopropriete();
            let FinalContrat = [];  // Initialize FinalContrat array

            for (const copro of copros) {
                console.log("ID Vilogi:", copro.idCopro);
                if (copro.idVilogi !== undefined) {
                    let contrats = await vilogiService.getCoproContratEntretien(copro.idVilogi);
                    //console.log(contrats);
                    for (const contrat of contrats) {
                        // Define a regular expression pattern to match the desired format
                        const regex = /^(\d+)-(.*)$/;
                        
                        // Check if the variable contrat.fournisseur matches the pattern
                        const match = contrat.fournisseur.match(regex);
                        let infoFournisseur = {};
                    
                        if (match) {
                            // Extract the numbers from the match
                            const fournisseurID = match[1];
                            infoFournisseur = await vilogiService.getPrestataireById(fournisseurID, copro.idVilogi);
                            //console.log(`${copro.idCopro} - ${match[1]} - ${match[2]}` )
                            //console.log(infoFournisseur)
                            await delay(200)
                        } else {
                            //console.log("Invalid format for contrat.fournisseur");
                        }
                        if (infoFournisseur === undefined){
                            console.log("Break");
                            break;
                        }else{

                        }
                                       
                        const selectedData = {
                            copro: copro.idCopro,
                            fournisseur: contrat.fournisseur,
                            societe: infoFournisseur.societe || "",
                            typecontrat: contrat.typecontrat,
                            description: contrat.description,
                            dateeffet: contrat.dateeffet,
                            dateecheance: contrat.dateecheance,
                            datefin: contrat.datefin,
                            adresse: infoFournisseur.adresse || "",
                            complement: infoFournisseur.complement || "",
                            ville: infoFournisseur.ville || "",
                            codepostal: infoFournisseur.codepostal || "",
                            telephone: infoFournisseur.telephone || "",
                            secteur: infoFournisseur.secteur || "",
                            file: contrat.idFichier
                            // Add other properties as needed
                        };
                    
                        FinalContrat.push(selectedData);
                    
                        if (contrat.idFichier) {
                            // await saveFileLocally(apiResponse, localFilePath, contrat)
                        }
                    }
                    
                }
            }

            // Now, FinalContrat array contains selected data from contrat
            console.log('FinalContrat:', FinalContrat);

            // Write FinalContrat array to a JSON file
            fs.writeFileSync('finalContrat.json', JSON.stringify(FinalContrat, null, 2));
            console.log('FinalContrat written to finalContrat.json');
            const fields = ['copro','typecontrat','file','societe','description','dateeffet','datefin','dateecheance','fournisseur','adresse','complement','ville','codepostal','telephone'];
            const csv = json2csv(FinalContrat, { fields });
            fs.writeFile('contratEntretien.csv', csv, function(err) {
                if (err) throw err;
                console.log('CSV file saved as output.csv');
            });
            console.log('--------------------------------------------------------------------------------------------END Extraction ...');
        } catch (error) {
            console.error('An error occurred:', error.message);
        }
    }
};



async function saveFileLocally(apiResponse, localFilePath) {
    try {
    if (contrat.datefin){
            let outputFileName = `downloads/contrats/nonactif/${copro.idCopro}-Contrat -${contrat.fournisseur} - ${contrat.fournisseur}.pdf`;
            const apiResponse = await vilogiService.getCoproContratEntretienFichier(contrat.idFichier, copro.idVilogi,outputFileName);
        }else{
            let outputFileName = `downloads/contrats/actif/${copro.idCopro}-Contrat -${contrat.fournisseur} - ${contrat.fournisseur}.pdf`;
            const apiResponse = await vilogiService.getCoproContratEntretienFichier(contrat.idFichier, copro.idVilogi,outputFileName);
        }

        await delay(1000)
        } catch (error) {
        console.error('Error getting file from API:', error);
        }
  }


//extraction des contrat par copro

module.exports = extractContratsEntretien;
