import axios from 'axios';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/+$/, '');

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
});

export const checkHealth = () => api.get('/health');

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  getAddresses: () => api.get('/auth/addresses'),
  addAddress: (data) => api.post('/auth/addresses', data),
  updateAddress: (addressId, data) => api.put(`/auth/addresses/${addressId}`, data),
  deleteAddress: (addressId) => api.delete(`/auth/addresses/${addressId}`),
  setDefaultAddress: (addressId) => api.put(`/auth/addresses/${addressId}/default`),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

export const adminAPI = {
  getOverview: () => api.get('/admin/dashboard'),
  getProducts: (params) => api.get('/admin/products', { params }),
  createProduct: (data) => api.post('/admin/products', data),
  updateProduct: (id, data) => api.put(`/admin/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/admin/products/${id}`),
  getCategories: () => api.get('/admin/categories'),
  createCategory: (data) => api.post('/admin/categories', data),
  updateCategory: (id, data) => api.put(`/admin/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/admin/categories/${id}`),
  getOrders: (params) => api.get('/admin/orders', { params }),
  getOrder: (id) => api.get(`/admin/orders/${id}`),
  updateOrderStatus: (id, data) => api.put(`/admin/orders/${id}/status`, data),
  getReviews: (params) => api.get('/admin/reviews', { params }),
  deleteReview: (id) => api.delete(`/admin/reviews/${id}`),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUserStatus: (id, data) => api.put(`/admin/users/${id}/status`, data),
  getCoupons: () => api.get('/admin/coupons'),
  createCoupon: (data) => api.post('/admin/coupons', data),
  updateCoupon: (id, data)=> api.put(`/admin/coupons/${id}`, data),
};

export const categoryAPI = {
  getCategories: () => api.get('/categories'),
  getCategory: (id) => api.get(`/categories/${id}`),
  createCategory: (data) => api.post('/categories', data),
  updateCategory: (id, data) => api.put(`/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/categories/${id}`),
};

export const productAPI = {
  getProducts: (params) => api.get('/products', { params }),
  getProduct: (id) => api.get(`/products/${id}`),
  createProduct: (data) => api.post('/products', data),
  updateProduct: (id, data) => api.put(`/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/products/${id}`),
};

export const cartAPI = {
  getCart: () => api.get('/cart'),
  addToCart: (productId, quantity) => api.post('/cart', { productId, quantity }),
  updateCartItem: (productId, quantity) => api.put(`/cart/${productId}`, { quantity }),
  removeCartItem: (productId) => api.delete(`/cart/${productId}`),
  clearCart: () => api.delete('/cart'),
};

export const wishlistAPI = {
  getWishlist: () => api.get('/wishlist'),
  addToWishlist: (productId) => api.post('/wishlist', { productId }),
  removeFromWishlist: (productId) => api.delete(`/wishlist/${productId}`),
  clearWishlist: () => api.delete('/wishlist'),
};

export const paymentAPI = {
  createCheckoutSession: (orderId) => api.post(`/payments/create-checkout-session/${orderId}`),
};

export const orderAPI = {
  createOrder: (orderData) => api.post('/orders', orderData),
  getUserOrders: () => api.get('/orders'),
  getOrder: (orderId) => api.get(`/orders/${orderId}`),
  cancelOrder: (orderId) => api.put(`/orders/${orderId}/cancel`),
};

export const reviewAPI = {
  getProductReviews: (productId, params) =>
    api.get(`/products/${productId}/reviews`, { params }),
  getEligibility: (productId) => api.get(`/products/${productId}/reviews/eligibility`),
  createReview: (productId, data) => api.post(`/products/${productId}/reviews`, data),
  getMyReview: (productId) => api.get(`/products/${productId}/reviews/my-review`),
  updateReview: (productId, reviewId, data) =>
    api.put(`/products/${productId}/reviews/${reviewId}`, data),
  deleteReview: (productId, reviewId) =>
    api.delete(`/products/${productId}/reviews/${reviewId}`),
};

export default api;
