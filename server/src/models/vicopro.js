const mongoose = require('mongoose');

const ViCoproSchema = new mongoose.Schema({
    idCopro: { type: String, required: true, index: true },
    actionTitle: { type: String, required: true },
    dateCreation: { type: Date, required: true, default: Date.now },
    dateEcheance: { type: Date, required: true },
    copro: { type: mongoose.Schema.Types.ObjectId, ref: 'Copropriete' },
    status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' },
    dateModification: { type: Date, default: Date.now }
});

// Compound index for faster queries
ViCoproSchema.index({ idCopro: 1, actionTitle: 1, status: 1 });

const ViCopro = mongoose.model('ViCopro', ViCoproSchema);

module.exports = ViCopro;
