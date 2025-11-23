const vilogiService = require('../services/vilogiService');
const coproService = require('../services/coproService');
const prestataireService = require('../services/prestataireService');
const mondayService = require('../services/mondayService');
const scriptService = require('../services/scriptService');
const logs = require('../services/logs');
const MongoDB = require('../utils/mongodb');

// Monday.com Board ID for Prestataires (you may need to create this board)
const PRESTATAIRES_BOARD_ID = process.env.MONDAY_PRESTATAIRES_BOARD_ID || 'YOUR_BOARD_ID';

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const synchroPrestataire = {
    start: async () => {
        logs.logExecution("synchroPrestataire");
        let counterStart = await vilogiService.countConenction();
        //const LogId = await scriptService.logScriptStart('synchroPrestataire');
        
        try {
            console.log('===== Starting Prestataire Synchronization =====');
            
            // Step 1: Sync from Vilogi to MongoDB and track active relationships
            const activeRelationships = await vilogiToMongodb();
            
            // Step 2: Clean up obsolete links (prestataires no longer in copros)
            await cleanupObsoleteLinks(activeRelationships);
            
            // Step 3: Mark or remove prestataires no longer in Vilogi
            await cleanupRemovedPrestataires();
            
            // Step 4: Update solde for each active prestataire
            await updatePrestataireSoldes();
            
            // Step 5: Sync to Monday.com
            //await mongodbToMonday();
            
            let counterEnd = await vilogiService.countConenction();
            let VolumeCalls = counterEnd[0].nombreAppel - counterStart[0].nombreAppel;
            
            console.log(`Total API calls: ${VolumeCalls}`);
            //await scriptService.updateLogStatus('synchroPrestataire', LogId, 0, `Script executed successfully`, VolumeCalls);
            console.log('===== Prestataire Synchronization Completed =====');
            
        } catch (error) {
            console.error("Error during prestataire synchronization:", error);
            //await scriptService.updateLogStatus('synchroPrestataire', LogId, -1, `Script executed with Error: ${error.message}`);
            throw error;
        }
    }
};

/**
 * Step 1: Fetch all prestataires from Vilogi for each copro and sync to MongoDB
 * Returns: Set of active relationship keys for cleanup tracking
 */
