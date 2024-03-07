const mongoose = require('mongoose');

const suiviFicheSchema = new mongoose.Schema({
  idCopro: { type: mongoose.Schema.Types.ObjectId, ref: 'Copro' },
  email: String,
  idVilogi: String,
  idZendesk: String,
  nom: String,
  prenom: String,
  telephone: String,
  typePersonne: String
});

const suiviFiche = mongoose.model('suiviFiche', suiviFicheSchema);

module.exports = suiviFiche;
