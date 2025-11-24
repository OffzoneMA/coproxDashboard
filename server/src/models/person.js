const mongoose = require('mongoose');

const persoSchema = new mongoose.Schema({
  // Changed to array to support multiple copros per person
  idCopro: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Copropriete' }],
  email: { type: String, unique: true, sparse: true }, // Add unique constraint
  idVilogi: String,
  idZendesk: String,
  idCompteVilogi: String,
  
  // Personal information
  civilite: String, // Mr, Mme, etc.
  nom: String,
  prenom: String,
  
  // Contact information
  telephone: String,
  telephone2: String,
  mobile: String,
  mobile2: String,
  fax: String,
  
  // Address information
  adresse: String,
  complement: String, // Address complement
  codepostal: String,
  ville: String,
  pays: String,
  region: String,
  
  // Professional information
  typePersonne: String, // CS, Adherent, etc.
  profession: String,
  organisme: String, // Organization name
  poste: String, // Job position
  
  // Additional info
  active: { type: Boolean, default: true },
  url: String,
  solde: { type: Number, default: 0 },
  
  // Dates and metadata
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
