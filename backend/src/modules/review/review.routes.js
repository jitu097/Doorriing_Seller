const express = require('express');
const router = express.Router();
const reviewController = require('./review.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');
const { loadSeller, loadShop } = require('../../middlewares/seller.middleware');

router.use(verifyToken, loadSeller, loadShop);

router.get('/', reviewController.getReviews);
router.get('/stats', reviewController.getStats);
router.patch('/:id/visibility', reviewController.toggleVisibility);
router.patch('/:id/respond', reviewController.respondToReview);

module.exports = router;
