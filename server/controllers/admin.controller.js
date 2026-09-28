import mongoose from 'mongoose';
import { validationResult } from 'express-validator';
import User from '../models/user.model.js';
import Product from '../models/product.model.js';
import Category from '../models/category.model.js';
import Order from '../models/order.model.js';
import Review from '../models/review.model.js';
import Coupon from '../models/coupon.model.js';

const normalizeSearchTerm = (value = '') => String(value).trim();

const getRegex = (term) => ({
  $regex: term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
  $options: 'i',
});

export const getDashboardOverview = async (req, res) => {
  try {
    const [
      totalProducts,
      totalOrders,
      totalUsers,
      revenueResult,
      pendingOrders,
      lowStockProducts,
      recentOrders,
    ] = await Promise.all([
      Product.countDocuments(),
      Order.countDocuments(),
      User.countDocuments(),
      Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, revenue: { $sum: '$total' } } },
      ]),
      Order.countDocuments({ status: 'pending' }),
      Product.countDocuments({ stock: { $lte: 10 } }),
      Order.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('user', 'fullName email')
        .lean(),
    ]);

    const revenue = revenueResult[0]?.revenue || 0;

    return res.status(200).json({
      success: true,
      data: {
        totalProducts,
        totalOrders,
        totalUsers,
        revenue: Number(revenue),
        pendingOrders,
        lowStockProducts,
        recentOrders: recentOrders.map((order) => ({
          _id: order._id,
          orderNumber: order.orderNumber,
          status: order.status,
          paymentStatus: order.paymentStatus,
          total: order.total,
          createdAt: order.createdAt,
          user: order.user
            ? {
                _id: order.user._id,
                fullName: order.user.fullName,
                email: order.user.email,
              }
            : null,
        })),
      },
    });
  } catch (error) {
    console.error('[admin] dashboard error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to load dashboard statistics',
    });
  }
};

export const getAdminProducts = async (req, res) => {
  try {
    const search = normalizeSearchTerm(req.query.search || '');
    const category = req.query.category || '';
    const status = req.query.status || 'all';
    const stockFilter = req.query.stockFilter || 'all';
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(50, Math.max(1, Number(req.query.limit || 20)));
    const skip = (page - 1) * limit;

    const filter = {};
    if (search) {
      filter.$or = [
        { name: getRegex(search) },
        { brand: getRegex(search) },
        { sku: getRegex(search) },
      ];
    }
    if (category) filter.category = category;
    if (status !== 'all') filter.isActive = status === 'active';
    if (stockFilter === 'low') filter.stock = { $lte: 10 };
    if (stockFilter === 'out') filter.stock = 0;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[admin] product list error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to load products',
    });
  }
};

export const createAdminProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const payload = req.body;
    const categoryExists = await Category.findById(payload.category);
    if (!categoryExists) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category selected',
      });
    }

    if (payload.sku) {
      const skuExists = await Product.findOne({ sku: payload.sku });
      if (skuExists) {
        return res.status(409).json({
          success: false,
          message: 'A product with this SKU already exists',
        });
      }
    }

    const product = await Product.create({
      ...payload,
      images: Array.isArray(payload.images) ? payload.images : [],
      createdBy: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product,
    });
  } catch (error) {
    console.error('[admin] create product error:', error.message);
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'record';
      return res.status(409).json({
        success: false,
        message: `A product with this ${field} already exists`,
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to create product',
    });
  }
};

export const updateAdminProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    if (req.body.category) {
      const categoryExists = await Category.findById(req.body.category);
      if (!categoryExists) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category selected',
        });
      }
    }

    if (req.body.sku && req.body.sku !== product.sku) {
      const skuExists = await Product.findOne({ sku: req.body.sku });
      if (skuExists) {
        return res.status(409).json({
          success: false,
          message: 'A product with this SKU already exists',
        });
      }
    }

    const allowedUpdates = [
      'name',
      'description',
      'price',
      'compareAtPrice',
      'images',
      'category',
      'brand',
      'stock',
      'sku',
      'isActive',
    ];

    for (const field of allowedUpdates) {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    }

    await product.save();

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product,
    });
  } catch (error) {
    console.error('[admin] update product error:', error.message);
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'record';
      return res.status(409).json({
        success: false,
        message: `A product with this ${field} already exists`,
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to update product',
    });
  }
};

export const deleteAdminProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    await Product.findByIdAndDelete(product._id);

    return res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('[admin] delete product error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete product',
    });
  }
};

export const getAdminCategories = async (req, res) => {
  try {
    const categories = await Category.find({}).sort({ name: 1 }).lean();
    return res.status(200).json({
      success: true,
      categories,
      count: categories.length,
    });
  } catch (error) {
    console.error('[admin] category list error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to load categories',
    });
  }
};

export const createAdminCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const category = await Category.create(req.body);
    return res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category,
    });
  } catch (error) {
    console.error('[admin] create category error:', error.message);
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A category with this name already exists',
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to create category',
    });
  }
};

export const updateAdminCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    const { name, description, image, isActive } = req.body;
    if (name && name !== category.name) {
      const existing = await Category.findOne({ name });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'A category with this name already exists',
        });
      }
    }

    if (name !== undefined) category.name = name;
    if (description !== undefined) category.description = description;
    if (image !== undefined) category.image = image;
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();

    return res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      category,
    });
  } catch (error) {
    console.error('[admin] update category error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to update category',
    });
  }
};

