const Wishlist = require("../models/wishlist.model");
const Product = require("../models/product.model");

exports.getWishlist = async (req, res, next) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user._id }).populate("products.product");
    if (!wishlist) {
      wishlist = new Wishlist({ user: req.user._id, products: [] });
      await wishlist.save();
    }
    res.json(wishlist);
  } catch (error) {
    next(error);
  }
};

exports.addToWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });
    if (!product.isActive) return res.status(404).json({ message: "Product is not active" });

    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      wishlist = new Wishlist({ user: req.user._id });
    }

    wishlist.addProduct(productId);
    await wishlist.save();

    res.json(wishlist);
  } catch (error) {
    next(error);
  }
};

exports.removeFromWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;

    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) return res.status(404).json({ message: "Wishlist not found" });

    wishlist.removeProduct(productId);
    await wishlist.save();

    res.json(wishlist);
  } catch (error) {
    next(error);
  }
};

exports.clearWishlist = async (req, res, next) => {
  try {
    let wishlist = await Wishlist.findOneAndDelete({ user: req.user._id });
    if (!wishlist) return res.json({ message: "Wishlist already empty", products: [] });
    res.json({ message: "Wishlist cleared", products: [] });
  } catch (error) {
    next(error);
  }
};