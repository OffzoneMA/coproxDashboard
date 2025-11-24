const mongoose = require('mongoose');

const persoSchema = new mongoose.Schema({
  idCopro: { type: mongoose.Schema.Types.ObjectId, ref: 'Copropriete' },
  email: String,
  idVilogi: String,
  idZendesk: String,
  idCompteVilogi: String,
  nom: String,
  prenom: String,
  telephone: String,
  telephone2: String,
  mobile: String,
  mobile2: String,
  typePersonne: String,
  active: { type: Boolean, default: true },
  url: String,
  solde: { type: Number, default: 0 },
  lastSyncDate: { type: Date, default: Date.now },
  lastSoldeSyncDate: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt timestamp before saving
persoSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const person = mongoose.model('person', persoSchema);

module.exports = person;