async function vilogiToMongodb() {
    console.log('\n--- Step 1: Syncing Prestataires from Vilogi to MongoDB ---');
    
    // Track all active relationships found in Vilogi
    const activeRelationships = new Set();
    
    try {
        // Get all active copros
        const allCopros = await coproService.listCopropriete();
        console.log(`Found ${allCopros.length} copros to process`);
        
        let totalPrestatairesProcessed = 0;
        let coproCount = 0;
        
        for (const copro of allCopros) {
            coproCount++;
            
            if (!copro.idVilogi) {
                console.log(`[${coproCount}/${allCopros.length}] Skipping ${copro.idCopro} - No Vilogi ID`);
                continue;
            }
            
            try {
                console.log(`[${coproCount}/${allCopros.length}] Processing copro: ${copro.idCopro} (${copro.Nom})`);
                
                // Fetch prestataires for this copro from Vilogi
                const prestataires = await vilogiService.getPrestataires(copro.idVilogi);
                
                if (!prestataires || prestataires.length === 0) {
                    console.log(`  → No prestataires found for ${copro.idCopro}`);
                    await delay(200);
                    continue;
                }
                
                console.log(`  → Found ${prestataires.length} prestataires`);
                
                // Process each prestataire
                for (const prestataire of prestataires) {
                    try {
                        // Map Vilogi data to our schema
                        const prestataireData = {
                            idCompte: prestataire.idCompte || 0,
                            societe: prestataire.societe || '',
                            adresse: prestataire.adresse || '',
                            complement: prestataire.complement || '',
                            ville: prestataire.ville || '',
                            codepostal: prestataire.codepostal || '',
                            telephone: prestataire.telephone || '',
                            fax: prestataire.fax || '',
                            email: prestataire.email || '',
                            web: prestataire.web || '',
                            siren: prestataire.siren || '',
                            rcs: prestataire.rcs || '',
                            iban: prestataire.iban || '',
                            bic: prestataire.bic || '',
                            virement: prestataire.virement || 0,
                            solde: 0 // Will be updated in next step
                        };
                        
                        // Upsert prestataire
                        const savedPrestataire = await prestataireService.upsertPrestataire(prestataireData);
                        
                        // Track this active relationship
                        const relationshipKey = `${savedPrestataire._id.toString()}_${copro._id.toString()}`;
                        activeRelationships.add(relationshipKey);
                        
                        // Link prestataire to copro (if not already linked)
                        try {
                            await prestataireService.linkPrestataireToCopro(
                                savedPrestataire._id,
                                copro._id,
                                {
                                    typePrestation: prestataire.typePrestation || null,
                                    notes: `Synced from Vilogi on ${new Date().toISOString()}`
                                }
                            );
                            console.log(`    ✓ Linked prestataire ${prestataire.societe} (ID: ${prestataire.idCompte}) to copro ${copro.idCopro}`);
                        } catch (linkError) {
                            // Link might already exist (duplicate key error)
                            if (linkError.code !== 11000) {
                                console.log(`    ⚠ Warning linking prestataire: ${linkError.message}`);
                            }
                        }
                        
                        totalPrestatairesProcessed++;
                        
                    } catch (prestataireError) {
                        console.error(`    ✗ Error processing prestataire ${prestataire.societe}:`, prestataireError.message);
                    }
                }
                
                // Delay between copros to avoid rate limiting
                await delay(300);
                
            } catch (coproError) {
                console.error(`  ✗ Error processing copro ${copro.idCopro}:`, coproError.message);
                await delay(500);
            }
        }
        
        console.log(`\n✓ Step 1 Complete: Processed ${totalPrestatairesProcessed} prestataires across ${allCopros.length} copros`);
        console.log(`  → Tracked ${activeRelationships.size} active relationships`);
        
        return activeRelationships;
        
    } catch (error) {
        console.error('Error in vilogiToMongodb:', error);
        throw error;
    }
}

/**
 * Step 2: Clean up obsolete links (prestataires no longer linked to copros in Vilogi)
 */
async function cleanupObsoleteLinks(activeRelationships) {
    console.log('\n--- Step 2: Cleaning Up Obsolete Prestataire-Copro Links ---');
    
    try {
        await MongoDB.connectToDatabase();
        const prestataireCoproCollection = MongoDB.getCollection('prestatairecopros');
        
        // Get all existing relationships from database
        const allLinks = await prestataireCoproCollection.find({}).toArray();
        console.log(`Found ${allLinks.length} existing links in database`);
        
        let removedCount = 0;
        
        for (const link of allLinks) {
            const relationshipKey = `${link.prestataireId.toString()}_${link.coproprieteId.toString()}`;
            
            // If this relationship is not in the active set, it should be removed
            if (!activeRelationships.has(relationshipKey)) {
                try {
                    await prestataireCoproCollection.deleteOne({ _id: link._id });
                    console.log(`  ✗ Removed obsolete link: Prestataire ${link.prestataireId} - Copro ${link.coproprieteId}`);
                    removedCount++;
                } catch (deleteError) {
                    console.error(`  ⚠ Error removing link:`, deleteError.message);
                }
            }
        }
        
        console.log(`\n✓ Step 2 Complete: Removed ${removedCount} obsolete links`);
        
    } catch (error) {
        console.error('Error in cleanupObsoleteLinks:', error);
        throw error;
    }
}

/**
 * Step 3: Clean up prestataires that are no longer in any Vilogi copro
 * Configuration: Set PRESTATAIRE_HARD_DELETE=true for permanent deletion, false for soft delete
 */
