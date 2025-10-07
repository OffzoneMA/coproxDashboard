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

      console.log('Synchronizing users...');
      // Start counter (you had it commented out)
      counterStart = await vilogiService.countConenction();

      // Fetch all copros
      const copros = await coproService.listCopropriete();

      // Iterate copros
      for (const copro of copros) {
        if (copro.idVilogi) {
          await getAllUsersAndManageThem(copro.idVilogi, copro);
          await fixUserRole(copro.idVilogi, copro);
        } else {
          console.log("------------------------------------ Attention copro", copro._id, " - ", copro.Nom, "Sans IDVilogi ----------------------------------------------");
        }
      }

      await SynchoZendesk();

      const counterEnd = await vilogiService.countConenction();
      const VolumeCalls = counterEnd[0].nombreAppel - counterStart[0].nombreAppel;

      await scriptService.updateLogStatus('synchroUsers', LogId, 0, `Script executed successfully`, VolumeCalls);
      console.log('--------------------------------------------------------------------------------------------END Extraction ...');

    } catch (error) {
      console.error('An error occurred:', error.message);

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

  if (users && users.length > 0) {
    for (const user of users) {
      if (user && user.email) {
        i++;
        console.log("Charging from Copro : [", Copro.idCopro, " - ", Copro.Nom, "]" + ` Users From Vilogi To MongoDB : [${i}/${users.length + 1}]`);

        // ❗ FIX: use `new` with mongoose.Types.ObjectId
        const idcoproVar = new mongoose.Types.ObjectId(Copro._id);

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
          active: user.active,
          url: `https://copro.vilogi.com/AfficheProprietaire.do?operation=change&copropriete=${idVilogi}&id=${user.id}`,
        };

        await SynchoMongoDB(userData);

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

async function SynchoMongoDB(userData) {
  try {
    const result = await PersonService.getPersonsByInfo('email', userData.email);
    const val = result.length;

    if (val === 1) {
      // Keep update logic using a plain object
      const newDataDocument = new personModel(userData);
      const newDataObject = newDataDocument.toObject({ transform: true });
      delete newDataObject._id;
      await PersonService.editPerson(result[0]._id, newDataObject);
      console.log(`updated user with email: ${userData.email}`);
    } else if (val === 0) {
      // Insert plain object (safer than inserting mongoose doc directly)
      await PersonService.addPerson(userData);
      console.log(`Added user with email: ${userData.email}`);
    } else if (val > 1) {
      // ❗ FIX: user.email is not defined here; use userData.email
      FileLog('| SyncUsers | SynchoMongoDB | User with email :', userData.email, ' ---  Double Users.');
    }

  } catch (error) {
    console.error('Error in SynchoMongoDB:', error);
  }
}

async function fixUserRole(coproId, Copro) {
  let i = 0;
  const usersData = await vilogiService.getCoproData(coproId);
  const users = usersData.listConseilSyndical;

  if (users && users.length > 0) {
    for (const user of users) {
      i++;
      await delay(200);
      console.log("Charging from Copro : [", Copro.idCopro, " - ", Copro.Nom, "]" + ` fixing roles in MongoDB: [${i}/${users.length + 1}]`);

      if (user && user.idCoproprietaire) {
        const userData = { typePersonne: "CS" };
        const result = await PersonService.getPersonsByInfo("idVilogi", user.idCoproprietaire);
        const val = result.length;

        if (val === 1) {
          const newDataDocument = new personModel(userData);
          const newDataObject = newDataDocument.toObject({ transform: true });
          delete newDataObject._id;
          await PersonService.editPerson(result[0]._id, newDataObject);
        } else {
          try {
            const userCS = await vilogiService.getAdherent(Copro.idVilogi, user.idCoproprietaire);
            await delay(200);
            if (userCS && userCS.email) {
              // ❗ FIX: use `new` with mongoose.Types.ObjectId
              const idcoproVar = new mongoose.Types.ObjectId(Copro._id);

              const userData = {
                idCopro: idcoproVar,
                email: userCS.email,
                idVilogi: userCS.id,
                idCompteVilogi: userCS.compte,
                nom: userCS.nom,
                prenom: userCS.prenom,
                telephone: userCS.telephone,
                telephone2: userCS.telephone2,
                mobile: userCS.mobile,
                mobile2: userCS.mobile2,
                typePersonne: "CS",
                active: userCS.active,
                url: `https://copro.vilogi.com/AfficheProprietaire.do?operation=change&copropriete=${user.idCoproprietaire}&id=${userCS.id}`
              };

              await SynchoMongoDB(userData);
            }
          } catch (error) {
            console.error('Error in SynchoMongoDB:', error);
            FileLog('| SyncUsers | fixUserRole | User with IdVilogi :', user.idCoproprietaire, '  --- not found for a user.');
          }
        }
      }
    }
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

        const organisationName = await coproService.detailsCopropriete(user.idCopro);

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
