import { validationResult } from 'express-validator';
import Review from '../models/review.model.js';
import Product from '../models/product.model.js';
import Order from '../models/order.model.js';

export const createReview = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { rating, title, comment } = req.body;
    const productId = req.params.productId;
    const user = req.user;

    // Find product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Verify purchase: find an order for this user that contains this product
    const order = await Order.findOne({
      user: user._id,
      'items.product': productId,
      paymentStatus: 'paid',
    }).lean();

    if (!order) {
      return res.status(403).json({
        success: false,
        message: 'You must purchase this product before reviewing it',
      });
    }

    // Prevent duplicate review
    const existingReview = await Review.findOne({ product: productId, user: user._id });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product',
      });
    }

    // Create review
    const review = await Review.create({
      user: user._id,
      product: productId,
      order: order._id,
      rating,
      title,
      comment,
    });

    // Recalculate product rating
    await recalculateProductRating(productId);

    return res.status(201).json({
      success: true,
      message: 'Review created successfully',
      review,
    });
  } catch (error) {
    console.error('[review] Create review error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to create review',
    });
  }
};

export const getProductReviews = async (req, res) => {
  try {
    const productId = req.params.productId;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // Only show approved reviews (or all if you want)
    const filter = { product: productId };

    const totalReviews = await Review.countDocuments(filter);
    const reviews = await Review.find(filter)
      .populate('user', 'fullName username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      reviews,
      currentPage: page,
      totalPages: Math.ceil(totalReviews / limit),
      totalReviews,
    });
  } catch (error) {
    console.error('[review] Get product reviews error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews',
    });
  }
};

export const getMyReview = async (req, res) => {
  try {
    const productId = req.params.productId;
    const user = req.user;

    const review = await Review.findOne({ product: productId, user: user._id }).select(
      'rating title comment isApproved'
    );

    if (!review) {
      return res.status(200).json({
        success: true,
        reviewed: false,
      });
    }

    return res.status(200).json({
      success: true,
      reviewed: true,
      review,
    });
  } catch (error) {
    console.error('[review] Get my review error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch your review',
    });
  }
};

export const updateReview = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { rating, title, comment } = req.body;
    const { reviewId } = req.params;
    const user = req.user;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    // Check ownership
    if (review.user.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You can only update your own review',
      });
    }

    // Update fields
    if (rating !== undefined) {
      review.rating = rating;
    }
    if (title !== undefined) {
      review.title = title;
    }
    if (comment !== undefined) {
      review.comment = comment;
    }

    await review.save();

    // Recalculate product rating
    await recalculateProductRating(review.product);

    return res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      review,
    });
  } catch (error) {
    console.error('[review] Update review error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to update review',
    });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const user = req.user;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    // Check ownership
    if (review.user.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You can only delete your own review',
      });
    }

    const productId = review.product;

    await Review.findByIdAndDelete(reviewId);

    // Recalculate product rating
    await recalculateProductRating(productId);

    return res.status(200).json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    console.error('[review] Delete review error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete review',
    });
  }
};

const recalculateProductRating = async (productId) => {
  const reviews = await Review.find({ product: productId, isApproved: true });

  if (reviews.length === 0) {
    await Product.findByIdAndUpdate(productId, {
      rating: 0,
      numReviews: 0,
    });
    return;
  }

  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = totalRating / reviews.length;

  await Product.findByIdAndUpdate(productId, {
    rating: averageRating,
    numReviews: reviews.length,
  });
};