import Order from '../models/order.model.js';
import Product from '../models/product.model.js';
import Cart from '../models/cart.model.js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-08-01',
});

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

    // Get user's cart
    const cart = await Cart.findOne({ user: user._id }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty',
      });
    }

    // Build order items from cart
    const items = cart.items.map((item) => ({
      product: item.product._id,
      productName: item.product.name,
      productSlug: item.product.slug || '',
      quantity: item.quantity,
      price: item.price,
      image: item.product.images?.[0] || '',
    }));

    // Calculate total from server-side data (trusted)
    const total = cart.items.reduce(
      (acc, item) => acc + (item.price || 0) * (item.quantity || 1),
      0
    );

    // Shipping address from request body (optional - Phase 5 support)
    const shippingAddress = req.body.shippingAddress || undefined;

    // Create order
    const order = new Order({
      user: user._id,
      items,
      total,
      paymentStatus: 'pending',
      paymentProvider: 'stripe',
      status: 'pending',
      shippingAddress,
    });

    await order.save();

    // Clear cart
    await cart.deleteOne();

    res.status(201).json({
      success: true,
      data: {
        order: {
          _id: order._id,
          orderNumber: order.orderNumber,
          total: order.total,
          paymentStatus: order.paymentStatus,
          status: order.status,
          shippingAddress: order.shippingAddress,
          createdAt: order.createdAt,
        },
      },
    });
  } catch (error) {
    console.error('[order] Create order from cart error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
    });
  }
};

export const createCheckoutSession = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Find order and validate ownership
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check authentication - order belongs to authenticated user
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: This order does not belong to you',
      });
    }

    // Validate order is payable
    if (order.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Order is already paid',
      });
    }

    if (order.paymentStatus === 'failed') {
      // Option: allow retry or block - we'll allow retry but mark clearly
      // For now, check if we should allow
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: order.items.map((item) => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.productName,
            description: item.productSlug || '',
            images: item.image ? [item.image] : [],
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/order-success?session_id={CHECKOUT_SESSION_ID}&orderId=${order._id}`,
      cancel_url: `${process.env.CLIENT_URL}/cart?cancelled=true`,
      metadata: {
        orderId: order._id.toString(),
        userId: order.user.toString(),
      },
      client_reference_id: order._id.toString(),
    });

    // Update order with Stripe session ID
    order.stripeSessionId = session.id;
    await order.save();

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('[payment] Create checkout session error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to create checkout session',
    });
  }
};

export const webhook = async (req, res) => {
  let event;

  try {
    // Verify Stripe webhook signature
    const signature = req.headers['stripe-signature'];

    let rawBody;
    if (Buffer.isBuffer(req.body)) {
      rawBody = req.body.toString('utf8');
    } else {
      rawBody = JSON.stringify(req.body);
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