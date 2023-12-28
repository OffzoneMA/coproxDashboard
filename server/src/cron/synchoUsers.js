// Import required services and controllers
const vilogiService = require('../services/vilogiService');
const coproService = require('../services/coproService');
const PersonService = require('../services/personService');
const ZendeskService = require('../services/zendeskService');
const mongoose = require('mongoose');
const personModel = require('../models/person');
const fs = require('fs');
const path = require('path');

const logFilePath = path.join(__dirname, 'cron.txt');
const logStream = fs.createWriteStream(logFilePath, { flags: 'a' }); // 'a' means append

function customLog(...args) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} ${args.join(' ')}\n`;
  logStream.write(logMessage);
  process.stdout.write(logMessage); // Optional: Write to the console as well
}


function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Object for synchronizing users
const synchroUsers = {
  start: async () => {
    
      console.log('Synchronizing users...');

      // TODO: Fetch the list of all copros
       const copros = await coproService.listCopropriete();
      // console.log(copros[0])

      // Iterate through each copro
      for (const copro of copros) {
      // Fetch data for the current copro
        
        if(copro.idVilogi){
          //console.log(copro)
          
          await getAllUsersAndManageThem(copro.idVilogi,copro)
          await fixUserRole(copro.idVilogi,copro)
        } 
        //await SynchoZendesk();
        
      }




  },
};

async function getAllUsersAndManageThem(idVilogi,Copro){
  const users = await vilogiService.getAllAdherents(idVilogi);
  let i =0
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
          "nom": user.nom,  
          "prenom": user.prenom, 
          "telephone": user.mobile,
          "typePersonne": user.typePersonne
        };
        //console.log(userData);
        await SynchoMongoDB(userData)
        
      } else {
        // Log a message if the user object or email property is missing
        customLog('| SyncUsers | getAllUsersAndManageThem | User with email :',user.email,' ---  email missing.');
      }
    }
  }
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
      customLog('| SyncUsers | SynchoMongoDB | User with email :',user.email,' ---  Double Users.');
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
          
          customLog('| SyncUsers | fixUserRole | User with IdVilogi :',user.idCoproprietaire,'  --- not found for a user.');
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
      
      console.log(`Charging to Zendesk: [${i}/${users.length + 1}]`);
      const organisationName= await coproService.detailsCopropriete(user.idCopro);
      const UserData={"user": {
        "email": user.email,
        "skip_verify_email": true,
        "tags": [user.typePersonne],
        "name": user.nom + " " + user.prenom,
        "phone":user.telephone,
        "organization": {
          "name": organisationName.idCopro
        },
        "role": "end-user"
        }
      };
    
      if (user.idZendesk){
        console.log("there is an User with this email")
        //ZendeskService.updateUser(id,data)

        ZendeskService.updateUser(user.idZendesk,UserData);
        //console.log("-----------------------------------User have been updated in Zendesk: ", user.email)
      }else{
        //search in zendesk via email 
        const ZendeskUser=await ZendeskService.getUserFromEmail(user.email);
        //console.log(ZendeskUser.length===0)
        if (ZendeskUser.length===0){ 

        ZendeskService.addUser(UserData);
        //console.log("----------------------------------- User have been added to Zendesk : ", user.email)
        }
        else{

          console.log(ZendeskUser[0].id)
          ZendeskService.updateUser(ZendeskUser[0].id,UserData);
          //console.log("-------------------------------User have been updated in Zendesk: ", user.email)


          ////Add User ID to mongoDB
        }

        //updateUserID
      }
      delay(2000);
    }
  }
} catch (error) {
    // Handle errors that might occur during the Zendesk API call
    console.error("Error fetching user from Zendesk:", error);
}

}
// Export the synchronization object
module.exports = synchroUsers;
