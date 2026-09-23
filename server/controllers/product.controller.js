import { validationResult } from 'express-validator';
import Product from '../models/product.model.js';
import Category from '../models/category.model.js';

export const createProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const {
      name, description, price, compareAtPrice, images,
      category, brand, stock, sku, isActive,
    } = req.body;

    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category',
      });
    }

    if (sku) {
      const existingSku = await Product.findOne({ sku });
      if (existingSku) {
        return res.status(409).json({
          success: false,
          message: 'A product with this SKU already exists',
        });
      }
    }

    const product = await Product.create({
      name,
      description,
      price,
      compareAtPrice,
      images,
      category,
      brand,
      stock,
      sku,
      isActive,
      createdBy: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product,
    });
  } catch (error) {
    console.error('[product] create error:', error.message);
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
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

export const getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      category,
      minPrice,
      maxPrice,
      sort,
      brand,
      minRating,
      discounted,
      inStock,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    const filter = { isActive: true };

    if (search) {
      filter.$text = { $search: search };
    }

    if (category) {
      filter.category = category;
    }

    if (brand) {
      filter.brand = brand;
    }

    if (discounted === 'true') {
      filter.$expr = { $gt: ['$compareAtPrice', '$price'] };
    }

    if (inStock === 'true') {
      filter.stock = { $gt: 0 };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
    }

    if (minRating !== undefined) {
      filter.rating = {};
      filter.rating.$gte = Number(minRating);
    }

    let sortOption = { createdAt: -1 };
    switch (sort) {
      case 'price_asc':
        sortOption = { price: 1 };
        break;
      case 'price_desc':
        sortOption = { price: -1 };
        break;
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'rating':
        sortOption = { rating: -1 };
        break;
    }

    const totalProducts = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .populate('category', 'name slug')
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);

    return res.status(200).json({
      success: true,
      products,
      currentPage: pageNum,
      totalPages: Math.ceil(totalProducts / limitNum),
      totalProducts,
      limit: limitNum,
    });
  } catch (error) {
    console.error('[product] list error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
    });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name slug')
      .populate('createdBy', 'fullName username');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    return res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
    });
  }
};

export const updateProduct = async (req, res) => {
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
          message: 'Invalid category',
        });
      }
    }

    if (req.body.sku && req.body.sku !== product.sku) {
      const existingSku = await Product.findOne({ sku: req.body.sku });
      if (existingSku) {
        return res.status(409).json({
          success: false,
          message: 'A product with this SKU already exists',
        });
      }
    }

    const allowedUpdates = [
      'name', 'description', 'price', 'compareAtPrice', 'images',
      'category', 'brand', 'stock', 'sku', 'isActive',
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
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
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

export const deleteProduct = async (req, res) => {
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
    return res.status(500).json({
      success: false,
      message: 'Failed to delete product',
    });
  }
};
