const ViCopro = require('../models/vicopro');

const viCoproService = {
    /**
     * Create a new vicopro entry
     */
    createViCopro: async (data) => {
        try {
            const vicopro = new ViCopro(data);
            await vicopro.save();
            return vicopro;
        } catch (error) {
            console.error('Error creating vicopro:', error);
            throw error;
        }
    },

    /**
     * Find the latest active vicopro entry for a specific copro and action
     */
    findLatestByIdCoproAndAction: async (idCopro, actionTitle) => {
        try {
            const vicopro = await ViCopro.findOne({
                idCopro: idCopro,
                actionTitle: actionTitle,
                status: 'active'
            }).sort({ dateEcheance: -1 });
            
            return vicopro;
        } catch (error) {
            console.error('Error finding vicopro:', error);
            throw error;
        }
    },

    /**
     * Update vicopro entry status
     */
    updateViCoproStatus: async (id, status) => {
        try {
            const vicopro = await ViCopro.findByIdAndUpdate(
                id,
                { 
                    status: status,
                    dateModification: new Date()
                },
                { new: true }
            );
            return vicopro;
        } catch (error) {
            console.error('Error updating vicopro:', error);
            throw error;
        }
    },

    /**
     * Find all active vicopro entries for a specific copro
     */
    findAllActiveByIdCopro: async (idCopro) => {
        try {
            const vicopros = await ViCopro.find({
                idCopro: idCopro,
                status: 'active'
            }).sort({ dateEcheance: 1 });
            
            return vicopros;
        } catch (error) {
            console.error('Error finding vicopros:', error);
            throw error;
        }
    },

    /**
     * Check if a future active entry exists for a copro and action
     */
    hasFutureActiveEntry: async (idCopro, actionTitle) => {
        try {
            const today = new Date();
            const count = await ViCopro.countDocuments({
                idCopro: idCopro,
                actionTitle: actionTitle,
                status: 'active',
                dateEcheance: { $gt: today }
            });
            
            return count > 0;
        } catch (error) {
            console.error('Error checking future entry:', error);
            throw error;
        }
    },

    /**
     * Delete vicopro entries
     */
    deleteViCopro: async (id) => {
        try {
            await ViCopro.findByIdAndDelete(id);
        } catch (error) {
            console.error('Error deleting vicopro:', error);
            throw error;
        }
    }
};

module.exports = viCoproService;
