import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  productName: {
    type: String,
    required: true,
    trim: true,
  },
  productSlug: {
    type: String,
    trim: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative'],
  },
  image: {
    type: String,
    trim: true,
  },
}, { _id: false });

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [orderItemSchema],
    total: {
      type: Number,
      required: [true, 'Order total is required'],
      min: [0, 'Total cannot be negative'],
    },
    subtotal:{type: Number, min:0},
    discount:{type: Number, default:0, min:0},
    couponCode:{type: String, default:'', trim: true},
    
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentProvider: {
      type: String,
      enum: ['stripe'],
      default: 'stripe',
    },
    stripeSessionId: {
      type: String,
      default: '',
    },
    paidAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    shippingAddress: {
      fullName: {
        type: String,
        trim: true,
      },
      phone: {
        type: String,
        trim: true,
      },
      addressLine1: {
        type: String,
        trim: true,
      },
      addressLine2: {
        type: String,
        trim: true,
      },
      city: {
        type: String,
        trim: true,
      },
      state: {
        type: String,
        trim: true,
      },
      postalCode: {
        type: String,
        trim: true,
      },
      country: {
        type: String,
        trim: true,
      },
    },
    orderNumber: {
      type: String,
      unique: true,
    },
  },
  { timestamps: true }
);

orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = String(Math.floor(Math.random() * 8999 + 1000));
    this.orderNumber = `ORD-${year}${month}${day}-${random}`;
  }
  next();
});

const Order = mongoose.model('Order', orderSchema);

export default Order;