const Cart = require("../models/cart.model");
const Product = require("../models/product.model");

exports.getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate("items.product");
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
      await cart.save();
    }
    res.json(cart);
  } catch (error) {
    next(error);
  }
};

exports.addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });
    if (!product.isActive) return res.status(404).json({ message: "Product is not active" });
    if (product.stock < quantity) return res.status(409).json({ message: "Insufficient stock" });

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id });
    }

    cart.addItem(productId, quantity, product.price);
    await cart.save();

    res.json(cart);
  } catch (error) {
    next(error);
  }
};

exports.updateCartItem = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const { productId } = req.params;

    if (quantity < 1) return res.status(400).json({ message: "Quantity must be at least 1" });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });
    if (!product.isActive) return res.status(404).json({ message: "Product is not active" });
    if (product.stock < quantity) return res.status(409).json({ message: "Insufficient stock" });

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const success = cart.updateItemQuantity(productId, quantity);
    if (!success) return res.status(404).json({ message: "Cart item not found" });

    await cart.save();
    res.json(cart);
  } catch (error) {
    next(error);
  }
};

exports.removeCartItem = async (req, res, next) => {
  try {
    const { productId } = req.params;

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.removeItem(productId);
    await cart.save();

    res.json(cart);
  } catch (error) {
    next(error);
  }
};

exports.clearCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOneAndDelete({ user: req.user._id });
    if (!cart) return res.json({ message: "Cart already empty", items: [] });
    res.json({ message: "Cart cleared", items: [] });
  } catch (error) {
    next(error);
  }
};