async function cleanupRemovedPrestataires() {
    console.log('\n--- Step 3: Cleaning Up Removed Prestataires ---');
    
    // Configuration: hard delete (true) or soft delete (false)
    const HARD_DELETE = process.env.PRESTATAIRE_HARD_DELETE === 'true' || false;
    console.log(`  Delete mode: ${HARD_DELETE ? 'Hard Delete (permanent)' : 'Soft Delete (mark as inactive)'}`);
    
    try {
        await MongoDB.connectToDatabase();
        const prestataireCollection = MongoDB.getCollection('prestataires');
        const prestataireCoproCollection = MongoDB.getCollection('prestatairecopros');
        
        // Get all active prestataires (or all if hard delete mode)
        const filter = HARD_DELETE ? {} : { status: { $ne: 'Inactive' } };
        const allPrestataires = await prestataireCollection.find(filter).toArray();
        console.log(`Found ${allPrestataires.length} prestataires to check`);
        
        let removedCount = 0;
        let inactivatedCount = 0;
        
        for (const prestataire of allPrestataires) {
            try {
                // Check if this prestataire has any links
                const linkCount = await prestataireCoproCollection.countDocuments({
                    prestataireId: prestataire._id
                });
                
                if (linkCount === 0) {
                    // Prestataire is orphaned (no links to any copro)
                    // This means it was removed from all copros in Vilogi
                    
                    if (HARD_DELETE) {
                        // Option 1: Delete the prestataire completely
                        await prestataireCollection.deleteOne({ _id: prestataire._id });
                        console.log(`  ✗ DELETED: ${prestataire.societe} (idCompte: ${prestataire.idCompte})`);
                        removedCount++;
                    } else {
                        // Option 2: Mark as inactive (soft delete)
                        await prestataireCollection.updateOne(
                            { _id: prestataire._id },
                            { 
                                $set: { 
                                    status: 'Inactive', 
                                    dateRemoval: new Date(),
                                    dateModification: new Date()
                                } 
                            }
                        );
                        console.log(`  ⚠ INACTIVATED: ${prestataire.societe} (idCompte: ${prestataire.idCompte})`);
                        inactivatedCount++;
                    }
                }
            } catch (checkError) {
                console.error(`  ⚠ Error checking prestataire ${prestataire.societe}:`, checkError.message);
            }
        }
        
        if (HARD_DELETE) {
            console.log(`\n✓ Step 3 Complete: Permanently deleted ${removedCount} orphaned prestataires`);
        } else {
            console.log(`\n✓ Step 3 Complete: Marked ${inactivatedCount} prestataires as inactive`);
        }
        
    } catch (error) {
        console.error('Error in cleanupRemovedPrestataires:', error);
        throw error;
    }
}

/**
 * Step 4: Update solde for each prestataire by calling Vilogi API
 */
async function updatePrestataireSoldes() {
    console.log('\n--- Step 4: Updating Prestataire Soldes from Vilogi ---');
    
    try {
        // Get all prestataires from MongoDB
        const allPrestataires = await prestataireService.listPrestataires();
        console.log(`Found ${allPrestataires.length} prestataires to update`);
        
        let updatedCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < allPrestataires.length; i++) {
            const prestataire = allPrestataires[i];
            
            try {
                console.log(`[${i + 1}/${allPrestataires.length}] Updating solde for: ${prestataire.societe} (idCompte: ${prestataire.idCompte})`);
                
                // Get all copros linked to this prestataire
                const linkedCopros = await prestataireService.getCoprosForPrestataire(prestataire._id);
                
                if (!linkedCopros || linkedCopros.length === 0) {
                    console.log(`  → No linked copros found, skipping solde update`);
                    continue;
                }
                
                // Use the first linked copro to fetch solde (or aggregate if needed)
                const firstCopro = linkedCopros[0];
                
                if (!firstCopro.idVilogi) {
                    console.log(`  → Copro ${firstCopro.idCopro} has no Vilogi ID, skipping`);
                    continue;
                }
                
                // Get current date for solde calculation
                const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
                
                // Call Vilogi API to get solde
                // The compte parameter should be the prestataire's account number (idCompte)
                const soldeData = await vilogiService.getbudgetComptebyDate(
                    firstCopro.idVilogi,
                    prestataire.idCompte.toString(),
                    currentDate
                );
                
                let solde = 0;
                if (soldeData && soldeData.solde !== undefined) {
                    solde = parseFloat(soldeData.solde) || 0;
                } else if (soldeData && soldeData.balance !== undefined) {
                    solde = parseFloat(soldeData.balance) || 0;
                } else if (Array.isArray(soldeData) && soldeData.length > 0) {
                    solde = parseFloat(soldeData[0].solde || soldeData[0].balance || 0);
                }
                
                console.log(`  → Solde retrieved: ${solde}€`);
                
                // Update prestataire with new solde
                await prestataireService.editPrestataire(prestataire._id, { solde });
                
                updatedCount++;
                
                // Delay to avoid rate limiting
                await delay(400);
                
            } catch (soldeError) {
                errorCount++;
                console.error(`  ✗ Error updating solde for ${prestataire.societe}:`, soldeError.message);
                await delay(500);
            }
        }
        
        console.log(`\n✓ Step 4 Complete: Updated ${updatedCount} prestataires, ${errorCount} errors`);
        
    } catch (error) {
        console.error('Error in updatePrestataireSoldes:', error);
        throw error;
    }
}

