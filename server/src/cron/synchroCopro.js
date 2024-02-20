const vilogiService = require('../services/vilogiService');
const coproService = require('../services/coproService');
const ZendeskService = require('../services/zendeskService');


function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const synchroCopro = {
    //let Copros = await coproService.listCopropriete()
    //for (Copro in Copros){
    //    coproService.detailsCopropriete(Copro.id)
    //}

}

module.exports = synchroCopro;
