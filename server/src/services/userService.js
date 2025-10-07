const User = require('../models/user');
const { createServiceLogger } = require('./logger');
const { logger, logError } = createServiceLogger('user');

// Create a new user
async function createUser(userData) {
    try {
        const user = new User({
            nom: userData.nom,
            prenom: userData.prenom,
            email: userData.email,
            idVilogi: userData.idVilogi || '',
            idMonday: userData.idMonday || '',
            idZendesk: userData.idZendesk || '',
            id: userData.id
        });
        const res = await user.save();
        logger.info('User created', { meta: { id: res?._id?.toString?.() } });
        return res;
    } catch (error) {
        logError(error, 'Error creating user');
        throw new Error(`Error creating user: ${error.message}`);
    }
}

// Get user by ID
async function getUserById(userId) {
    try {
        const res = await User.findById(userId);
        logger.info('Fetched user by id', { meta: { id: userId, found: !!res } });
        return res;
    } catch (error) {
        logError(error, 'Error fetching user by id', { userId });
        throw new Error(`Error fetching user: ${error.message}`);
    }
}

// Get user by mondayID
async function getUserByMondayId(mondayId) {
    try {
        const res = await User.findOne({ idMonday: mondayId });
        logger.info('Fetched user by Monday id', { meta: { mondayId, found: !!res } });
        return res;
    } catch (error) {
        logError(error, 'Error fetching user by Monday id', { mondayId });
        throw new Error(`Error fetching user: ${error.message}`);
    }
}

// Get user by email
async function getUserByEmail(email) {
    try {
        const res = await User.findOne({ email });
        logger.info('Fetched user by email', { meta: { email, found: !!res } });
        return res;
    } catch (error) {
        logError(error, 'Error fetching user by email', { email });
        throw new Error(`Error fetching user by email: ${error.message}`);
    }
}

// Update user
async function updateUser(userId, updateData) {
    try {
        const res = await User.findByIdAndUpdate(userId, updateData, { new: true });
        logger.info('Updated user', { meta: { id: userId, found: !!res } });
        return res;
    } catch (error) {
        logError(error, 'Error updating user', { userId });
        throw new Error(`Error updating user: ${error.message}`);
    }
}

// Delete user
async function deleteUser(userId) {
    try {
        const res = await User.findByIdAndDelete(userId);
        logger.info('Deleted user', { meta: { id: userId, deleted: !!res } });
        return res;
    } catch (error) {
        logError(error, 'Error deleting user', { userId });
        throw new Error(`Error deleting user: ${error.message}`);
    }
}

// Get all users
async function getAllUsers() {
    try {
        const res = await User.find({});
        logger.info('Fetched all users', { meta: { count: Array.isArray(res) ? res.length : 0 } });
        return res;
    } catch (error) {
        logError(error, 'Error fetching users');
        throw new Error(`Error fetching users: ${error.message}`);
    }
}

module.exports = {
    createUser,
    getUserById,
    getUserByMondayId,
    getUserByEmail,
    updateUser,
    deleteUser,
    getAllUsers
};