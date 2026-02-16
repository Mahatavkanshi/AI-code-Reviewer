const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(verifyToken);

// Save a new review
router.post('/save', reviewController.saveReview);

// Get all reviews for logged-in user
router.get('/history', reviewController.getUserReviews);

// Get review statistics
router.get('/stats', reviewController.getReviewStats);

// Get single review by ID
router.get('/:id', reviewController.getReviewById);

// Update review (e.g., mark fix applied)
router.patch('/:id', reviewController.updateReview);

// Delete review
router.delete('/:id', reviewController.deleteReview);

module.exports = router;
