import mongoose from 'mongoose';
import Cart from '../models/cart.model.js';
import Product from '../models/product.model.js';

const isValidProductId = (value) => value && mongoose.Types.ObjectId.isValid(value);

const serializeCart = (cart) => ({
  _id: cart?._id,
  user: cart?.user,
  items: (cart?.items || []).map((item) => {
    const plainItem = item?.toObject ? item.toObject() : item;
    return {
      ...plainItem,
      product: plainItem.product ?? null,
      quantity: Number(plainItem.quantity || 0),
      price: Number(plainItem.price || 0),
    };
  }),
  createdAt: cart?.createdAt,
  updatedAt: cart?.updatedAt,
});

export const getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate('items.product');

    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    const cleanedItems = [];
    for (const item of cart.items || []) {
      if (!item?.product) continue;

      const productId = item.product._id || item.product;
      const product = await Product.findById(productId);
      if (!product || !product.isActive) continue;

      cleanedItems.push(item);
    }

    if (cleanedItems.length !== (cart.items || []).length) {
      cart.items = cleanedItems;
      await cart.save();
    }

    return res.status(200).json(serializeCart(cart));
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load cart' });
  }
};

export const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body || {};
    const nextQty = Number(quantity);

    if (!isValidProductId(productId)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    if (!Number.isInteger(nextQty) || nextQty < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ message: 'Product is unavailable' });
    }

    if (product.stock <= 0) {
      return res.status(409).json({ message: 'This product is currently out of stock.' });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    const existingItem = cart.items.find((item) => String(item.product) === String(productId));
    const totalQty = existingItem ? existingItem.quantity + nextQty : nextQty;

    if (totalQty > product.stock) {
      return res.status(409).json({ message: `Only ${product.stock} item(s) available in stock.` });
    }

    cart.addItem(productId, nextQty, product.price);
    await cart.save();

    return res.status(200).json(serializeCart(cart));
  } catch (error) {
    return res.status(500).json({ message: 'Failed to add product to cart' });
  }
};

export const updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body || {};
    const { productId } = req.params;
    const nextQty = Number(quantity);

    if (!isValidProductId(productId)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    if (!Number.isInteger(nextQty) || nextQty < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ message: 'Product is unavailable' });
    }

    if (product.stock <= 0) {
      return res.status(409).json({ message: 'This product is currently out of stock.' });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const item = cart.items.find((entry) => String(entry.product) === String(productId));
    if (!item) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    if (nextQty > product.stock) {
      return res.status(409).json({ message: `Only ${product.stock} item(s) available in stock.` });
    }

    item.quantity = nextQty;
    item.price = product.price;
    await cart.save();

    return res.status(200).json(serializeCart(cart));
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update cart item' });
  }
};

export const removeCartItem = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!isValidProductId(productId)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.removeItem(productId);
    await cart.save();

    return res.status(200).json(serializeCart(cart));
  } catch (error) {
    return res.status(500).json({ message: 'Failed to remove cart item' });
  }
};

export const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(200).json({ items: [] });
    }

    cart.items = [];
    await cart.save();
    return res.status(200).json(serializeCart(cart));
  } catch (error) {
    return res.status(500).json({ message: 'Failed to clear cart' });
  }
};