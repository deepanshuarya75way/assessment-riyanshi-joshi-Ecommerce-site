import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js';
import {
  getDashboardOverview,
  getAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  getAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
  getAdminOrders,
  getAdminOrderDetails,
  updateAdminOrderStatus,
  getAdminReviews,
  deleteAdminReview,
  getAdminUsers,
  updateAdminUserStatus,
  getAdminCoupons,
  createAdminCoupon,
  updateAdminCoupon,
} from '../controllers/admin.controller.js';

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
  body('brand').optional().trim(),
  body('sku').optional().trim(),
  body('images').optional().isArray(),
  body('isActive').optional().isBoolean(),
];

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
  body('image').optional().trim(),
  body('isActive').optional().isBoolean(),
];

const orderStatusValidation = [
  body('status')
    .trim()
    .notEmpty()
    .withMessage('Order status is required')
    .isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Invalid order status'),
];

const userStatusValidation = [
  body('isActive').isBoolean().withMessage('User active flag must be a boolean'),
];

router.use(authenticate, authorizeRoles('admin'));

router.get('/dashboard', getDashboardOverview);

router.get('/products', getAdminProducts);
router.post('/products', productValidation, createAdminProduct);
router.put('/products/:id', productValidation, updateAdminProduct);
router.delete('/products/:id', deleteAdminProduct);

router.get('/categories', getAdminCategories);
router.post('/categories', categoryValidation, createAdminCategory);
router.put('/categories/:id', categoryValidation, updateAdminCategory);
router.delete('/categories/:id', deleteAdminCategory);

router.get('/orders', getAdminOrders);
router.get('/orders/:id', getAdminOrderDetails);
router.put('/orders/:id/status', orderStatusValidation, updateAdminOrderStatus);

router.get('/reviews', getAdminReviews);
router.delete('/reviews/:id', deleteAdminReview);

router.get('/users', getAdminUsers);
router.put('/users/:id/status', userStatusValidation, updateAdminUserStatus);

router.get('/coupons', getAdminCoupons);
router.post('/coupons', createAdminCoupon);
router.put('/coupons/:id', updateAdminCoupon);

export default router;
