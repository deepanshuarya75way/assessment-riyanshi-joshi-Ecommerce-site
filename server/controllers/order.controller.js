import Order from '../models/order.model.js';
import Product from '../models/product.model.js';
import User from '../models/user.model.js';
import Cart from '../models/cart.model.js';
import Stripe from 'stripe';
import applyCoupon from '../utils/applyCoupon.js';

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-08-01',
}) : null;

const normalizeShippingAddress = (address) => {
  if (!address || typeof address !== 'object') return null;

  const requiredFields = ['fullName', 'phone', 'addressLine1', 'city', 'state', 'postalCode', 'country'];
  const normalized = {};

  for (const field of requiredFields) {
    const value = typeof address[field] === 'string' ? address[field].trim() : String(address[field] || '').trim();
    if (!value) return null;
    normalized[field] = value;
  }

  normalized.addressLine2 = typeof address.addressLine2 === 'string' ? address.addressLine2.trim() : '';
  return normalized;
};

const validateCartForOrder = async (cartItems) => {
  let total = 0;
  const validatedItems = [];
  const products = [];

  for (const item of cartItems || []) {
    if (!item || !item.product) {
      throw new Error('One or more cart items are missing a valid product.');
    }

    const productId = item.product._id || item.product;
    const quantity = Number(item.quantity || 0);

    if (!productId || !Number.isInteger(quantity) || quantity < 1) {
      throw new Error('One or more cart items have an invalid quantity.');
    }

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      throw new Error('One or more products are unavailable.');
    }

    if (product.stock < quantity) {
      throw new Error(`Only ${product.stock} item(s) remain for ${product.name}.`);
    }

    const trustedPrice = Number(product.price || 0);
    products.push(product);
    validatedItems.push({
      product: product._id,
      productName: product.name,
      productSlug: product.slug || '',
      quantity,
      price: trustedPrice,
      image: product.images?.[0] || '',
    });
    total += trustedPrice * quantity;
  }

  return { validatedItems, products, total };
};

export const ValidateCoupon = async (req, res)=> {
  try{
    const address = normalizeShippingAddress(req.body?.shippingAddress);
    if(!address) return res.status(400).json({message: 'Select a valid shipping address first.'});
    const cart = await Cart.findOne({user: req.user._id}).populate('items.product');
    if(!cart?.items?.length) return res.status(400).json({message:'Cart is empty'});
    const Validated = await validateCartForOrder(cart.items);
    const coupon = await applyCoupon(req.body?.couponCode, {
      userId: req.user._id, address, products:Validated.products , subtotal: Validated.total,
    });
    res.json({success: true, data: coupon});
  }catch(error){
    res.status(400).json({success: false, message: error.message});
  }
};

export const getUserOrders = async (req, res) => {
  try {
    const user = req.user;

    const orders = await Order.find({ user: user._id })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: orders.map((order) => ({
        _id: order._id,
        orderNumber: order.orderNumber,
        total: order.total,
        paymentStatus: order.paymentStatus,
        status: order.status,
        paymentProvider: order.paymentProvider,
        paidAt: order.paidAt,
        createdAt: order.createdAt,
      })),
    });
  } catch (error) {
    console.error('[order] Get user orders error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
    });
  }
};

export const getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .lean()
      .populate('user', 'fullName email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check ownership
    if (order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: This order does not belong to you',
      });
    }

    res.json({
      success: true,
      data: {
        _id: order._id,
        orderNumber: order.orderNumber,
        user: {
          fullName: order.user.fullName,
          email: order.user.email,
        },
        items: order.items.map((item) => ({
          product: item.product,
          productName: item.productName,
quantity: item.quantity,
          price: item.price,
          image: item.image,
        })),
        subtotal: order.subtotal ?? order.total,
        discount: order.discount || 0,
        couponCode: order.couponCode || '',
        total: order.total,
        paymentStatus: order.paymentStatus,
        paymentProvider: order.paymentProvider,
        paidAt: order.paidAt,
        status: order.status,
        shippingAddress: order.shippingAddress,
        createdAt: order.createdAt,
      },
    });
  } catch (error) {
    console.error('[order] Get order details error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order details',
    });
  }
};

export const createOrderFromCart = async (req, res) => {
  try {
    const user = req.user;
    const cart = await Cart.findOne({ user: user._id }).populate('items.product');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty',
      });
    }

    const shippingAddressFromRequest = normalizeShippingAddress(req.body?.shippingAddress);
    const userRecord = await User.findById(user._id);
    const fallbackAddress = normalizeShippingAddress(
      userRecord?.addresses?.find((address) => address.isDefault) || userRecord?.addresses?.[0]
    );

    const shippingAddress = shippingAddressFromRequest || fallbackAddress;
    if (!shippingAddress) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid shipping address before checkout.',
      });
    }

    let validatedOrder;
    try {
      validatedOrder = await validateCartForOrder(cart.items);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    let coupon;
    try{
      coupon = await applyCoupon(req.body?.couponCode, {
        userId: user._id,
        address: shippingAddress,
        products:validatedOrder.products,
        subtotal: validatedOrder.total,
      });
    }catch(error){
      return res.status(400).json({success:false, message: error.message});
    }
    const order = new Order({
      user: user._id,
      items: validatedOrder.validatedItems,
      subtotal: validatedOrder.total,
      discount: coupon.discount,
      couponCode: coupon.code,
      total: coupon.total,
      paymentStatus: 'pending',
      paymentProvider: 'stripe',
      status: 'pending',
      shippingAddress,
    });

    await order.save();
    await cart.deleteOne();

    return res.status(201).json({
      success: true,
      data: {
        order: {
          _id: order._id,
          orderNumber: order.orderNumber,
          total: order.total,
          discount: order.discount,
          couponCode: order.couponCode,
          paymentStatus: order.paymentStatus,
          status: order.status,
          shippingAddress: order.shippingAddress,
          createdAt: order.createdAt,
        },
      },
    });
  } catch (error) {
    console.error('[order] Create order from cart error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to create order',
    });
  }
};

