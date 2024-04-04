const vilogiService = require('../services/vilogiService');
const coproService = require('../services/coproService');
const zendeskService =require('../services/zendeskService')
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
        await vilogiToMongodb()
        await mongodbToZendesk()
        await mongodbToMonday()
        await mongodbToMondayCoproMorte()
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
            //typeChauffage:detailData.typeChauffage,
            //dateConstruction:detailData.anneeConstruction,
          }
          data.idCopro = copro.lot ? copro.lot : "S-Autre";
          if (findCopro){
            let edit= await coproService.editCopropriete(findCopro._id,data)
            //console.log(copro.lot, " Edit info")
          }else{
            let add= await coproService.addCopropriete(data)
            //console.log(copro.lot, " add info")
          }
          await delay(100)
        }
}

async function mongodbToZendesk(){
  const copros= await coproService.listCopropriete();
  for (const copro of copros) {
    const orgZendesk = zendeskService.getAllorganizations()
    if(copro.idCopro){
      console.log(copro.idCopro)

    }else{
      console.log()
    }
  }

}


async function mongodbToMonday(){
    const copros= await coproService.listCopropriete();
    for (const copro of copros) {
        // Fetch data for the current copro
          if(copro.idMonday){
            //console.log(copro)
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
  //const data = await mondayService.getItemsDetails(1436164818);
  const copros= await coproService.listCopropriete();
  for (const copro of copros) {
      // Fetch data for the current copro
      console.log(copro)
      const columnValues={
        texte:copro.idCopro,
        text:copro.ville,
        text83:copro.Nom,
        dup__of___n__et_rue:copro.codepostal,
        dup__of___ville:copro.immatriculation,
        text0:copro.dateConstruction,
        date3:{"date" : copro.dateReprise.split('/').reverse().join('-')},
        chiffres:copro.nbLotPrincipaux,
        dup__of___nom:copro.address

      }
      const values = await mondayService.getItemInBoardWhereName(copro.idCopro,LesCoprosInfoMorteIDBoard)
      if(values)
        await mondayService.updateItem(LesCoprosInfoMorteIDBoard, values.id, columnValues)
  }

}

module.exports = synchroCopro;
