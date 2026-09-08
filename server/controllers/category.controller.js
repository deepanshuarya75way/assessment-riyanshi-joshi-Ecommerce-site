import { validationResult } from 'express-validator';
import Category from '../models/category.model.js';
import Product from '../models/product.model.js';

export const createCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { name, description, image } = req.body;

    const existing = await Category.findOne({ name });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A category with this name already exists',
      });
    }

    const category = await Category.create({ name, description, image });

    return res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category,
    });
  } catch (error) {
    console.error('[category] create error:', error.message);
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

export const getCategories = async (req, res) => {
  try {
    const filter = req.user?.role === 'admin' ? {} : { isActive: true };
    const categories = await Category.find(filter).sort({ name: 1 });

    return res.status(200).json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
    });
  }
};

export const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    return res.status(200).json({
      success: true,
      category,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch category',
    });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { name, description, image, isActive } = req.body;

    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

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
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A category with this name already exists',
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to update category',
    });
  }
};

export const deleteCategory = async (req, res) => {
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
        message: `Cannot delete category. ${productCount} product(s) still use this category.`,
      });
    }

    await Category.findByIdAndDelete(category._id);

    return res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete category',
    });
  }
};
