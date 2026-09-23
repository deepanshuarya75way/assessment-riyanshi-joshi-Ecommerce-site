import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  createReview,
  getProductReviews,
  getMyReview,
  getReviewEligibility,
  updateReview,
  deleteReview,
} from '../controllers/review.controller.js';

const router = Router({ mergeParams: true });

const reviewValidation = [
  body('rating')
    .notEmpty()
    .withMessage('Rating is required')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('title')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 100 })
    .withMessage('Title must be at most 100 characters'),
  body('comment')
    .trim()
    .notEmpty()
    .withMessage('Review comment is required')
    .isLength({ min: 1, max: 2000 })
    .withMessage('Review comment must be between 1 and 2000 characters'),
];

router.get('/', getProductReviews);
router.get('/eligibility', authenticate, getReviewEligibility);
router.post('/', authenticate, reviewValidation, createReview);
router.get('/my-review', authenticate, getMyReview);
router.put('/:reviewId', authenticate, reviewValidation, updateReview);
router.delete('/:reviewId', authenticate, deleteReview);

export default router;