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

const logFilePath = path.join(__dirname, '../../logs/cron.txt');
const logStream = fs.createWriteStream(logFilePath, { flags: 'a' }); // 'a' means append

function FileLog(...args) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} ${args.join(' ')}\n`;
  logStream.write(logMessage);
  process.stdout.write(logMessage); // Optional: Write to the console as well
}

const logFilePath2 = path.join(__dirname, '../../logs/stats.txt');
const logStream2 = fs.createWriteStream(logFilePath2, { flags: 'a' }); // 'a' means append
function FileStatLog(...args) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} ${args.join(' ')}\n`;
  logStream2.write(logMessage);
  process.stdout.write(logMessage); // Optional: Write to the console as well
}


function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Object for synchronizing users
const synchroUsers = {
  start: async () => {
      logs.logExecution("synchroUsers")
      const LogId = await scriptService.logScriptStart('synchroUsers');
      console.log('Synchronizing users...');

      // TODO: Fetch the list of all copros
       const copros = await coproService.listCopropriete();
      // console.log(copros[0])

      // Iterate through each copro
      for (const copro of copros) {
      // Fetch data for the current copro
        if(copro.idCopro!="S028") continue
        if(copro.idVilogi){
          //console.log(copro)
          
          await getAllUsersAndManageThem(copro.idVilogi,copro)
          await fixUserRole(copro.idVilogi,copro)
          
        }else{
          console.log("------------------------------------ Attention copro",copro._id," - ",copro.Nom ,"Sans IDVilogi ----------------------------------------------")
        } 
        
        
      }
      await SynchoZendesk();
      await scriptService.updateLogStatus('synchroUsers',LogId ,2 ,"Script executed successfully");


  },
};

async function getAllUsersAndManageThem(idVilogi,Copro){
  const users = await vilogiService.getAllAdherents(idVilogi);
  let i =0
  FileStatLog("Charging from Copro : [",Copro.idCopro,"]"+` Users From Vilogi To MongoDB : [${users.length + 1}] -------- ${Copro.Nom},`)
  if (users && users.length > 0) {
    // Iterate through each user in the array
    for (const user of users) {
      // Check if the user object has an 'email' property
      if (user && user.email) {
        // Log the email for the current user
        i++;
        console.log("Charging from Copro : [",Copro.idCopro, " - " , Copro.Nom,"]"+` Users From Vilogi To MongoDB : [${i}/${users.length + 1}]` )
        const idcoproVar = mongoose.Types.ObjectId(Copro._id);
        const userData = {
          "idCopro": idcoproVar,
          "email": user.email,
          "idVilogi": user.id,
          "idCompteVilogi":user.compte,
          "nom": user.nom,  
          "prenom": user.prenom, 
          "telephone": formatPhoneNumber(user.telephone),
          "telephone2":formatPhoneNumber(user.telephone2),
          "mobile":formatPhoneNumber(user.mobile),
          "mobile2":formatPhoneNumber(user.mobile2),
          "typePersonne": user.typePersonne,
          "active":user.active,
          "url":"https://copro.vilogi.com/AfficheProprietaire.do?operation=change&copropriete="+idVilogi+"&id="+user.id
        };
        console.log(userData)
        //console.log(userData);
        await SynchoMongoDB(userData)
        
      } else {
        // Log a message if the user object or email property is missing
        FileLog('| SyncUsers | getAllUsersAndManageThem | User with email :',user.email,' ---  email missing.');
      }
    }
  }
}

function formatPhoneNumber(phoneNumber) {
  // If the input is empty or only whitespace
  if (!phoneNumber || phoneNumber.trim() === '') {
    return "";
  }

  // Remove all characters except digits and the leading plus sign
  let cleanedNumber = phoneNumber.trim().replace(/(?!^\+)[^0-9]/g, '');
  
  // Check if after cleaning it's still a valid number
  if (!cleanedNumber || (!cleanedNumber.startsWith('0') && !cleanedNumber.startsWith('+'))) {
      return "";
  }

  // If the number starts with '0' and doesn't already have a country code, replace it with '+33'
  if (cleanedNumber.startsWith('0')) {
      cleanedNumber = '+33' + cleanedNumber.slice(1);
  }

  // Return the cleaned number
  return cleanedNumber;
}

async function SynchoMongoDB(userData) {
  try {
    const result = await PersonService.getPersonsByInfo('email', userData.email);
    const val = result.length; // Count of results

    if (val === 1) {
      //console.log('updating -------------------------------------------->' ,result[0]._id);
      const newDataDocument = new personModel(userData);
      const newDataObject = newDataDocument.toObject({ transform: true });
      delete newDataObject._id
      await PersonService.editPerson(result[0]._id,newDataObject );
      console.log(`updated user with email: ${userData.email}`);
    } else if (val === 0) {
      //console.log('adding -------------------------------------------->' ,userData.email);
      const newDataDocument = new personModel(userData);
      await PersonService.addPerson(newDataDocument);
      console.log(`Added user with email: ${userData.email}`);
      // Add your logic to add the record here
    } else if (val > 1) {
      // Handle duplication when there are multiple matches    
      FileLog('| SyncUsers | SynchoMongoDB | User with email :',user.email,' ---  Double Users.');
    }

  } catch (error) {
    console.error('Error in SynchoMongoDB:', error);
  }
}