/**
 * Step 5: Sync prestataires from MongoDB to Monday.com
 */
async function mongodbToMonday() {
    console.log('\n--- Step 5: Syncing Prestataires to Monday.com ---');
    
    try {
        // Check if board ID is configured
        if (!PRESTATAIRES_BOARD_ID || PRESTATAIRES_BOARD_ID === 'YOUR_BOARD_ID') {
            console.log('⚠ Monday.com Board ID not configured. Skipping Monday sync.');
            console.log('Please set MONDAY_PRESTATAIRES_BOARD_ID in your .env file');
            return;
        }
        
        // Get all prestataires from MongoDB
        const allPrestataires = await prestataireService.listPrestataires();
        console.log(`Found ${allPrestataires.length} prestataires to sync to Monday`);
        
        let createdCount = 0;
        let updatedCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < allPrestataires.length; i++) {
            const prestataire = allPrestataires[i];
            
            try {
                console.log(`[${i + 1}/${allPrestataires.length}] Processing: ${prestataire.societe}`);
                
                // Check if item already exists in Monday
                const existingItem = await mondayService.getItemInBoardWhereName(
                    prestataire.societe,
                    PRESTATAIRES_BOARD_ID
                );
                
                // Prepare column values for Monday
                const columnValues = {
                    text: prestataire.societe || '',
                    text0: prestataire.idCompte?.toString() || '',
                    text1: prestataire.adresse || '',
                    text2: prestataire.ville || '',
                    text3: prestataire.codepostal || '',
                    text4: prestataire.telephone || '',
                    text5: prestataire.email || '',
                    text6: prestataire.siren || '',
                    text7: prestataire.iban || '',
                    numbers: prestataire.solde || 0
                    // Map other fields as needed based on your Monday board columns
                };
                
                if (existingItem) {
                    // Update existing item
                    await mondayService.updateItemData(
                        PRESTATAIRES_BOARD_ID,
                        existingItem.id,
                        columnValues
                    );
                    console.log(`  ✓ Updated in Monday: ${prestataire.societe}`);
                    updatedCount++;
                } else {
                    // Create new item
                    await mondayService.createItem(
                        PRESTATAIRES_BOARD_ID,
                        prestataire.societe,
                        columnValues
                    );
                    console.log(`  ✓ Created in Monday: ${prestataire.societe}`);
                    createdCount++;
                }
                
                await delay(300);
                
            } catch (mondayError) {
                errorCount++;
                console.error(`  ✗ Error syncing ${prestataire.societe} to Monday:`, mondayError.message);
                await delay(500);
            }
        }
        
        console.log(`\n✓ Step 5 Complete: Created ${createdCount}, Updated ${updatedCount}, Errors ${errorCount}`);
        
    } catch (error) {
        console.error('Error in mongodbToMonday:', error);
        throw error;
    }
}

module.exports = synchroPrestataire;
