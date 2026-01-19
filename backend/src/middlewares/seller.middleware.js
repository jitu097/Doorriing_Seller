const { ForbiddenError } = require('../utils/errors');
const { ROLES } = require('../utils/constants');

const requireSeller = (req, res, next) => {
    if (!req.user || req.user.role !== ROLES.SELLER) {
        return next(new ForbiddenError('Access denied. Seller role required.'));
    }
    next();
};

module.exports = { requireSeller };