export const createCheckoutSession = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({
        success: false,
        message: 'Stripe is not configured. Add STRIPE_SECRET_KEY before starting checkout.',
      });
    }

    const { orderId } = req.params;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: This order does not belong to you',
      });
    }

    if (order.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Order is already paid',
      });
    }

    const products =[];
    for (const item of order.items || []) {
      const product = await Product.findById(item.product);
      if (!product || !product.isActive) {
        return res.status(400).json({
          success: false,
          message: `Product ${item.productName} is no longer available.`,
        });
      }

      if (product.stock < item.quantity) {
        return res.status(409).json({
          success: false,
          message: `Only ${product.stock} item(s) remain for ${product.name}.`,
        });
      }

      item.price = Number(product.price || 0);
      products.push(product);
    }

    order.subtotal = order.items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0);
    
    let coupon;
    try{
      coupon = await applyCoupon(order.couponCode , {
        userId: order.user, address: order.shippingAddress, products, subtotal: order.subtotal,
      });
    }catch(error){
      return res.status(400).json ({success: false, message: error.message});
    }
    order.discount = coupon.discount;
    order.total = coupon.total;
    await order.save();

    const lineItems = order.discount ?[{
      price_data: {
        currency: 'usd',
        product_data: { name :`Order ${order.orderNumber}`, description : `Coupon ${order.couponCode} applied`},
        unit_amount:Math.round(order.total*100),
      },
      quantity:1,
    }] : order.items.map((item) => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.productName,
            description: item.productSlug || '',
            images: item.image ? [item.image] : [],
          },
          unit_amount: Math.round(Number(item.price || 0) * 100),
        },
        quantity: item.quantity,
      }));

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/order-success?session_id={CHECKOUT_SESSION_ID}&orderId=${order._id}`,
      cancel_url: `${process.env.CLIENT_URL}/checkout?cancelled=true`,
      metadata: {
        orderId: order._id.toString(),
        userId: order.user.toString(),
      },
      client_reference_id: order._id.toString(),
    });

    order.stripeSessionId = session.id;
    await order.save();

    return res.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('[payment] Create checkout session error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to create checkout session',
    });
  }
};

export const webhook = async (req, res) => {
  let event;

  try {
    if (!stripe) {
      return res.status(500).json({
        success: false,
        message: 'Stripe is not configured. Add STRIPE_SECRET_KEY before processing webhooks.',
      });
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      return res.status(500).json({
        success: false,
        message: 'Webhook secret is not configured.',
      });
    }

    const signature = req.headers['stripe-signature'];

    let rawBody;
    if (Buffer.isBuffer(req.body)) {
      rawBody = req.body.toString('utf8');
    } else {
      rawBody = JSON.stringify(req.body || {});
    }

    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('[webhook] Signature verification failed:', err.message);
    return res.status(400).json({ success: false, message: `Webhook error: ${err.message}` });
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;

      // Read order identifier from Stripe metadata
      const orderId = session.metadata?.orderId;
      const sessionId = session.id;

      if (!orderId) {
        console.error('[webhook] No orderId in session metadata');
        return res.status(400).json({ success: false, message: 'No order ID in metadata' });
      }

      // Find the corresponding order
      const order = await Order.findById(orderId);
      if (!order) {
        console.error('[webhook] Order not found:', orderId);
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      // Verify the Stripe session identifier
      if (order.stripeSessionId !== sessionId) {
        console.error('[webhook] Session ID mismatch:', order.stripeSessionId, sessionId);
        return res.status(400).json({ success: false, message: 'Session ID mismatch' });
      }

      // Check if order is already paid (idempotency)
      if (order.paymentStatus === 'paid') {
        console.log('[webhook] Order already paid, skipping');
        return res.json({ success: true, message: 'Order already paid' });
      }

      // Update payment status
      order.paymentStatus = 'paid';
      order.paymentProvider = 'stripe';
      order.paidAt = new Date();
      // Update order status to processing
      order.status = 'processing';

      await order.save();

      console.log('[webhook] Order payment confirmed:', order.orderNumber);
      break;
    }

    default:
      console.log(`[webhook] Unhandled event type: ${event.type}`);
  }

  res.json({ success: true });
};

export const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check ownership
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: This order does not belong to you',
      });
    }

    // Prevent cancellation of already processed orders
    if (order.status === 'shipped' || order.status === 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel an order that has already been shipped or delivered',
      });
    }

    // Prevent cancellation if already paid and processed
    if (order.paymentStatus === 'paid' && order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled after payment has been processed',
      });
    }

    order.status = 'cancelled';
    await order.save();

    res.json({
      success: true,
      data: {
        _id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
      },
    });
  } catch (error) {
    console.error('[order] Cancel order error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel order',
    });
  }
};

export default { createOrderFromCart, createCheckoutSession, webhook, cancelOrder };