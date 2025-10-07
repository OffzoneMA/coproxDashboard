const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    nom: {
        type: String,
        required: true
    },
    prenom: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    idVilogi: {
        type: String,
        default: ''
    },
    idMonday: {
        type: String,
        default: ''
    },
    idZendesk: {
        type: String,
        default: ''
    },
    id: {
        type: String,
        required: true,
        unique: true
    }
}, {
    timestamps: true
});

const user = mongoose.model('users', userSchema);

module.exports = user;