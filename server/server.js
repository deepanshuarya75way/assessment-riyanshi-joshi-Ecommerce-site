import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB from './config/db.js';
import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import categoryRoutes from './routes/category.routes.js';
import productRoutes from './routes/product.routes.js';
import cartRoutes from './routes/cart.routes.js';
import wishlistRoutes from './routes/wishlist.routes.js';
import orderRoutes from './routes/order.routes.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';

const app = express();
const isProduction = process.env.NODE_ENV === 'production';

const requiredProductionVariables = ['MONGO_URI', 'JWT_SECRET', 'CLIENT_URL', 'STRIPE_SECRET_KEY'];
if (isProduction) {
  const missingVariables = requiredProductionVariables.filter((name) => !process.env[name]);
  if (missingVariables.length) {
    throw new Error(`Missing required production environment variables: ${missingVariables.join(', ')}`);
  }
}

const allowedOrigins = isProduction
  ? [process.env.CLIENT_URL].filter(Boolean)
  : [
      process.env.CLIENT_URL,
      'http://localhost:4173',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://127.0.0.1:4173',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
    ].filter(Boolean);

app.disable('x-powered-by');
app.set('trust proxy', isProduction ? 1 : false);
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (isProduction) res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use('/api/orders/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '20kb' }));
app.use(cookieParser());

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/orders', orderRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();
  } catch (error) {
    console.error('[server] Shutting down because the database connection failed.');
    process.exit(1);
  }

  const server = app.listen(PORT, () => {
    console.log(`[server] Ecommerce-Site API is running on http://localhost:${PORT}`);
  });

  const shutdown = (signal) => {
    console.log(`[server] Received ${signal}. Closing HTTP server.`);
    server.close(() => process.exit(0));
  };

  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
}

startServer();