async function fixUserRole(coproId,Copro) {
  let i =0
  const usersData = await vilogiService.getCoproData(coproId);
  const users=usersData.listConseilSyndical;
  if (users && users.length > 0) {
    // Iterate through each user in the array
    for (const user of users) {
      i++;
      await delay(200)
      console.log("Charging from Copro : [",Copro.idCopro, " - " , Copro.Nom,"]"+` fixing roles in MongoDB: [${i}/${users.length + 1}]` )
      // Check if the user object has an 'email' property
      if (user && user.idCoproprietaire) {
        const userData = {
          "typePersonne": "CS"
        };
        const result = await PersonService.getPersonsByInfo("idVilogi", user.idCoproprietaire);
        const val = result.length; // Count of results
        //console.log(result)
        if (val === 1) {
          //console.log('updating Role -------------------------------------------->' ,result[0]._id);
          const newDataDocument = new personModel(userData);
          const newDataObject = newDataDocument.toObject({ transform: true });
          delete newDataObject._id
          await PersonService.editPerson(result[0]._id,newDataObject );
        }else{
            try{
              const userCS = await vilogiService.getAdherent(Copro.idVilogi,user.idCoproprietaire);
              await delay(200)
              if (userCS && userCS.email) {
                const idcoproVar = mongoose.Types.ObjectId(Copro._id);
                const userData = {
                  "idCopro": idcoproVar,
                  "email": userCS.email,
                  "idVilogi": userCS.id,
                  "idCompteVilogi":userCS.compte,
                  "nom": userCS.nom,  
                  "prenom": userCS.prenom, 
                  "telephone": userCS.telephone,
                  "telephone2":userCS.telephone2,
                  "mobile":userCS.mobile,
                  "mobile2":userCS.mobile2,
                  "typePersonne": "CS",
                  "active":userCS.active,
                  "url":"https://copro.vilogi.com/AfficheProprietaire.do?operation=change&copropriete="+user.idCoproprietaire+"&id="+userCS.id
                };
                console.log(userData)
                //console.log(userData);
                await SynchoMongoDB(userData)
              }
            }catch (error) {
              console.error('Error in SynchoMongoDB:', error);
              FileLog('| SyncUsers | fixUserRole | User with IdVilogi :',user.idCoproprietaire,'  --- not found for a user.');
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
      // Iterate through each user in the array
      for (const user of users) {

        i++;
        console.log(`Charging to Zendesk: [${i}/${users.length}]`);
        const organisationName = await coproService.detailsCopropriete(user.idCopro);
        const baseUserData = {
          "user": {
            "email": user.email,
            "skip_verify_email": true,
            "name": `${user.nom} ${user.prenom}`,
            "role": "end-user",
          }
        };
        const UserData = {
          ...baseUserData,
          "user": {
            ...baseUserData.user,
            "tags": [user.typePersonne],
            "phone":  user.telephone ||  user.mobile || user.telephone2 || user.mobile2 ,
            "mobile":user.mobile || user.mobile2,
            "notes":user.url,
            "url":user.url,
            "organization": { "name": organisationName.idCopro },
            "user_fields": { "role_du_demandeur": user.typePersonne }
          }
        };
        try {
          

          const zendeskUser = user.idZendesk ? { id: user.idZendesk } : await ZendeskService.getUserFromEmail(user.email);
          console.log(zendeskUser.id, " - " , user.email," - " , )
          await delay(300);
          if (zendeskUser && zendeskUser.id) {
            console.log("Edit User " ,zendeskUser.id, " from copro: ",organisationName.idCopro )
            await ZendeskService.updateUser(zendeskUser.id, UserData);
            user.idZendesk = zendeskUser.id;
            await PersonService.editPerson(user._id, user);
            await delay(100);
          } else {
            console.log(UserData)
            const idzendeskAfterAdd = await ZendeskService.addUser(baseUserData);
            console.log("Zendesk ID to Mongo db : ", idzendeskAfterAdd, " - " , user._id  ," From copro : ",organisationName.idCopro)
            user.idZendesk = idzendeskAfterAdd
            await PersonService.editPerson(user._id, user);
            await delay(100);
          }
        } catch (error) {
          FileLog('| SyncUsers | SynchoZendesk | User with ID Vilogi :', user.idVilogi, ' and The user is : ', user.idZendesk || user.email, '  ---', error );
          console.error("Error synchronizing user with Zendesk:", error);
        }
        await delay(300);
      }
    }
  } catch (error) {
      // Handle errors that might occur during the Zendesk API call
      console.error("Error fetching user from Zendesk:", error);
  }
}

// Export the synchronization object
module.exports = synchroUsers;
