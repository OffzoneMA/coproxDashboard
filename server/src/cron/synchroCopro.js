const vilogiService = require('../services/vilogiService');
const coproService = require('../services/coproService');
const zendeskService =require('../services/zendeskService')
const mondayService = require('../services/mondayService');
const LesCoprosIDBoard=1404452123

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const synchroCopro = {
    start: async () => {
        
        ///get all copros from Vilogi: 
        const allCoprosFromVilogi = await vilogiService.getAllCopros();

        for(const copro of allCoprosFromVilogi){
          let findCopro = await coproService.detailsCoproprieteByidVilogi(copro.id)
          console.log(findCopro);
          let data={
            Nom:copro.nom,
            ville:copro.ville,
            address:copro.adresse,
            codepostal:copro.codepostal,
            idCopro:copro.lot,
            idVilogi:copro.id,
            dateReprise:copro.dateReprise,

          }
          if (findCopro){
            let edit= await coproService.editCopropriete(findCopro._id,data)
            console.log(edit)
          }else{
            let add= await coproService.addCopropriete(data)
            console.log(add)
          }
          
        }
        //await mongodbToZendesk()
        await mongodbToMonday()

    }

}


async function mongodbToMonday(){
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
            console.log(data)
            delay(200)
          }else{continue
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

module.exports = synchroCopro;
