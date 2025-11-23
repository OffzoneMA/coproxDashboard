const mongoose = require('mongoose');

const PrestataireSchema = new mongoose.Schema({
    idCompte: { type: Number, required: true },
    societe: { type: String, required: true },
    adresse: { type: String, required: false },
    complement: { type: String, required: false },
    ville: { type: String, required: false },
    codepostal: { type: String, required: false },
    telephone: { type: String, required: false },
    fax: { type: String, required: false },
    email: { type: String, required: false },
    web: { type: String, required: false },
    siren: { type: String, required: false },
    rcs: { type: String, required: false },
    iban: { type: String, required: false },
    bic: { type: String, required: false },
    virement: { type: Number, required: false, default: 0 },
    solde: { type: Number, required: false, default: 0 },
    status: { type: String, required: false, default: 'Active' }, // 'Active' or 'Inactive'
    dateRemoval: { type: Date, required: false }, // Date when prestataire was removed from Vilogi
    dateCreation: { type: Date, default: Date.now },
    dateModification: { type: Date, default: Date.now }
});

const Prestataire = mongoose.model('Prestataire', PrestataireSchema);

module.exports = Prestataire;
