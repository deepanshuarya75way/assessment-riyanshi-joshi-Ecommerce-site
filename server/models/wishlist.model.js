import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const wishlistItemSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
}, { _id: false });

const wishlistSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    products: [wishlistItemSchema],
  },
  { timestamps: true }
);

wishlistSchema.methods.hasProduct = function (productId) {
  return this.products.some((item) => item.product.equals(productId));
};

wishlistSchema.methods.addProduct = function (productId) {
  if (!this.hasProduct(productId)) {
    this.products.push({ product: productId });
  }
};

wishlistSchema.methods.removeProduct = function (productId) {
  this.products = this.products.filter((item) => !item.product.equals(productId));
};

const Wishlist = mongoose.model('Wishlist', wishlistSchema);

export default Wishlist;