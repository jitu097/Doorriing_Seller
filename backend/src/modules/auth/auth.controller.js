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

const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        
        // Simple validation
        if (!email || !email.includes('@')) {
            return res.status(400).json({ success: false, message: 'Invalid email address' });
        }

        // Generic log (avoid logging sensitive data)
        console.log(`[AUTH] Password reset requested for: ${email.split('@')[0]}... @ ${new Date().toISOString()}`);
        
        // Always return generic success for security
        successResponse(res, null, 'If this email is registered, a password reset link has been sent.');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    bootstrap,
    getProfile,
    forgotPassword
};
