const mongoose = require('mongoose');

const LebarocoproSchema = new mongoose.Schema({
  idCopro: { type: mongoose.Schema.Types.ObjectId, ref: 'Copro' },
  note: Number,
  date: Date,
});

const Lebarocopro = mongoose.model('Lebarocopro', LebarocoproSchema);

module.exports = Lebarocopro;
