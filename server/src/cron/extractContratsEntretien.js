const vilogiService = require('../services/vilogiService');
const json2csv = require('json2csv').parse;
const coproService = require('../services/coproService');
const dropboxService = require('../services/dropboxService');
const ZendeskService = require('../services/zendeskService');
const scriptService = require('../services/scriptService');
const zendeskTicket = require('./zendeskTicket');
const logs = require('../services/logs');
const fs = require('fs');


function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
let FinalContrat = [];
let countNbContrat = 0
const extractContratsEntretien = {
    start: async () => {
        console.log('Start Extraction ...');
        const LogId = await scriptService.logScriptStart('extractContratsEntretien');
        logs.logExecution("extractContratsEntretien")
        let countContratWithFile=0;
        try {
            let copros = await coproService.listCopropriete();
            let FinalContrat = [];  // Initialize FinalContrat array
            let counterStart =await vilogiService.countConenction();

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
                            idVilogi:copro.idVilogi,
                            fournisseur: contrat.fournisseur,
                            societe: infoFournisseur.societe || "",
                            typecontrat: contrat.typecontrat.replace("/", ""),
                            description: contrat.description,
                            dateeffet: contrat.dateeffet,
                            dateecheance: contrat.dateecheance,
                            datefin: contrat.datefin,
                            adresse: infoFournisseur.adresse || "",
                            complement: infoFournisseur.complement || "",
                            ville: infoFournisseur.ville || "",
                            codepostal: infoFournisseur.codepostal || "",
                            email:infoFournisseur.email || "",
                            telephone: infoFournisseur.telephone || "",
                            secteur: infoFournisseur.secteur || "",
                            file: contrat.idFichier
                            // Add other properties as needed
                        };
                        
                        console.log("Contrat Numero : " ,countNbContrat)
                        FinalContrat.push(selectedData);
                        console.log(contrat.idFichier)
                        if (contrat.idFichier) {
                            countNbContrat++
                            let statut = "Inactif";
                            //console.log(selectedData.datefin)
                            if (selectedData.datefin !== null && selectedData.datefin !== '') {
                                statut = "Actif";
                            }
                            countContratWithFile++;
                            const directory =`downloads/contrats/`
                            const filename=`${countNbContrat}-${copro.idCopro}-Contrat-${statut}-${contrat.typecontrat.replace("/", "_")}-${infoFournisseur.societe}-${contrat.id}.pdf`
                            await saveFileLocally(selectedData, directory+filename)

                            //await delay(500);
                            //await saveFile(attachment.content_url,ticket.id,attachment.file_name)
                            await saveFileToDropbox(directory,filename,`${copro.idCopro}`)
                        }
                    }
                    
                }
            }
            console.log(countContratWithFile)
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
            await scriptService.updateLogStatus('extractContratsEntretien',LogId ,0 ,"Script executed successfully");
            console.log('--------------------------------------------------------------------------------------------END Extraction ...');
        } catch (error) {
            let counterEnd =await vilogiService.countConenction();
                                                
            let VolumeCalls = counterEnd[0].nombreAppel - counterStart[0].nombreAppel           
            await scriptService.updateLogStatus('extractContratsEntretien',LogId ,-1,`An error occurred: ${error.message} `, VolumeCalls );
            console.error('An error occurred:', error.message);
        }
    }
};



async function saveFileLocally(apiResponse, localFilePath) {
    try {
    if (true){
            const response = await vilogiService.getCoproContratEntretienFichier(apiResponse.file, apiResponse.idVilogi,localFilePath);
            //console.log(response)
        }/*else{
            let outputFileName = `downloads/contrats/actif/${copro.idCopro}-Contrat -${contrat.fournisseur} - ${contrat.fournisseur}.pdf`;
            const apiResponse = await vilogiService.getCoproContratEntretienFichier(contrat.idFichier, copro.idVilogi,outputFileName);
        }*/

        await delay(1000)
        } catch (error) {
        console.error('Error getting file from API:', error);
        }
  }

  
  const saveFileToDropbox = async (filePath,filename,coproID) => {
    try {
        const buffer = await fs.promises.readFile(filePath+filename);
        
        const req = {
            filename: filename,
            buffer: buffer,
            foldername:`TCP-CONTRAT-COPRO-VILOGI`
            
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

module.exports = extractContratsEntretien;
