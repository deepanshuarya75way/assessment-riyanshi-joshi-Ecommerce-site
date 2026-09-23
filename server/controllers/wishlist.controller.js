import mongoose from 'mongoose';
import Wishlist from '../models/wishlist.model.js';
import Product from '../models/product.model.js';

const isValidProductId = (value) => value && mongoose.Types.ObjectId.isValid(value);

const serializeWishlist = (wishlist) => ({
  _id: wishlist?._id,
  user: wishlist?.user,
  products: (wishlist?.products || []).map((productItem) => ({
    ...((productItem?.toObject ? productItem.toObject() : productItem) || {}),
  })),
  createdAt: wishlist?.createdAt,
  updatedAt: wishlist?.updatedAt,
});

export const getWishlist = async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user._id }).populate('products.product');

    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user._id, products: [] });
    }

    const cleanedProducts = [];
    for (const productItem of wishlist.products || []) {
      if (!productItem?.product) continue;

      const productId = productItem.product._id || productItem.product;
      const product = await Product.findById(productId);
      if (!product || !product.isActive) continue;

      cleanedProducts.push(productItem);
    }

    if (cleanedProducts.length !== (wishlist.products || []).length) {
      wishlist.products = cleanedProducts;
      await wishlist.save();
    }

    return res.status(200).json(serializeWishlist(wishlist));
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load wishlist' });
  }
};

export const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body || {};

    if (!isValidProductId(productId)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ message: 'Product is unavailable' });
    }

    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      wishlist = new Wishlist({ user: req.user._id, products: [] });
    }

    if (wishlist.hasProduct(productId)) {
      return res.status(200).json(serializeWishlist(wishlist));
    }

    wishlist.addProduct(productId);
    await wishlist.save();

    return res.status(200).json(serializeWishlist(wishlist));
  } catch (error) {
    return res.status(500).json({ message: 'Failed to add product to wishlist' });
  }
};

export const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!isValidProductId(productId)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      return res.status(404).json({ message: 'Wishlist not found' });
    }

    wishlist.removeProduct(productId);
    await wishlist.save();

    return res.status(200).json(serializeWishlist(wishlist));
  } catch (error) {
    return res.status(500).json({ message: 'Failed to remove wishlist item' });
  }
};

export const clearWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      return res.status(200).json({ products: [] });
    }

    wishlist.products = [];
    await wishlist.save();
    return res.status(200).json(serializeWishlist(wishlist));
  } catch (error) {
    return res.status(500).json({ message: 'Failed to clear wishlist' });
  }
};