export const deleteAdminCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    const productCount = await Product.countDocuments({ category: category._id });
    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category because ${productCount} product(s) still use it.`,
      });
    }

    await Category.findByIdAndDelete(category._id);

    return res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    console.error('[admin] delete category error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete category',
    });
  }
};

export const getAdminOrders = async (req, res) => {
  try {
    const search = normalizeSearchTerm(req.query.search || '');
    const status = req.query.status || 'all';
    const paymentStatus = req.query.paymentStatus || 'all';

    const filter = {};
    if (search) {
      filter.$or = [
        { orderNumber: getRegex(search) },
        { 'shippingAddress.fullName': getRegex(search) },
        { 'shippingAddress.phone': getRegex(search) },
      ];
    }
    if (status !== 'all') filter.status = status;
    if (paymentStatus !== 'all') filter.paymentStatus = paymentStatus;

    const orders = await Order.find(filter)
      .populate('user', 'fullName email')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      orders: orders.map((order) => ({
        ...order,
        user: order.user
          ? {
              _id: order.user._id,
              fullName: order.user.fullName,
              email: order.user.email,
            }
          : null,
      })),
    });
  } catch (error) {
    console.error('[admin] order list error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to load orders',
    });
  }
};

export const getAdminOrderDetails = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID',
      });
    }

    const order = await Order.findById(req.params.id)
      .populate('user', 'fullName email phone')
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    return res.status(200).json({
      success: true,
      order: {
        ...order,
        user: order.user
          ? {
              _id: order.user._id,
              fullName: order.user.fullName,
              email: order.user.email,
              phone: order.user.phone,
            }
          : null,
      },
    });
  } catch (error) {
    console.error('[admin] order details error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to load order details',
    });
  }
};

export const updateAdminOrderStatus = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    order.status = req.body.status;
    await order.save();

    return res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      order,
    });
  } catch (error) {
    console.error('[admin] update order error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to update order status',
    });
  }
};

export const getAdminReviews = async (req, res) => {
  try {
    const search = normalizeSearchTerm(req.query.search || '');
    const filter = {};

    if (search) {
      filter.$or = [
        { title: getRegex(search) },
        { comment: getRegex(search) },
      ];
    }

    const reviews = await Review.find(filter)
      .populate('user', 'fullName email')
      .populate('product', 'name')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      reviews: reviews.map((review) => ({
        ...review,
        user: review.user
          ? {
              _id: review.user._id,
              fullName: review.user.fullName,
              email: review.user.email,
            }
          : null,
        product: review.product
          ? {
              _id: review.product._id,
              name: review.product.name,
            }
          : null,
      })),
    });
  } catch (error) {
    console.error('[admin] review list error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to load reviews',
    });
  }
};

export const deleteAdminReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    await Review.findByIdAndDelete(review._id);

    const product = await Product.findById(review.product);
    if (product) {
      const productReviews = await Review.find({ product: product._id });
      const totalRating = productReviews.reduce((sum, item) => sum + Number(item.rating || 0), 0);
      const nextCount = productReviews.length;
      product.numReviews = nextCount;
      product.rating = nextCount ? Number((totalRating / nextCount).toFixed(1)) : 0;
      await product.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Review removed successfully',
    });
  } catch (error) {
    console.error('[admin] review delete error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to remove review',
    });
  }
};

export const getAdminUsers = async (req, res) => {
  try {
    const search = normalizeSearchTerm(req.query.search || '');
    const role = req.query.role || 'all';
    const status = req.query.status || 'all';

    const filter = {};
    if (search) {
      filter.$or = [
        { fullName: getRegex(search) },
        { email: getRegex(search) },
        { username: getRegex(search) },
      ];
    }
    if (role !== 'all') filter.role = role;
    if (status !== 'all') filter.isActive = status === 'active';

    const users = await User.find(filter)
      .select('+isActive -password')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    console.error('[admin] user list error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to load users',
    });
  }
};

export const updateAdminUserStatus = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    if (String(req.params.id) === String(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own admin account.',
      });
    }

    const user = await User.findById(req.params.id).select('+isActive -password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.isActive = req.body.isActive;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'User status updated successfully',
      user,
    });
  } catch (error) {
    console.error('[admin] user status error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to update user status',
    });
  }
};

const couponFields = (body) => ({
  code: String(body.code ||'').trim().toUpperCase(),
  discountPercent: Number(body.discountPercent),
  regions: Array.isArray(body.regions) ? body.regions.map((item) => String(item).trim()).filter(Boolean) : [],
  categories:  Array.isArray(body.categories) ? body.categories : [],
  users: Array.isArray(body.users) ? body.users :[],
  isActive : body.isActive !== false,
})

export const getAdminCoupons = async (req, res) => {
  const coupons = await Coupon.find().populate('categories', 'name').populate('users', 'fullName email').sort({createdAt:-1});
  res.json({ success: true, coupons});
}

export const createAdminCoupon = async (req, res) =>{
  try {
    const coupon = await Coupon.create(couponFields(req.body));
    res.status(201).json({success: true, coupon});
  }catch(error){
    res.status(error.code === 11000 ? 409 : 400).json({message : error.code === 11000 ? 'Coupon code already exists.' : error.message});

  }
};

export const updateAdminCoupon = async (req, res)=>{
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, couponFields(req.body), {new: true, runValidators: true});
    if(!coupon) return res.status(404).json({message: 'Coupon not found'});
    res.json({ success: true, coupon});
  }catch (error){
    res.status(error.code === 11000 ? 409 : 400).json({message: error.code === 11000 ? 'Coupon code already exists.' : error.message})
  }
}