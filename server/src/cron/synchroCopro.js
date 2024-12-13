const vilogiService = require('../services/vilogiService');
const coproService = require('../services/coproService');
const zendeskService =require('../services/zendeskService');
const scriptService = require('../services/scriptService');
const mondayService = require('../services/mondayService');
const logs = require('../services/logs');
const LesCoprosIDBoard=1404452123
const LesCoprosInfoMorteIDBoard=1436164777

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const synchroCopro = {
    start: async () => {
        
        logs.logExecution("synchroCopro")
        const LogId = await scriptService.logScriptStart('synchroCopro');
        await vilogiToMongodb()
        await mongodbToZendesk()
        await mongodbToMonday()
        await mongodbToMondayCoproMorte()
        await scriptService.updateLogStatus('synchroCopro',LogId ,2 ,"Script executed successfully");
            
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
  const orgZendesk = await zendeskService.getAllorganizations(); // Wait for organizations to be fetched

  for (const copro of copros) {
    await delay(100)
    // Check if the copro exists in orgZendesk
    const existingOrg = orgZendesk.find(org => org.name === copro.idCopro);

    if(existingOrg){
      console.log("Updating Zendesk copro", copro.idCopro);
      // Update logic goes here if needed
    } else {
      const organizationData = {
        name: copro.idCopro,
        organization_fields:{verif_copro:true,ArriveCopro:true}
        // Add any other data needed for organization creation
      };
      console.log("Adding Zendesk copro", organizationData.name);
      await zendeskService.addOrganization(organizationData); // Wait for organization to be added
    }
  }
}


async function mongodbToMonday(){
    const copros= await coproService.listCopropriete();
    for (const copro of copros) {
        // Fetch data for the current copro
          if(copro.idMonday){
            console.log(copro.idCopro)
            const data = await mondayService.getItemsDetails(copro.idMonday);
            //console.log(data)
            delay(200)
          }else{
            if(!copro.idCopro) continue
            const values = await mondayService.getItemInBoardWhereName(copro.idCopro,LesCoprosIDBoard)
            console.log(values)
            if(values){
                copro.idMonday=values.id
                coproService.editCopropriete(copro._id,copro)
            }

            //console.log("------------------------------------ Attention copro",copro._id," - ",copro.Nom ,"Sans IDMOnday ----------------------------------------------")
            delay(200)
          }         
        }
}
async function mongodbToMondayCoproMorte(){
  
  const copros= await coproService.listCopropriete();
  for (const copro of copros) {
      console.log(await mondayService.getItemsDetails(1436164829));
      // Fetch data for the current copro
      console.log(copro)
      try {
        const data= await vilogiService.getCoproData(copro.idVilogi)
        const dataTech= await vilogiService.getCoproDataTech(copro.idVilogi)
        console.log(data)
        const columnValues={
          texte:copro.idCopro,
          text:copro.ville,
          text83:copro.Nom,
          dup__of___n__et_rue:copro.codepostal,
          dup__of___ville:copro.immatriculation,
          text0:copro.dateConstruction,
          date3:{"date" : copro.dateReprise.split('/').reverse().join('-')},
          chiffres:copro.nbLotPrincipaux,
          dup__of___nom:copro.address,
          texte_12__1:dataTech.eauChaude,
          texte41__1:dataTech.eauFroide,
          chiffres__1:dataTech.nbAscenseur,
          texte_2__1:dataTech.energieChauffage,
          texte_3__1:dataTech.chauffageUrbain,
          texte_4__1:dataTech.typeChauffage,
          chiffres_1__1:data.coproInfo.nbStationnement,
          chiffres_2__1:data.coproInfo.nbCave,
          
          

        }
        const values = await mondayService.getItemInBoardWhereName(copro.idCopro,LesCoprosInfoMorteIDBoard)
        await delay(200)
        console.log(values)
        if (typeof values !== 'undefined' && values !== null && typeof values === 'object' && Object.keys(values).length > 0) 
          await mondayService.updateItem(LesCoprosInfoMorteIDBoard, values.id, columnValues)
        else{
          console.log("adding copro ",copro.idCopro )
          await mondayService.createItem(LesCoprosInfoMorteIDBoard, copro.idCopro, columnValues)
        }
      }catch{

      }
  }

}

module.exports = synchroCopro;
