// src/cron/synchroUsers.js

// Import required services and controllers
const vilogiService = require('../services/vilogiService');
const coproService = require('../services/coproService');
const PersonService = require('../services/personService');

const scriptService = require('../services/scriptService');
const ZendeskService = require('../services/zendeskService');
const mongoose = require('mongoose');
const personModel = require('../models/person');
const logs = require('../services/logs');
const fs = require('fs');
const path = require('path');

// Ensure logs are written to /tmp on Vercel
const LOG_DIR = process.env.LOG_DIR || '/tmp';

// Define log file paths
const logFilePath = path.join(LOG_DIR, 'cron.log');
const logFilePath2 = path.join(LOG_DIR, 'stats.log');

// Generic logging function
function writeLog(filePath, ...args) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} ${args.join(' ')}\n`;

  fs.appendFile(filePath, logMessage, (err) => {
    if (err) console.error(`Error writing to ${filePath}:`, err);
  });

  process.stdout.write(logMessage);
}

// Logging helpers
function FileLog(...args) { writeLog(logFilePath, ...args); }
function FileStatLog(...args) { writeLog(logFilePath2, ...args); }

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Object for synchronizing users
const synchroUsers = {
  start: async () => {
    let LogId;            // <-- make visible in catch
    let counterStart;     // <-- make visible in catch

    try {
      logs.logExecution("synchroUsers");
      LogId = await scriptService.logScriptStart('synchroUsers');

      console.log('🔄 ========== Starting User Synchronization ==========');
      // Start counter
      counterStart = await vilogiService.countConenction();

      // Fetch all copros (active ones)
      const copros = await coproService.listCopropriete();
      console.log(`📊 Found ${copros.length} active copros to process`);

      // Iterate copros
      for (const copro of copros) {
        if (copro.idVilogi) {
          console.log(`\n🏢 Processing copro: [${copro.idCopro}] ${copro.Nom} (${copro.status})`);
          await getAllUsersAndManageThem(copro.idVilogi, copro);
          await fixUserRole(copro.idVilogi, copro);
        } else {
          console.log(`⚠️ Copro ${copro._id} - ${copro.Nom} has no Vilogi ID - skipping`);
          FileLog('| SyncUsers | start | Copro without Vilogi ID:', copro._id, '-', copro.Nom);
        }
      }

      // Validate and cleanup orphaned users or users with inactive copros
      console.log('\n🧹 Running cleanup and validation...');
      await validateAndCleanupOrphanedUsers();

      // Sync to Zendesk
      console.log('\n🎫 Syncing to Zendesk...');
      await SynchoZendesk();

      const counterEnd = await vilogiService.countConenction();
      const VolumeCalls = counterEnd[0].nombreAppel - counterStart[0].nombreAppel;

      await scriptService.updateLogStatus('synchroUsers', LogId, 0, `Script executed successfully`, VolumeCalls);
      console.log('\n✅ ========== User Synchronization Complete ==========');
      FileStatLog(`| SyncUsers | Completed | API Calls: ${VolumeCalls}`);

    } catch (error) {
      console.error('❌ An error occurred:', error.message);
      FileLog('| SyncUsers | start | Fatal error:', error.message);

      try {
        const counterEnd = await vilogiService.countConenction();
        const VolumeCalls = counterEnd[0].nombreAppel - (counterStart?.[0]?.nombreAppel ?? 0);
        if (LogId) {
          await scriptService.updateLogStatus('synchroUsers', LogId, -1, `An error occurred: ${error.message}`, VolumeCalls);
        }
      } catch (inner) {
        console.error('Failed to update script status after error:', inner?.message || inner);
      }
    }
  },
};

async function getAllUsersAndManageThem(idVilogi, Copro) {
  const users = await vilogiService.getAllAdherents(idVilogi);
  let i = 0;
  FileStatLog("Charging from Copro : [", Copro.idCopro, "]" + ` Users From Vilogi To MongoDB : [${(users?.length ?? 0) + 1}] -------- ${Copro.Nom},`);

  // Check if copro is active
  const isCoproActive = Copro.status === 'Actif';
  
  if (!isCoproActive) {
    console.log(`⚠️ Copro [${Copro.idCopro}] is INACTIVE - users will be marked as inactive`);
    FileLog('| SyncUsers | getAllUsersAndManageThem | Copro is inactive:', Copro.idCopro, ' - ', Copro.Nom);
  }

  if (users && users.length > 0) {
    for (const user of users) {
      if (user && user.email) {
        i++;
        console.log("Charging from Copro : [", Copro.idCopro, " - ", Copro.Nom, "]" + ` Users From Vilogi To MongoDB : [${i}/${users.length + 1}]`);

        const idcoproVar = new mongoose.Types.ObjectId(Copro._id);

        // Determine active status: both user AND copro must be active
        const isUserActiveInVilogi = user.active === 1 || user.active === true;
        const finalActiveStatus = isUserActiveInVilogi && isCoproActive;

        if (!finalActiveStatus) {
          const reason = !isCoproActive ? 'copro inactive' : 'user inactive in Vilogi';
          console.log(`⚠️ User ${user.email} will be marked INACTIVE (${reason})`);
        }

        const userData = {
          idCopro: idcoproVar,
          email: user.email,
          idVilogi: user.id,
          idCompteVilogi: user.compte,
          nom: user.nom,
          prenom: user.prenom,
          telephone: formatPhoneNumber(user.telephone),
          telephone2: formatPhoneNumber(user.telephone2),
          mobile: formatPhoneNumber(user.mobile),
          mobile2: formatPhoneNumber(user.mobile2),
          typePersonne: user.typePersonne,
          active: finalActiveStatus,
          lastSyncDate: new Date(),
          url: `https://copro.vilogi.com/AfficheProprietaire.do?operation=change&copropriete=${idVilogi}&id=${user.id}`,
        };

        await SynchoMongoDB(userData, Copro);

      } else {
        FileLog('| SyncUsers | getAllUsersAndManageThem | User with email :', user?.email, ' ---  email missing.');
      }
    }
  }
}

