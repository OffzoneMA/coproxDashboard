const mongoose = require('mongoose');

const persoSchema = new mongoose.Schema({
  idCopro: { type: mongoose.Schema.Types.ObjectId, ref: 'Copro' },
  email: String,
  idVilogi: String,
  idZendesk: String,
  idCompteVilogi: String,
  nom: String,
  prenom: String,
  telephone: String,
  typePersonne: String,
  url: String,
  telephone: String,
  telephone2:String,
  mobile:String,
  mobile2:String,
});

const person = mongoose.model('person', persoSchema);

module.exports = person;
