const mongoose = require('mongoose');

const CoproprieteSchema = new mongoose.Schema({
    idCopro: { type: String, required: true },
    Nom: { type: String, required: true },
    ville: { type: String, required: true },
    status: { type: String, required: false },
    address: { type: String, required: false },
    codepostal: { type: String, required: false },
    Offre: { type: String, required: false },
    exerciceCT: { type: Date, required: false },
    dateReprise:{ type: Date, required: false },
    idVilogi:{ type: String, required: false },
    idMondayMortex:{ type: String, required: false },
    immatriculation:{ type: String, required: false },
    nbLotPrincipaux:{ type: Number, required: false },
    typeChauffage:{ type: String, required: false },
    dateConstruction:{ type: String, required: false },
    dateCreation: { type: Date },
    dateModification: { type: Date },
    dateReprise: { type: Date, required: false },
    dateFin: { type: Date, required: false },
    suiviCopro: { type: Map,of: Date,required: false},
});

const Copropriete = mongoose.model('Copropriete', CoproprieteSchema);

module.exports = Copropriete;