function formatPhoneNumber(phoneNumber) {
  if (!phoneNumber || phoneNumber.trim() === '') return "";

  let cleanedNumber = phoneNumber.trim().replace(/(?!^\+)[^0-9]/g, '');
  if (!cleanedNumber || (!cleanedNumber.startsWith('0') && !cleanedNumber.startsWith('+'))) {
    return "";
  }
  if (cleanedNumber.startsWith('0')) {
    cleanedNumber = '+33' + cleanedNumber.slice(1);
  }
  return cleanedNumber;
}

async function SynchoMongoDB(userData, Copro) {
  try {
    const result = await PersonService.getPersonsByInfo('email', userData.email);
    const val = result.length;

    if (val === 1) {
      const existingUser = result[0];
      
      // ✅ VALIDATE AND REFRESH COPRO ID
      // Check if copro ID has changed or needs validation
      const currentCoproId = existingUser.idCopro?.toString();
      const newCoproId = userData.idCopro?.toString();
      
      if (currentCoproId !== newCoproId) {
        console.log(`🔄 Copro ID mismatch for user ${userData.email}`);
        console.log(`   Old: ${currentCoproId} -> New: ${newCoproId}`);
        FileLog('| SyncUsers | SynchoMongoDB | Copro ID updated for user:', userData.email, 
                `from ${currentCoproId} to ${newCoproId}`);
      }
      
      // ✅ VERIFY COPRO EXISTS
      try {
        const coproExists = await coproService.detailsCopropriete(newCoproId);
        if (!coproExists) {
          console.error(`❌ Copro ${newCoproId} does not exist for user ${userData.email}`);
          FileLog('| SyncUsers | SynchoMongoDB | Copro not found:', newCoproId, 'for user:', userData.email);
          // Don't update if copro doesn't exist
          return;
        }
        
        // ✅ CHECK IF COPRO IS INACTIVE - mark user as inactive
        if (coproExists.status !== 'Actif') {
          console.log(`⚠️ Copro ${coproExists.idCopro} is inactive - marking user ${userData.email} as inactive`);
          userData.active = false;
        }
      } catch (error) {
        console.error(`Error validating copro for user ${userData.email}:`, error);
        FileLog('| SyncUsers | SynchoMongoDB | Error validating copro:', error.message);
      }
      
      // Convert boolean active status (handle legacy numeric values)
      if (typeof userData.active === 'number') {
        userData.active = userData.active === 1;
      }
      
      // Update user with refreshed data
      const newDataDocument = new personModel(userData);
      const newDataObject = newDataDocument.toObject({ transform: true });
      delete newDataObject._id;
      newDataObject.updatedAt = new Date();
      
      await PersonService.editPerson(existingUser._id, newDataObject);
      console.log(`✅ Updated user: ${userData.email} (active: ${userData.active})`);
      
    } else if (val === 0) {
      // ✅ VERIFY COPRO EXISTS BEFORE ADDING NEW USER
      try {
        const coproExists = await coproService.detailsCopropriete(userData.idCopro.toString());
        if (!coproExists) {
          console.error(`❌ Cannot add user ${userData.email} - Copro ${userData.idCopro} does not exist`);
          FileLog('| SyncUsers | SynchoMongoDB | Cannot add user - copro not found:', 
                  userData.idCopro, 'for user:', userData.email);
          return;
        }
        
        // Check if copro is inactive
        if (coproExists.status !== 'Actif') {
          console.log(`⚠️ Adding user ${userData.email} to inactive copro - marking as inactive`);
          userData.active = false;
        }
      } catch (error) {
        console.error(`Error validating copro for new user ${userData.email}:`, error);
        FileLog('| SyncUsers | SynchoMongoDB | Error validating copro for new user:', error.message);
        return;
      }
      
      // Convert boolean active status
      if (typeof userData.active === 'number') {
        userData.active = userData.active === 1;
      }
      
      userData.createdAt = new Date();
      userData.updatedAt = new Date();
      
      await PersonService.addPerson(userData);
      console.log(`✅ Added new user: ${userData.email} (active: ${userData.active})`);
      
    } else if (val > 1) {
      console.error(`❌ Duplicate users found for email: ${userData.email} (${val} records)`);
      FileLog('| SyncUsers | SynchoMongoDB | User with email :', userData.email, ` --- ${val} duplicate users found.`);
      
      // TODO: Could implement deduplication logic here
      // For now, just log the issue
    }

  } catch (error) {
    console.error('Error in SynchoMongoDB:', error);
    FileLog('| SyncUsers | SynchoMongoDB | Error:', error.message, 'for user:', userData.email);
  }
}

