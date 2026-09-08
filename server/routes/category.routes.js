import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js';
import {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from '../controllers/category.controller.js';

const router = Router();

const categoryValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ max: 100 })
    .withMessage('Category name must be at most 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be at most 500 characters'),
  body('image')
    .optional()
    .trim(),
];

router.get('/', getCategories);
router.get('/:id', getCategoryById);
router.post('/', authenticate, authorizeRoles('admin'), categoryValidation, createCategory);
router.put('/:id', authenticate, authorizeRoles('admin'), categoryValidation, updateCategory);
router.delete('/:id', authenticate, authorizeRoles('admin'), deleteCategory);

export default router;
