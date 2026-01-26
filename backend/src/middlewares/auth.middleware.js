const admin = require('../config/firebaseAdmin');
const { UnauthorizedError } = require('../utils/errors');

const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedError('No token provided');
        }
        
        const token = authHeader.split('Bearer ')[1];
        
        const decodedToken = await admin.auth().verifyIdToken(token);
        
        req.firebaseUid = decodedToken.uid;
        req.email = decodedToken.email;
        
        next();
    } catch (error) {
        if (error.code === 'auth/id-token-expired') {
            return next(new UnauthorizedError('Token expired'));
        }
        if (error.code === 'auth/argument-error') {
            return next(new UnauthorizedError('Invalid token'));
        }
        next(new UnauthorizedError('Authentication failed'));
    }
};

module.exports = { verifyToken };
