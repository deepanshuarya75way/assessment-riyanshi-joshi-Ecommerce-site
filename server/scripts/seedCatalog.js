import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/user.model.js';
import Category from '../models/category.model.js';
import Product from '../models/product.model.js';
import Review from '../models/review.model.js';
import Order from '../models/order.model.js';

const DEMO_CONFIRMATION = 'SEED_DEMO_DATA';

const categoriesSeed = [
  { name: 'Electronics', description: 'Smart devices and everyday tech essentials.' },
  { name: 'Fashion', description: 'Modern apparel and accessories for daily wear.' },
  { name: 'Home & Living', description: 'Comfort-driven pieces for lifestyle and interiors.' },
  { name: 'Beauty', description: 'Skin, wellness, and everyday self-care essentials.' },
  { name: 'Wellness', description: 'Functional wellness products for healthier routines.' },
];

const productsSeed = [
  ['Aero Wireless Headphones', 'Immersive wireless headphones with active noise cancellation and all-day battery life.', 179.99, 229.99, 'Electronics', 'Aero', 18, 'AERO-HP-001', 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=900&q=80'],
  ['Luma Smart Watch', 'Track steps, sleep, workouts, and notifications in a lightweight smartwatch design.', 219, 269, 'Electronics', 'Luma', 22, 'LUMA-WT-002', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80'],
  ['Terra Coffee Maker', 'Brew flavorful coffee with a compact design and programmable timer for busy mornings.', 109.5, 149, 'Home & Living', 'Terra', 31, 'TERRA-COF-011', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80'],
  ['Harbor Throw Blanket', 'Soft brushed texture and a cozy feel designed for chill evenings and sofa lounging.', 54, 79, 'Home & Living', 'Harbor', 42, 'HARBOR-BLANKET-021', 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80'],
  ['Summit Performance Jacket', 'Weather-ready outerwear with a lightweight build and tailored fit for active days.', 139, 189, 'Fashion', 'Summit', 26, 'SUMMIT-JKT-031', 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80'],
  ['Northline Leather Tote', 'Structured everyday tote that balances style, durability, and enough room for essentials.', 94, 129, 'Fashion', 'Northline', 24, 'NORTHLINE-TOTE-041', 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=80'],
  ['Velvet Glow Serum', 'Hydrating facial serum infused with antioxidants to support a healthy, radiant glow.', 42, 58, 'Beauty', 'Velvet', 53, 'VELVET-SERUM-051', 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=900&q=80'],
  ['PureMist Facial Roller', 'Cooling facial roller for a refreshed skincare routine.', 24, 36, 'Beauty', 'PureMist', 65, 'PURMIST-ROLL-061', 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=900&q=80'],
  ['Flow Flex Yoga Mat', 'Non-slip yoga mat with cushioned support for mindful movement and daily workouts.', 49.99, 69.99, 'Wellness', 'Flow', 38, 'FLOW-MAT-071', 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=80'],
  ['Nova Air Purifier', 'Compact air purifier designed to help maintain a fresh living space.', 189, 249, 'Wellness', 'Nova', 16, 'NOVA-PURIFIER-081', 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=80'],
  ['Orbit Desk Lamp', 'Minimal adjustable desk lamp with warm ambient lighting for productive workspaces.', 68, 92, 'Home & Living', 'Orbit', 28, 'ORBIT-LAMP-091', 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80'],
  ['Breeze Bluetooth Speaker', 'Portable Bluetooth speaker with crisp sound and long battery life for any room.', 89, 119, 'Electronics', 'Breeze', 44, 'BREEZE-SPEAK-101', 'https://images.unsplash.com/photo-1518444065439-e933c06ce9cd?auto=format&fit=crop&w=900&q=80'],
].map(([name, description, price, compareAtPrice, category, brand, stock, sku, image]) => ({
  name, description, price, compareAtPrice, category, brand, stock, sku, image,
}));

const reviewSeed = [
  { sku: 'AERO-HP-001', rating: 5, title: 'Clear and comfortable', comment: 'The demo headphones are comfortable for longer listening sessions.' },
  { sku: 'LUMA-WT-002', rating: 4, title: 'Useful daily display', comment: 'The demo watch is easy to read and simple to set up.' },
  { sku: 'TERRA-COF-011', rating: 5, title: 'Good morning routine', comment: 'The demo coffee maker is compact and straightforward to use.' },
];

const required = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required to run the demo seed.`);
  return value;
};

const getOrCreateUser = async ({ email, password, username, fullName, role }) => {
  let user = await User.findOne({ email: email.toLowerCase() }).select('+password +isActive');
  if (!user) {
    user = new User({ email, username, fullName, role, isActive: true, password });
  } else {
    if (user.role !== role && role === 'admin') {
      throw new Error(`Refusing to promote existing user ${email}. Use a dedicated demo admin email.`);
    }
    user.username = username;
    user.fullName = fullName;
    user.role = role;
    user.isActive = true;
    user.password = password;
  }
  await user.save();
  return user;
};

const upsertCategory = async (data) => {
  let category = await Category.findOne({ name: data.name });
  if (!category) category = new Category(data);
  category.description = data.description;
  category.image = '';
  category.isActive = true;
  await category.save();
  return category;
};

const upsertProduct = async (data, category, adminUser) => {
  let product = await Product.findOne({ sku: data.sku });
  if (!product) product = new Product({ sku: data.sku });
  product.name = data.name;
  product.description = data.description;
  product.price = data.price;
  product.compareAtPrice = data.compareAtPrice;
  product.images = [data.image];
  product.category = category._id;
  product.brand = data.brand;
  product.stock = data.stock;
  product.isActive = true;
  product.createdBy = adminUser._id;
  await product.save();
  return product;
};

const recalculateRating = async (product) => {
  const reviews = await Review.find({ product: product._id });
  product.numReviews = reviews.length;
  product.rating = reviews.length
    ? Number((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1))
    : 0;
  await product.save();
};

async function seedDemoData() {
  if (process.env.NODE_ENV === 'production' || process.env.SEED_ALLOW_PRODUCTION === 'true') {
    throw new Error('Demo seeding is blocked in production. Use a separate development database.');
  }
  if (process.env.SEED_CONFIRM !== DEMO_CONFIRMATION) {
    throw new Error(`Set SEED_CONFIRM=${DEMO_CONFIRMATION} to confirm development seeding.`);
  }

  const mongoUri = required('MONGO_URI');
  const adminEmail = required('SEED_ADMIN_EMAIL').toLowerCase();
  const adminPassword = required('SEED_ADMIN_PASSWORD');
  const customerEmail = required('SEED_CUSTOMER_EMAIL').toLowerCase();
  const customerPassword = required('SEED_CUSTOMER_PASSWORD');

  await mongoose.connect(mongoUri);

  const adminUser = await getOrCreateUser({
    email: adminEmail,
    password: adminPassword,
    username: 'demo_store_admin',
    fullName: 'Demo Store Admin',
    role: 'admin',
  });
  const customer = await getOrCreateUser({
    email: customerEmail,
    password: customerPassword,
    username: 'demo_customer',
    fullName: 'Demo Customer',
    role: 'customer',
  });

  const categoryMap = {};
  for (const categoryData of categoriesSeed) {
    categoryMap[categoryData.name] = await upsertCategory(categoryData);
  }

  const productsBySku = {};
  for (const productData of productsSeed) {
    productsBySku[productData.sku] = await upsertProduct(productData, categoryMap[productData.category], adminUser);
  }

  const orderProducts = [productsBySku['AERO-HP-001'], productsBySku['LUMA-WT-002'], productsBySku['TERRA-COF-011']];
  const orderItems = orderProducts.map((product, index) => ({
    product: product._id,
    productName: product.name,
    productSlug: product.slug,
    quantity: index === 1 ? 2 : 1,
    price: product.price,
    image: product.images[0],
  }));
  const total = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  let order = await Order.findOne({ user: customer._id, 'items.product': orderProducts[0]._id });
  if (!order) order = new Order({ user: customer._id });
  order.user = customer._id;
  order.items = orderItems;
  order.total = total;
  order.paymentStatus = 'paid';
  order.paymentProvider = 'stripe';
  order.status = 'delivered';
  order.paidAt = new Date();
  order.shippingAddress = {
    fullName: 'Demo Customer',
    phone: '000-000-0142',
    addressLine1: '42 Example Avenue',
    addressLine2: 'Suite 2',
    city: 'Demo City',
    state: 'Demo State',
    postalCode: '00042',
    country: 'Demo Country',
  };
  await order.save();

  for (const reviewData of reviewSeed) {
    const product = productsBySku[reviewData.sku];
    let review = await Review.findOne({ user: customer._id, product: product._id });
    if (!review) review = new Review({ user: customer._id, product: product._id });
    review.order = order._id;
    review.rating = reviewData.rating;
    review.title = reviewData.title;
    review.comment = reviewData.comment;
    review.isApproved = true;
    await review.save();
  }

  for (const product of Object.values(productsBySku)) await recalculateRating(product);

  console.log(`Seeded ${categoriesSeed.length} categories, ${productsSeed.length} products, 2 users, 1 order, and ${reviewSeed.length} reviews.`);
  console.log(`Demo admin email: ${adminEmail}`);
  console.log(`Demo customer email: ${customerEmail}`);
}

seedDemoData()
  .catch((error) => {
    console.error(`[seed] ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
