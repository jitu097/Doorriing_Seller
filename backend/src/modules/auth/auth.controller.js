const authService = require('./auth.service');
const { successResponse } = require('../../utils/response');

const bootstrap = async (req, res, next) => {
    try {
        const { firebaseUid, email } = req;
        const result = await authService.bootstrapSeller(firebaseUid, email);
        successResponse(res, result, 'Authentication successful');
    } catch (error) {
        next(error);
    }
};

const getProfile = async (req, res, next) => {
    try {
        const profile = await authService.getProfile(req.seller.id);
        successResponse(res, profile);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    bootstrap,
    getProfile
};
