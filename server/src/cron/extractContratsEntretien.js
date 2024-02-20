const vilogiService = require('../services/vilogiService');
const coproService = require('../services/coproService');
const ZendeskService = require('../services/zendeskService');
const zendeskTicket = require('./zendeskTicket');
const fs = require('fs');


function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
let FinalContrat = [];

const extractContratsEntretien = {
    start: async () => {
        console.log('Start Extraction ...');
        try {
            let copros = await coproService.listCopropriete();
            let FinalContrat = [];  // Initialize FinalContrat array

            for (const copro of copros) {
                console.log("ID Vilogi:", copro.idCopro);
                if (copro.idVilogi !== undefined) {
                    let contrats = await vilogiService.getCoproContratEntretien(copro.idVilogi);
                    //console.log(contrats);
                    for (const contrat of contrats) {
                        // Select specific data from contrat and push it into FinalContrat array
                        const selectedData = {
                            copro: copro.idCopro,
                            fournisseur:contrat.fournisseur,
                            typecontrat: contrat.typecontrat,
                            dateeffet: contrat.dateeffet,
                            dateecheance: contrat.dateecheance,
                            datefin: contrat.datefin,
                            file: contrat.idFichier
                            // Add other properties as needed
                        };
                        FinalContrat.push(selectedData);
                        if(contrat.idFichier){
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
                        
                    }
                }
            }

            // Now, FinalContrat array contains selected data from contrat
            //console.log('FinalContrat:', FinalContrat);

            // Write FinalContrat array to a JSON file
            //fs.writeFileSync('finalContrat.json', JSON.stringify(FinalContrat, null, 2));
            //console.log('FinalContrat written to finalContrat.json');

            console.log('--------------------------------------------------------------------------------------------END Extraction ...');
        } catch (error) {
            console.error('An error occurred:', error.message);
        }
    }
};

async function saveFileLocally(apiResponse, localFilePath) {
    try {
      // Assuming apiResponse is a readable stream
      const fileStream = fs.createWriteStream(localFilePath);
      apiResponse.data(fileStream);
  
      // Wait for the file to finish writing
      await new Promise((resolve, reject) => {
        fileStream.on('finish', resolve);
        fileStream.on('error', reject);
      });
  
      console.log(`File downloaded and saved to ${localFilePath}`);
    } catch (error) {
      console.error('Error saving file locally:', error.message);
    }
  }


//extraction des contrat par copro

module.exports = extractContratsEntretien;
