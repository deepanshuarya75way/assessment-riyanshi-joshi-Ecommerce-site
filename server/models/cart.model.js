import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const cartItemSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
}, { _id: false });

const cartSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    items: [cartItemSchema],
  },
  { timestamps: true }
);

cartSchema.methods.hasProduct = function (productId) {
  return this.items.some((item) => item.product.equals(productId));
};

cartSchema.methods.addItem = function (productId, quantity, price) {
  if (this.hasProduct(productId)) {
    const item = this.items.find((item) => item.product.equals(productId));
    item.quantity += quantity;
  } else {
    this.items.push({ product: productId, quantity, price });
  }
};

cartSchema.methods.removeItem = function (productId) {
  this.items = this.items.filter((item) => !item.product.equals(productId));
};

cartSchema.methods.updateItemQuantity = function (productId, quantity) {
  if (quantity < 1) return false;
  const item = this.items.find((item) => item.product.equals(productId));
  if (!item) return false;
  item.quantity = quantity;
  return true;
};

const Cart = mongoose.model('Cart', cartSchema);

export default Cart;