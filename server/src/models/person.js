const mongoose = require('mongoose');

const persoSchema = new mongoose.Schema({
  // Changed to array to support multiple copros per person
  idCopro: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Copropriete' }],
  email: { type: String, unique: true, sparse: true }, // Add unique constraint
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

// Helper methods
persoSchema.methods.addCopro = function(coproId) {
  if (!this.idCopro) this.idCopro = [];
  const coproIdStr = coproId.toString();
  if (!this.idCopro.some(id => id.toString() === coproIdStr)) {
    this.idCopro.push(coproId);
  }
};

persoSchema.methods.removeCopro = function(coproId) {
  if (!this.idCopro) return;
  const coproIdStr = coproId.toString();
  this.idCopro = this.idCopro.filter(id => id.toString() !== coproIdStr);
};

persoSchema.methods.hasCopro = function(coproId) {
  if (!this.idCopro || this.idCopro.length === 0) return false;
  const coproIdStr = coproId.toString();
  return this.idCopro.some(id => id.toString() === coproIdStr);
};

const person = mongoose.model('person', persoSchema);

module.exports = person;
