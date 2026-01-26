const reviewService = require('./review.service');
const { successResponse } = require('../../utils/response');

const getReviews = async (req, res, next) => {
    try {
        const { page, limit } = req.query;
        const result = await reviewService.getReviews(req.shop.id, page, limit);
        successResponse(res, result);
    } catch (error) {
        next(error);
    }
};

const toggleVisibility = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { is_visible } = req.body;
        
        const review = await reviewService.toggleVisibility(id, req.shop.id, is_visible);
        successResponse(res, review, 'Review visibility updated');
    } catch (error) {
        next(error);
    }
};

const respondToReview = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { seller_response } = req.body;
        
        const review = await reviewService.respondToReview(id, req.shop.id, seller_response);
        successResponse(res, review, 'Response added successfully');
    } catch (error) {
        next(error);
    }
};

const getStats = async (req, res, next) => {
    try {
        const stats = await reviewService.getReviewStats(req.shop.id);
        successResponse(res, stats);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getReviews,
    toggleVisibility,
    respondToReview,
    getStats
};
