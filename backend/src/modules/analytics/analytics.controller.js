const analyticsService = require('./analytics.service');
const { successResponse } = require('../../utils/response');
const { validateDateFormat } = require('../../utils/validators');
const { BadRequestError } = require('../../utils/errors');

const getDailyAnalytics = async (req, res, next) => {
    try {
        const { start_date, end_date } = req.query;
        
        if (start_date) {
            validateDateFormat(start_date);
        }
        if (end_date) {
            validateDateFormat(end_date);
        }
        
        const analytics = await analyticsService.getDailyAnalytics(req.shop.id, start_date, end_date);
        successResponse(res, analytics);
    } catch (error) {
        next(error);
    }
};

const getSummary = async (req, res, next) => {
    try {
        const { days } = req.query;
        const daysNum = days ? parseInt(days) : 7;
        
        if (daysNum < 1 || daysNum > 365) {
            throw new BadRequestError('Days must be between 1 and 365');
        }
        
        const summary = await analyticsService.getSummary(req.shop.id, daysNum);
        successResponse(res, summary);
    } catch (error) {
        next(error);
    }
};

const getReports = async (req, res, next) => {
    try {
        const { time_range } = req.query;
        const reports = await analyticsService.getReports(req.shop.id, time_range);
        successResponse(res, reports);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getDailyAnalytics,
    getSummary,
    getReports
};
