const vilogiService = require('../services/vilogiService');
const coproService = require('../services/coproService');
const zendeskService =require('../services/zendeskService');
const scriptService = require('../services/scriptService');
const mondayService = require('../services/mondayService');
const logs = require('../services/logs');
const MongoDB = require('../utils/mongodb');
const LesCoprosIDBoard=1404452123
const LesCoprosInfoMorteIDBoard=1436164777

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const synchroCopro = {
    start: async () => {
        
        logs.logExecution("synchroCopro")
        let counterStart =await vilogiService.countConenction();
        const LogId = await scriptService.logScriptStart('synchroCopro');
        console.log(LogId)
        await vilogiToMongodb()
        await mongodbToZendesk()
        await mongodbToMondayCoproMorte()
        await mongodbToMonday()
        await mongodbToMondayCoproInacrtiv()
        //await mondayToZendeskResponsables()
        let counterEnd =await vilogiService.countConenction();
        let VolumeCalls = counterEnd[0].nombreAppel - counterStart[0].nombreAppel
        console.log(VolumeCalls)
        await scriptService.updateLogStatus('synchroCopro',LogId ,0 ,`Script executed successfully `, VolumeCalls );
        console.log('--------------------------------------------------------------------------------------------END Extraction ...');
                                          
            
    }

}
async function vilogiToMongodb(){
        ///get all copros from Vilogi: 
        const allCoprosFromVilogi = await vilogiService.getAllCopros();
        for(const copro of allCoprosFromVilogi){
          //console.log(copro.lot)

          const detailData=await vilogiService.getCoproData(copro.id)
          //console.log(detailData)
          console.log(copro.lot, " Managing Data")
          let findCopro = await coproService.detailsCoproprieteByidVilogi(copro.id)
          //console.log(copro)
          let data={
            Nom:copro.nom.replace(/'/g, ' '),
            ville:copro.ville,
            address:copro.adresse,
            codepostal:copro.codepostal,
            idVilogi:copro.id,
            dateReprise:copro.dateReprise,
            immatriculation:detailData.site,
            nbLotPrincipaux:detailData.coproInfo.nbLotPrincipaux,
          }
          
          data.idCopro = copro.lot ? copro.lot : "S-Autre";
          if (findCopro){
            let edit= await coproService.editCopropriete(findCopro._id,data)
            //console.log(copro.lot, " Edit info")
          }else{
            data = {
              ...data, 
              status:"Actif"}
            let add= await coproService.addCopropriete(data)
            //console.log(copro.lot, " add info")
          }
          await delay(100)
        }
        const copros = await coproService.listCopropriete();
        for (const copro of copros) {
          try {
            console.log("starting tech data with" ,copro.idCopro)
            const dataTech= await vilogiService.getCoproDataTech(copro.idVilogi)
            let data={
              typeChauffage:dataTech.typeChauffage,
              dateConstruction:dataTech.anneeConstruction,
            }
            console.log(dataTech)
            await coproService.editCopropriete(copro._id,data)
            await delay(400)
          } catch (error) {
            console.log(error)
          }

        }
}

async function mongodbToZendesk(){
  const copros = await coproService.listCopropriete();
  const orgZendesk = await zendeskService.getAllOrganizations(); // Wait for organizations to be fetched

  for (const copro of copros) {
    await delay(100)
    // Check if the copro exists in orgZendesk
    const existingOrg = orgZendesk.find(org => org.name === copro.idCopro);

    if(existingOrg){
      console.log("Updating Zendesk copro", copro.idCopro);
      // Update logic goes here if needed
      const organizationData = {
        organization_fields:{          
          adresse: copro.address,
          codepostal: copro.codepostal,
          ville: copro.ville,
          nom: copro.Nom,
          immatriculation: copro.immatriculation,
          copro_gerer_par_coprox:copro.status}
        // Add any other data needed for organization update
      };
      await zendeskService.updateOrganization(existingOrg.id, organizationData); // Wait for organization to be updated
      
    } else {
      const organizationData = {
        name: copro.idCopro,
        organization_fields:{
          adresse: copro.address,
          codepostal: copro.codepostal,
          ville: copro.ville,
          nom: copro.Nom,
          immatriculation: copro.immatriculation,
          //date_integration_coprox: copro.dateReprise,
          verif_copro:true,
          ArriveCopro:true,
          arriv_copro_compta:true,
          copro_gerer_par_coprox:copro.status}
        // Add any other data needed for organization creation
      };
      console.log(organizationData)
      console.log("Adding Zendesk copro", organizationData.name);
      await zendeskService.addOrganization(organizationData); // Wait for organization to be added
    }
  }
}

///// barocorpo
async function mongodbToMonday() {
  const copros = await coproService.listCopropriete();
  for (const copro of copros) {
    if (!copro.idCopro) continue;

    // If already has Monday ID, just fetch details (optional, can be removed if not needed)
    if (copro.idMonday) {
      console.log(copro.idCopro);
      await mondayService.getItemsDetails(copro.idMonday);
      await delay(200);
      continue;
    }

    // Try to find item in Monday board by name
    const itemPresent = await mondayService.getItemInBoardWhereName(copro.idCopro, LesCoprosIDBoard);
    let values = null;

    if (itemPresent) {
      copro.idMonday = itemPresent.id;
      await coproService.editCopropriete(copro._id, copro);
    } else {
      const baseColumnValues = {};
      if (copro.idMondayMorte != null) {
        baseColumnValues.board_relation = { item_ids: [copro.idMondayMorte] };
      }
      values = await mondayService.createItem(LesCoprosIDBoard, copro.idCopro, baseColumnValues);

      if (values) {
        copro.idMonday = values.id;
        await coproService.editCopropriete(copro._id, copro);
      }
    }

    //console.log(values || itemPresent);
    await delay(200);
  }
}


///// informatiopn clé
async function mongodbToMondayCoproMorte(){
  
  const copros= await coproService.listCopropriete();
  for (const copro of copros) {
      //if(copro.idCopro!="S070")continue
      const values = await mondayService.getItemInBoardWhereName(copro.idCopro,LesCoprosInfoMorteIDBoard)
      console.log(values)
      console.log(copro)
      try {
        const data= await vilogiService.getCoproData(copro.idVilogi)
        let dataTech = null;
        try {
            dataTech = await vilogiService.getCoproDataTech(copro.idVilogi);
        } catch (error) {
            console.error("Une erreur est survenue lors de la récupération des données techniques:", error.data);
        }

        const baseColumnValues = {
            texte: copro.idCopro,
            text: copro.ville,
            text83: copro.Nom,
            dup__of___n__et_rue: copro.codepostal,
            dup__of___ville: copro.immatriculation,
            text0: copro.dateConstruction,
            date3: {"date": copro.dateReprise.split('/').reverse().join('-')},
            chiffres: copro.nbLotPrincipaux,
            dup__of___nom: copro.address,
            chiffres_1__1: data.coproInfo.nbStationnement,
            chiffres_2__1: data.coproInfo.nbCave,
        };

        const technicalColumnValues = dataTech ? {
            texte_12__1: dataTech.eauChaude,
            texte41__1: dataTech.eauFroide,
            chiffres__1: dataTech.nbAscenseur,
            texte_2__1: dataTech.energieChauffage,
            texte_3__1: dataTech.chauffageUrbain,
            texte_4__1: dataTech.typeChauffage,
        } : {
            texte_12__1: '',
            texte41__1: '',
            chiffres__1: '',
            texte_2__1: '',
            texte_3__1: '',
            texte_4__1: '',
        };

        const columnValues = {
            ...baseColumnValues,
            ...technicalColumnValues
        };

        if (typeof values !== 'undefined' && values !== null && typeof values === 'object' && Object.keys(values).length > 0) {
          await mondayService.updateItem(LesCoprosInfoMorteIDBoard, values.id, columnValues);
          console.log("updating copro ",copro.idCopro ," - ",values.id)
              
          copro.idMondayMorte = values.id;
          await coproService.editCopropriete(copro._id, copro);

        }

        else{
          console.log("adding copro ",copro.idCopro )
          value = await mondayService.createItem(LesCoprosInfoMorteIDBoard, copro.idCopro, columnValues)
          copro.idMondayMorte = values.id;
          console.log("Copro added", copro.idCopro, " - ", value.id)
          await coproService.editCopropriete(copro._id, copro);
          await mondayService.createItem(1882791012, copro.idCopro, )
          await mondayService.createItem(1526915839, copro.idCopro, )



        }
        await delay(200)
      } catch (error) {
        console.error("Une erreur est survenue :", error);
      }
  }

}
async function mongodbToMondayCoproInacrtiv(){
  console.log("Starting mongodbToMondayCoproInacrtiv")

  const copros= await mondayService.getItemsGroup(1404452123);
  for (const copro of copros) {
    console.log("Copro", copro.name);
    if(copro.group.id === "nouveau_groupe__1"){
      console.log("Copro Inactif", copro.name);
      console.log("Updating Monday Copro Inactif", copro.name);
        let collectID = await coproService.detailsCoproprieteByidCopro(copro.name)
        console.log(collectID)
        if(!collectID) continue
        await coproService.editCopropriete(collectID._id, {status:"Inactif"});
    }
    await delay(100)
  }
}


async function mondayToZendeskResponsables(){
  console.log("Starting mondayToZendeskResponsables")

}
module.exports = synchroCopro;
