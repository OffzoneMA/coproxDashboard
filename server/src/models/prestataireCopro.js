const mongoose = require('mongoose');

// Junction table for many-to-many relationship between Prestataire and Copropriete
const PrestataireCoproSchema = new mongoose.Schema({
    prestataireId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Prestataire', 
        required: true 
    },
    coproprieteId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Copropriete', 
        required: true 
    },
    dateDebut: { type: Date, required: false },
    dateFin: { type: Date, required: false },
    typePrestation: { type: String, required: false }, // e.g., "Entretien", "Réparation", etc.
    notes: { type: String, required: false },
    dateCreation: { type: Date, default: Date.now },
    dateModification: { type: Date, default: Date.now }
});

// Create a compound index to ensure uniqueness
PrestataireCoproSchema.index({ prestataireId: 1, coproprieteId: 1 }, { unique: true });

const PrestataireCopro = mongoose.model('PrestataireCopro', PrestataireCoproSchema);

module.exports = PrestataireCopro;