async function fixUserRole(coproId, Copro) {
  let i = 0;
  const usersData = await vilogiService.getCoproData(coproId);
  const users = usersData.listConseilSyndical;

  // Check if copro is active
  const isCoproActive = Copro.status === 'Actif';

  if (users && users.length > 0) {
    for (const user of users) {
      i++;
      await delay(200);
      console.log("Charging from Copro : [", Copro.idCopro, " - ", Copro.Nom, "]" + ` fixing roles in MongoDB: [${i}/${users.length + 1}]`);

      if (user && user.idCoproprietaire) {
        const result = await PersonService.getPersonsByInfo("idVilogi", user.idCoproprietaire);
        const val = result.length;

        if (val === 1) {
          // Update only the role and updatedAt, keep other fields intact
          const updateData = { 
            typePersonne: "CS",
            updatedAt: new Date()
          };
          const newDataDocument = new personModel(updateData);
          const newDataObject = newDataDocument.toObject({ transform: true });
          delete newDataObject._id;
          await PersonService.editPerson(result[0]._id, newDataObject);
          console.log(`✅ Updated role to CS for user idVilogi: ${user.idCoproprietaire}`);
          
        } else {
          try {
            const userCS = await vilogiService.getAdherent(Copro.idVilogi, user.idCoproprietaire);
            await delay(200);
            if (userCS && userCS.email) {
              const idcoproVar = new mongoose.Types.ObjectId(Copro._id);

              // Determine active status
              const isUserActiveInVilogi = userCS.active === 1 || userCS.active === true;
              const finalActiveStatus = isUserActiveInVilogi && isCoproActive;

              if (!finalActiveStatus) {
                const reason = !isCoproActive ? 'copro inactive' : 'user inactive in Vilogi';
                console.log(`⚠️ CS User ${userCS.email} will be marked INACTIVE (${reason})`);
              }

              const userData = {
                idCopro: idcoproVar,
                email: userCS.email,
                idVilogi: userCS.id,
                idCompteVilogi: userCS.compte,
                nom: userCS.nom,
                prenom: userCS.prenom,
                telephone: formatPhoneNumber(userCS.telephone),
                telephone2: formatPhoneNumber(userCS.telephone2),
                mobile: formatPhoneNumber(userCS.mobile),
                mobile2: formatPhoneNumber(userCS.mobile2),
                typePersonne: "CS",
                active: finalActiveStatus,
                lastSyncDate: new Date(),
                url: `https://copro.vilogi.com/AfficheProprietaire.do?operation=change&copropriete=${user.idCoproprietaire}&id=${userCS.id}`
              };

              await SynchoMongoDB(userData, Copro);
            }
          } catch (error) {
            console.error('Error in fixUserRole:', error);
            FileLog('| SyncUsers | fixUserRole | User with IdVilogi :', user.idCoproprietaire, '  --- not found for a user.', error.message);
          }
        }
      }
    }
  }
}

