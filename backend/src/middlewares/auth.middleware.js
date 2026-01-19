const admin = require('../config/firebaseAdmin');
const supabase = require('../config/supabaseClient');
const { UnauthorizedError } = require('../utils/errors');

const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedError('No token provided');
        }

        const token = authHeader.split(' ')[1];

        // Verify Firebase Token
        const decodedToken = await admin.auth().verifyIdToken(token);
        const { uid } = decodedToken;

        // Get User from Supabase
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('firebase_uid', uid)
            .single();

        if (error || !user) {
            throw new UnauthorizedError('User not found in database');
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.code === 'auth/id-token-expired') {
            next(new UnauthorizedError('Token expired'));
        } else if (error.code === 'auth/argument-error') {
            next(new UnauthorizedError('Invalid token'));
        } else {
            next(new UnauthorizedError('Authentication failed'));
        }
    }
};

module.exports = { authenticate };
