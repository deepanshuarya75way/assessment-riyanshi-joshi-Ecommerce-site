import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js';
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from '../controllers/product.controller.js';
import reviewRouter from './review.routes.js';

const router = Router();

const productValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ max: 200 })
    .withMessage('Product name must be at most 200 characters'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Product description is required')
    .isLength({ max: 5000 })
    .withMessage('Description must be at most 5000 characters'),
  body('price')
    .notEmpty()
    .withMessage('Price is required')
    .isFloat({ min: 0 })
    .withMessage('Price must be at least 0'),
  body('stock')
    .notEmpty()
    .withMessage('Stock is required')
    .isInt({ min: 0 })
    .withMessage('Stock must be at least 0'),
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required'),
  body('compareAtPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Compare at price must be at least 0'),
  body('brand')
    .optional()
    .trim(),
  body('sku')
    .optional()
    .trim(),
  body('images')
    .optional()
    .isArray(),
  body('isActive')
    .optional()
    .isBoolean(),
];

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', authenticate, authorizeRoles('admin'), productValidation, createProduct);
router.put('/:id', authenticate, authorizeRoles('admin'), updateProduct);
router.delete('/:id', authenticate, authorizeRoles('admin'), deleteProduct);

router.use('/:productId/reviews', reviewRouter);

export default router;