async function validateAndCleanupOrphanedUsers() {
  console.log('🔍 Validating and cleaning up orphaned users...');
  
  try {
    const allUsers = await PersonService.getAllPersons();
    const activeCopros = await coproService.listCopropriete();
    const activeCoproIds = new Set(activeCopros.map(c => c._id.toString()));
    
    let deactivatedCount = 0;
    let orphanedCount = 0;
    
    for (const user of allUsers) {
      if (!user.idCopro) {
        console.log(`⚠️ User ${user.email} has no copro ID - skipping`);
        continue;
      }
      
      const userCoproId = user.idCopro.toString();
      
      // Check if copro exists
      const coproExists = await coproService.detailsCopropriete(userCoproId);
      
      if (!coproExists) {
        // Copro doesn't exist - mark user as inactive
        console.log(`❌ Copro ${userCoproId} doesn't exist for user ${user.email} - marking inactive`);
        FileLog('| SyncUsers | validateAndCleanupOrphanedUsers | Orphaned user:', user.email, 'copro:', userCoproId);
        
        await PersonService.editPerson(user._id, { 
          active: false, 
          updatedAt: new Date() 
        });
        orphanedCount++;
        
      } else if (coproExists.status !== 'Actif' && user.active) {
        // Copro is inactive but user is still active - deactivate user
        console.log(`⚠️ Copro ${coproExists.idCopro} is inactive - deactivating user ${user.email}`);
        FileLog('| SyncUsers | validateAndCleanupOrphanedUsers | Deactivating user:', user.email, 
                'due to inactive copro:', coproExists.idCopro);
        
        await PersonService.editPerson(user._id, { 
          active: false, 
          updatedAt: new Date() 
        });
        deactivatedCount++;
      }
    }
    
    console.log(`✅ Cleanup complete: ${orphanedCount} orphaned users, ${deactivatedCount} users deactivated due to inactive copro`);
    FileStatLog(`| SyncUsers | Cleanup Summary | Orphaned: ${orphanedCount}, Deactivated: ${deactivatedCount}`);
    
  } catch (error) {
    console.error('Error in validateAndCleanupOrphanedUsers:', error);
    FileLog('| SyncUsers | validateAndCleanupOrphanedUsers | Error:', error.message);
  }
}

async function SynchoZendesk() {
  const users = await PersonService.getAllPersons();
  let i = 0;

  try {
    if (users && users.length > 0) {
      for (const user of users) {
        i++;
        console.log(`Charging to Zendesk: [${i}/${users.length}]`);

        // Skip inactive users for Zendesk sync
        if (user.active === false) {
          console.log(`⏭️ Skipping inactive user: ${user.email}`);
          continue;
        }

        const organisationName = await coproService.detailsCopropriete(user.idCopro);
        
        if (!organisationName) {
          console.log(`⚠️ Copro not found for user ${user.email} - skipping Zendesk sync`);
          continue;
        }

        const baseUserData = {
          user: {
            email: user.email,
            skip_verify_email: true,
            name: `${user.nom} ${user.prenom}`,
            role: "end-user",
          }
        };

        const UserData = {
          ...baseUserData,
          user: {
            ...baseUserData.user,
            tags: [user.typePersonne],
            phone: user.telephone || user.mobile || user.telephone2 || user.mobile2,
            mobile: user.mobile || user.mobile2,
            notes: user.url,
            url: user.url,
            organization: { name: organisationName.idCopro },
            user_fields: { role_du_demandeur: user.typePersonne }
          }
        };

        try {
          const zendeskUser = user.idZendesk ? { id: user.idZendesk } : await ZendeskService.getUserFromEmail(user.email);
          await delay(300);

          if (zendeskUser && zendeskUser.id) {
            console.log("Edit User ", zendeskUser.id, " from copro: ", organisationName.idCopro);
            await ZendeskService.updateUser(zendeskUser.id, UserData);
            user.idZendesk = zendeskUser.id;
            await PersonService.editPerson(user._id, user);
            await delay(100);
          } else {
            const idzendeskAfterAdd = await ZendeskService.addUser(baseUserData);
            console.log("Zendesk ID to Mongo db : ", idzendeskAfterAdd, " - ", user._id, " From copro : ", organisationName.idCopro);
            user.idZendesk = idzendeskAfterAdd;
            await PersonService.editPerson(user._id, user);
            await delay(100);
          }
        } catch (error) {
          FileLog('| SyncUsers | SynchoZendesk | User with ID Vilogi :', user.idVilogi, ' and The user is : ', user.idZendesk || user.email, '  ---', error);
          console.error("Error synchronizing user with Zendesk:", error);
        }

        await delay(300);
      }
    }
  } catch (error) {
    console.error("Error fetching user from Zendesk:", error);
  }
}

module.exports = synchroUsers;
