const mongoose = require('mongoose');

const suiviAGSchema = new mongoose.Schema({
  idCopro: { type: mongoose.Schema.Types.ObjectId, ref: 'Copro' },
  saison: Number,
  idTrello: String,
  dateAG: Date,
});

const suiviAG = mongoose.model('suiviAG', suiviAGSchema);

module.exports = suiviAG;
