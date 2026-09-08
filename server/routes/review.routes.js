import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  createReview,
  getProductReviews,
  getMyReview,
  updateReview,
  deleteReview,
} from '../controllers/review.controller.js';

const router = Router();

// Validation for create review
const reviewValidation = [
  body('rating')
    .notEmpty()
    .withMessage('Rating is required')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('title')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Title must be at most 100 characters'),
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Comment must be at most 2000 characters'),
];

router.get('/:productId/reviews', getProductReviews);
router.post(
  '/:productId/reviews',
  authenticate,
  reviewValidation,
  createReview
);
router.get('/:productId/my-review', authenticate, getMyReview);
router.put(
  '/:reviewId',
  authenticate,
  reviewValidation,
  updateReview
);
router.delete('/:reviewId', authenticate, deleteReview);

export default router;