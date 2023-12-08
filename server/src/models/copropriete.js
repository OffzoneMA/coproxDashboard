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
});

const Copropriete = mongoose.model('Copropriete', CoproprieteSchema);

module.exports = Copropriete;
