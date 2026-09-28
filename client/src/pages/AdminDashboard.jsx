import { useEffect, useMemo, useState } from 'react';
import { adminAPI } from '../services/api.js';

const emptyProductForm = {
  name: '',
  category: '',
  description: '',
  price: '',
  compareAtPrice: '',
  stock: '',
  brand: '',
  sku: '',
  images: '',
  isActive: true,
};

const emptyCategoryForm = {
  name: '',
  description: '',
  image: '',
  isActive: true,
};

const emptyCouponForm = {
  code: '', discountPercent: '', regions: '', categories: [], users: [], isActive: true,
};
const formatCurrency = (value) => {
  const amount = Number(value || 0);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const statusOptions = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [users, setUsers] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [productForm, setProductForm] = useState(emptyProductForm);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [categoryForm, setCategoryForm] = useState(emptyCategoryForm);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [productStatus, setProductStatus] = useState('all');
  const [productStockFilter, setProductStockFilter] = useState('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [orderPaymentFilter, setOrderPaymentFilter] = useState('all');
  const [reviewSearch, setReviewSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userStatusFilter, setUserStatusFilter] = useState('all');

  const [loading, setLoading] = useState(true);
  const [savingProduct, setSavingProduct] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);
  const [couponForm, setCouponForm] = useState(emptyCouponForm);
  const [selectedCouponId, setSelectedCouponId] = useState('');
  const[savingCoupon, setSavingCoupon] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const selectedOrder = useMemo(
    () => orders.find((order) => order._id === selectedOrderId) || null,
    [orders, selectedOrderId]
  );

  const loadOverview = async () => {
    const response = await adminAPI.getOverview();
    setOverview(response.data.data);
  };

  const loadProducts = async () => {
    const params = {
      search: productSearch,
      status: productStatus,
      stockFilter: productStockFilter,
    };
    const response = await adminAPI.getProducts(params);
    setProducts(response.data.products || []);
  };

  const loadCategories = async () => {
    const response = await adminAPI.getCategories();
    setCategories(response.data.categories || []);
  };

  const loadOrders = async () => {
    const response = await adminAPI.getOrders({
      search: orderSearch,
      status: orderStatusFilter,
      paymentStatus: orderPaymentFilter,
    });
    setOrders(response.data.orders || []);
  };

  const loadReviews = async () => {
    const response = await adminAPI.getReviews({ search: reviewSearch });
    setReviews(response.data.reviews || []);
  };

  const loadUsers = async () => {
    const response = await adminAPI.getUsers({
      search: userSearch,
      role: userRoleFilter,
      status: userStatusFilter,
    });
    setUsers(response.data.users || []);
  };

  const loadCoupons = async () => {
    const response = await adminAPI.getCoupons();
    setCoupons(response.data.coupons || []);
  };
  const loadDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      await Promise.all([
        loadOverview(),
        loadProducts(),
        loadCategories(),
        loadOrders(),
        loadReviews(),
        loadUsers(),
        loadCoupons(),
      ]);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load admin dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (!loading) {
      loadProducts();
    }
  }, [productStatus, productStockFilter, productSearch]);

  useEffect(() => {
    if (!loading) {
      loadOrders();
    }
  }, [orderSearch, orderStatusFilter, orderPaymentFilter]);

  useEffect(() => {
    if (!loading) {
      loadReviews();
    }
  }, [reviewSearch]);

  useEffect(() => {
    if (!loading) {
      loadUsers();
    }
  }, [userSearch, userRoleFilter, userStatusFilter]);

  const resetProductForm = () => {
    setProductForm(emptyProductForm);
    setSelectedProductId('');
  };

  const resetCategoryForm = () => {
    setCategoryForm(emptyCategoryForm);
    setSelectedCategoryId('');
  };

  const handleProductSubmit = async (event) => {
    event.preventDefault();
    setSavingProduct(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        ...productForm,
        price: Number(productForm.price),
        compareAtPrice: productForm.compareAtPrice === '' ? 0 : Number(productForm.compareAtPrice),
        stock: Number(productForm.stock),
        images: productForm.images
          ? productForm.images.split(',').map((item) => item.trim()).filter(Boolean)
          : [],
      };

      if (!payload.name || !payload.category || !payload.description) {
        throw new Error('Name, category, and description are required.');
      }

      if (selectedProductId) {
        await adminAPI.updateProduct(selectedProductId, payload);
        setSuccess('Product updated successfully.');
      } else {
        await adminAPI.createProduct(payload);
        setSuccess('Product added successfully.');
      }

      resetProductForm();
      await Promise.all([loadOverview(), loadProducts(), loadCategories()]);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Unable to save product.');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleEditProduct = (product) => {
    setSelectedProductId(product._id);
    setProductForm({
      name: product.name || '',
      category: product.category?._id || product.category || '',
      description: product.description || '',
      price: product.price ?? '',
      compareAtPrice: product.compareAtPrice ?? '',
      stock: product.stock ?? '',
      brand: product.brand || '',
      sku: product.sku || '',
      images: Array.isArray(product.images) ? product.images.join(', ') : '',
      isActive: product.isActive ?? true,
    });
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Delete this product permanently?')) {
      return;
    }

    try {
      await adminAPI.deleteProduct(productId);
      setSuccess('Product deleted successfully.');
      resetProductForm();
      await Promise.all([loadOverview(), loadProducts(), loadCategories()]);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete product.');
    }
  };

  const handleCategorySubmit = async (event) => {
    event.preventDefault();
    setSavingCategory(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        ...categoryForm,
        name: categoryForm.name.trim(),
        description: categoryForm.description.trim(),
        image: categoryForm.image.trim(),
      };

      if (!payload.name) {
        throw new Error('Category name is required.');
      }

      if (selectedCategoryId) {
        await adminAPI.updateCategory(selectedCategoryId, payload);
        setSuccess('Category updated successfully.');
      } else {
        await adminAPI.createCategory(payload);
        setSuccess('Category created successfully.');
      }

      resetCategoryForm();
      await loadCategories();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Unable to save category.');
    } finally {
      setSavingCategory(false);
    }
  };

  const handleEditCategory = (category) => {
    setSelectedCategoryId(category._id);
    setCategoryForm({
      name: category.name || '',
      description: category.description || '',
      image: category.image || '',
      isActive: category.isActive ?? true,
    });
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Delete this category? This will fail if products still reference it.')) {
      return;
    }

    try {
      await adminAPI.deleteCategory(categoryId);
      setSuccess('Category deleted successfully.');
      resetCategoryForm();
      await loadCategories();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete category.');
    }
  };

  const handleOrderStatusUpdate = async (orderId, nextStatus) => {
    try {
      await adminAPI.updateOrderStatus(orderId, { status: nextStatus });
      setSuccess('Order status updated successfully.');
      await loadOrders();
      await loadOverview();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update order status.');
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Remove this review from the store?')) {
      return;
    }

    try {
      await adminAPI.deleteReview(reviewId);
      setSuccess('Review removed successfully.');
      await Promise.all([loadReviews(), loadOverview()]);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to remove review.');
    }
  };

  const handleUserStatusToggle = async (userId, isActive) => {
    try {
      await adminAPI.updateUserStatus(userId, { isActive: !isActive });
      setSuccess('User status updated successfully.');
      await loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update user status.');
    }
  };

const resetCouponForm = () => {
  setCouponForm(emptyCouponForm);
  setSelectedCouponId('');
};

const handleCouponChange = ({target}) => {
  let value = target.value;
  if (target.type === 'checkbox') value = target.checked;
  if (target.multiple) value = [...target.selectedOptions].map((item)=> item.value);
  setCouponForm((form)=> ({...form, [target.name]: value }));
}

const handleCouponSubmit = async (event) => {
  event.preventDefault();
  setSavingCoupon(true);
  setError('');
  try{
    const payload = {
      ...couponForm,
        discountPercent: Number(couponForm.discountPercent),
        regions: couponForm.regions.split(',').map((item) =>item.trim()).filter(Boolean),
      
    };
    if (selectedCouponId) await adminAPI.updateCoupon(selectedCouponId, payload);
    else await adminAPI.createCoupon(payload);
    resetCouponForm();
    await loadCoupons();
  }catch (err){
    setError(err.response?.data?.message || 'Unable to save coupon');
  }finally{
    setSavingCoupon(false);
  }
};

const handleEditCoupon = (coupon) => {
  setSelectedCouponId(coupon._id);
  setCouponForm({
    code: coupon.code,
    discountPercent: coupon.discountPercent,
    regions: coupon.regions.join(', '),
    categories:coupon.categories.map((item)=> item._id || item),
    users: coupon.users.map((item) => item._id || item),
    isActive: coupon.isActive,
  });
};

  const overviewCards = overview
    ? [
        { label: 'Total Products', value: overview.totalProducts ?? 0, hint: 'Live catalog count' },
        { label: 'Total Orders', value: overview.totalOrders ?? 0, hint: 'All placed orders' },
        { label: 'Total Users', value: overview.totalUsers ?? 0, hint: 'All accounts' },
        { label: 'Revenue', value: formatCurrency(overview.revenue ?? 0), hint: 'Paid orders only' },
        { label: 'Pending Orders', value: overview.pendingOrders ?? 0, hint: 'Awaiting fulfillment' },
        { label: 'Low Stock', value: overview.lowStockProducts ?? 0, hint: 'Stock <= 10' },
      ]
    : [];

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-indigo-600">Admin Panel</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Dashboard</h1>
        </div>
        <div className="text-sm text-slate-500">Admin-only operations are protected server-side.</div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          Loading administrative data...
        </div>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            {overviewCards.map((card) => (
              <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm text-slate-500">{card.label}</p>
                <div className="mt-3 text-2xl font-bold text-slate-900">{card.value}</div>
                <p className="mt-1 text-xs text-slate-400">{card.hint}</p>
              </div>
            ))}
          </section>

          <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Recent orders</h2>
            </div>
            {overview?.recentOrders?.length ? (
              <div className="space-y-3">
                {overview.recentOrders.map((order) => (
                  <div
                    key={order._id}
                    className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{order.orderNumber}</div>
                      <div className="text-xs text-slate-500">{order.user?.fullName || 'Customer'} • {new Date(order.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="rounded-full bg-slate-200 px-2 py-1 text-slate-700">{order.status}</span>
                      <span className="rounded-full bg-indigo-100 px-2 py-1 text-indigo-700">{order.paymentStatus}</span>
                      <span className="font-medium text-slate-900">{formatCurrency(order.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-500">No recent orders available.</div>
            )}
          </section>

          <div className="grid gap-8 xl:grid-cols-[1fr_0.95fr]">
            <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Products</h2>
                <span className="text-sm text-slate-500">{products.length} results</span>
              </div>

              <div className="mb-4 flex flex-col gap-3 md:flex-row">
                <input
                  value={productSearch}
                  onChange={(event) => setProductSearch(event.target.value)}
                  placeholder="Search products"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <select
                  value={productStatus}
                  onChange={(event) => setProductStatus(event.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="all">All status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <select
                  value={productStockFilter}
                  onChange={(event) => setProductStockFilter(event.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="all">All stock</option>
                  <option value="low">Low stock</option>
                  <option value="out">Out of stock</option>
                </select>
              </div>

              <form onSubmit={handleProductSubmit} className="mb-5 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
                <input
                  value={productForm.name}
                  onChange={(event) => setProductForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Product name"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <select
                  value={productForm.category}
                  onChange={(event) => setProductForm((prev) => ({ ...prev, category: event.target.value }))}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>{category.name}</option>
                  ))}
                </select>
                <input
                  value={productForm.price}
                  type="number"
                  min="0"
                  step="0.01"
                  onChange={(event) => setProductForm((prev) => ({ ...prev, price: event.target.value }))}
                  placeholder="Price"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <input
                  value={productForm.compareAtPrice}
                  type="number"
                  min="0"
                  step="0.01"
                  onChange={(event) => setProductForm((prev) => ({ ...prev, compareAtPrice: event.target.value }))}
                  placeholder="Compare price"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <input
                  value={productForm.stock}
                  type="number"
                  min="0"
                  onChange={(event) => setProductForm((prev) => ({ ...prev, stock: event.target.value }))}
                  placeholder="Stock quantity"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <input
                  value={productForm.brand}
                  onChange={(event) => setProductForm((prev) => ({ ...prev, brand: event.target.value }))}
                  placeholder="Brand"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <input
                  value={productForm.sku}
                  onChange={(event) => setProductForm((prev) => ({ ...prev, sku: event.target.value }))}
                  placeholder="SKU"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <input
                  value={productForm.images}
                  onChange={(event) => setProductForm((prev) => ({ ...prev, images: event.target.value }))}
                  placeholder="Image URLs (comma-separated)"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <div className="md:col-span-2">
                  <textarea
                    value={productForm.description}
                    onChange={(event) => setProductForm((prev) => ({ ...prev, description: event.target.value }))}
                    placeholder="Product description"
                    rows={4}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-700 md:col-span-2">
                  <input
                    type="checkbox"
                    checked={productForm.isActive}
                    onChange={(event) => setProductForm((prev) => ({ ...prev, isActive: event.target.checked }))}
                  />
                  Product available for purchase
                </label>
                <div className="md:col-span-2 flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={savingProduct}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                  >
                    {savingProduct ? 'Saving...' : selectedProductId ? 'Update product' : 'Add product'}
                  </button>
                  {selectedProductId && (
                    <button
                      type="button"
                      onClick={resetProductForm}
                      className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
                    >
                      Cancel edit
                    </button>
                  )}
                </div>
              </form>

              <div className="-mx-1 overflow-x-auto px-1">
                <table className="min-w-[760px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="py-2 pr-4">Product</th>
                      <th className="py-2 pr-4">Category</th>
                      <th className="py-2 pr-4">Price</th>
                      <th className="py-2 pr-4">Stock</th>
                      <th className="py-2 pr-4">Status</th>
                      <th className="py-2 pr-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.length ? (
                      products.map((product) => (
                        <tr key={product._id} className="border-b border-slate-100 align-top">
                          <td className="py-3 pr-4">
                            <div className="font-medium text-slate-900">{product.name}</div>
                            <div className="text-xs text-slate-500">{product.brand || 'No brand'} • SKU: {product.sku || '—'}</div>
                          </td>
                          <td className="py-3 pr-4 text-slate-700">{product.category?.name || 'Unassigned'}</td>
                          <td className="py-3 pr-4 text-slate-700">{formatCurrency(product.price)}</td>
                          <td className="py-3 pr-4">
                            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${Number(product.stock) <= 10 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                              {product.stock} {Number(product.stock) <= 10 ? 'Low' : 'OK'}
                            </span>
                          </td>
                          <td className="py-3 pr-4">
                            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${product.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-700'}`}>
                              {product.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-3 pr-4">
                            <div className="flex flex-wrap gap-2">
                              <button type="button" onClick={() => handleEditProduct(product)} className="rounded border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50">
                                Edit
                              </button>
                              <button type="button" onClick={() => handleDeleteProduct(product._id)} className="rounded border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50">
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="py-6 text-center text-slate-500">No products match the current filter.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Categories</h2>
              </div>

              <form onSubmit={handleCategorySubmit} className="mb-5 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <input
                  value={categoryForm.name}
                  onChange={(event) => setCategoryForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Category name"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <textarea
                  value={categoryForm.description}
                  onChange={(event) => setCategoryForm((prev) => ({ ...prev, description: event.target.value }))}
                  rows={3}
                  placeholder="Category description"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <input
                  value={categoryForm.image}
                  onChange={(event) => setCategoryForm((prev) => ({ ...prev, image: event.target.value }))}
                  placeholder="Image URL"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={categoryForm.isActive}
                    onChange={(event) => setCategoryForm((prev) => ({ ...prev, isActive: event.target.checked }))}
                  />
                  Active category
                </label>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={savingCategory}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                  >
                    {savingCategory ? 'Saving...' : selectedCategoryId ? 'Update category' : 'Add category'}
                  </button>
                  {selectedCategoryId && (
                    <button type="button" onClick={resetCategoryForm} className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700">
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              <div className="space-y-3">
                {categories.length ? (
                  categories.map((category) => (
                    <div key={category._id} className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-3">
                      <div>
                        <div className="font-medium text-slate-900">{category.name}</div>
                        <div className="text-xs text-slate-500">{category.description || 'No description'}</div>
                      </div>
                      <div className="flex shrink-0 flex-wrap justify-end gap-2">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${category.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-700'}`}>
                          {category.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <button type="button" onClick={() => handleEditCategory(category)} className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700">Edit</button>
                        <button type="button" onClick={() => handleDeleteCategory(category._id)} className="rounded border border-red-200 px-2 py-1 text-xs text-red-600">Delete</button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-slate-500">No categories available.</div>
                )}
              </div>
            </section>
          </div>

          <section>
            <h2>Coupons</h2>
            <form onSubmit={handleCouponSubmit}>
              {['code', 'discountPercent', 'regions'].map((name) =>
              <input
              key={name} name={name}
              value={couponForm[name]}
              onChange={handleCouponChange}
              placeholder={name}
              />
            )}
            {[['categories', categories], ['users', users]].map (([name, list])=>
              <label key={name}>
                {name}
                <select name={name} multiple value={couponForm[name]} onChange={handleCouponChange}>
                  {list.map((item) => <option key= {item._id} value={item._id}>{item.name || item.fullName}</option>)}
                </select>

              </label>
            )}

            <label>
              <input
              name="isActive"
              type="checkbox"
              checked={couponForm.isActive}
              onChange={handleCouponChange}
              />
              Active
            </label>
            <button>Save</button>
            </form>
            {coupons.map((coupon)=>
            <button
              key={coupon._id}
              onClick={() => handleEditCoupon(coupon)}
              >
                {coupon.code} {coupon.discountPercent}%
            </button>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Orders</h2>
              <div className="flex min-w-0 flex-col gap-2 md:flex-row">
                <input
                  value={orderSearch}
                  onChange={(event) => setOrderSearch(event.target.value)}
                  placeholder="Search order or customer"
                  className="min-w-0 rounded-lg border border-slate-300 px-3 py-2.5 text-sm md:flex-1"
                />
                <select
                  value={orderStatusFilter}
                  onChange={(event) => setOrderStatusFilter(event.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="all">All statuses</option>
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
                <select
                  value={orderPaymentFilter}
                  onChange={(event) => setOrderPaymentFilter(event.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="all">All payment</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.4fr_0.6fr]">
              <div className="-mx-1 overflow-x-auto px-1">
                <table className="min-w-[680px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="py-2 pr-4">Order</th>
                      <th className="py-2 pr-4">Customer</th>
                      <th className="py-2 pr-4">Total</th>
                      <th className="py-2 pr-4">Payment</th>
                      <th className="py-2 pr-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length ? (
                      orders.map((order) => (
                        <tr key={order._id} className="border-b border-slate-100 align-top">
                          <td className="py-3 pr-4">
                            <button type="button" onClick={() => setSelectedOrderId(order._id)} className="text-left font-medium text-indigo-600 hover:underline">
                              {order.orderNumber}
                            </button>
                          </td>
                          <td className="py-3 pr-4 text-slate-700">{order.user?.fullName || 'Unknown user'}</td>
                          <td className="py-3 pr-4 text-slate-700">{formatCurrency(order.total)}</td>
                          <td className="py-3 pr-4">
                            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${order.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
                              {order.paymentStatus}
                            </span>
                          </td>
                          <td className="py-3 pr-4">
                            <select
                              value={order.status}
                              onChange={(event) => handleOrderStatusUpdate(order._id, event.target.value)}
                              className="rounded-lg border border-slate-300 px-2 py-1 text-xs"
                            >
                              {statusOptions.map((status) => (
                                <option key={status} value={status}>{status}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="py-6 text-center text-slate-500">No orders match the current filter.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Order details</h3>
                {selectedOrder ? (
                  <div className="mt-3 space-y-3 text-sm text-slate-700">
                    <div><span className="font-medium text-slate-900">Order:</span> {selectedOrder.orderNumber}</div>
                    <div><span className="font-medium text-slate-900">Customer:</span> {selectedOrder.user?.fullName || 'Unknown'}</div>
                    <div><span className="font-medium text-slate-900">Email:</span> {selectedOrder.user?.email || '—'}</div>
                    <div><span className="font-medium text-slate-900">Total:</span> {formatCurrency(selectedOrder.total)}</div>
                    <div><span className="font-medium text-slate-900">Shipping:</span> {selectedOrder.shippingAddress ? `${selectedOrder.shippingAddress.city}, ${selectedOrder.shippingAddress.country}` : 'N/A'}</div>
                    <div className="rounded-lg border border-slate-200 bg-white p-3">
                      <div className="font-medium text-slate-900">Address</div>
                      <div>{selectedOrder.shippingAddress?.fullName}</div>
                      <div>{selectedOrder.shippingAddress?.addressLine1}</div>
                      {selectedOrder.shippingAddress?.addressLine2 && <div>{selectedOrder.shippingAddress.addressLine2}</div>}
                      <div>{selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} {selectedOrder.shippingAddress?.postalCode}</div>
                      <div>{selectedOrder.shippingAddress?.country}</div>
                      <div>{selectedOrder.shippingAddress?.phone}</div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 text-sm text-slate-500">Select an order to review fulfillment details.</div>
                )}
              </div>
            </div>
          </section>

          <div className="grid gap-8 xl:grid-cols-2">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Reviews</h2>
              </div>
              <div className="mb-4">
                <input
                  value={reviewSearch}
                  onChange={(event) => setReviewSearch(event.target.value)}
                  placeholder="Search review text"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-3">
                {reviews.length ? (
                  reviews.map((review) => (
                    <div key={review._id} className="rounded-xl border border-slate-200 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-medium text-slate-900">{review.product?.name || 'Unknown product'}</div>
                          <div className="text-xs text-slate-500">By {review.user?.fullName || 'Unknown user'} • {new Date(review.createdAt).toLocaleDateString()}</div>
                        </div>
                        <button type="button" onClick={() => handleDeleteReview(review._id)} className="min-h-10 rounded border border-red-200 px-3 py-2 text-xs font-medium text-red-600">Remove</button>
                      </div>
                      <div className="mt-2 text-sm text-amber-500">{'★'.repeat(Number(review.rating || 0))}</div>
                      {review.title && <div className="mt-2 text-sm font-medium text-slate-800">{review.title}</div>}
                      <div className="mt-1 text-sm text-slate-600">{review.comment}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-slate-500">No reviews found.</div>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Users</h2>
              </div>
              <div className="mb-4 flex flex-col gap-2 md:flex-row">
                <input
                  value={userSearch}
                  onChange={(event) => setUserSearch(event.target.value)}
                  placeholder="Search users"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <select
                  value={userRoleFilter}
                  onChange={(event) => setUserRoleFilter(event.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="all">All roles</option>
                  <option value="admin">Admin</option>
                  <option value="customer">Customer</option>
                </select>
                <select
                  value={userStatusFilter}
                  onChange={(event) => setUserStatusFilter(event.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="all">All status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="space-y-3">
                {users.length ? (
                  users.map((userItem) => (
                    <div key={userItem._id} className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 p-3">
                      <div>
                        <div className="font-medium text-slate-900">{userItem.fullName}</div>
                        <div className="text-xs text-slate-500">{userItem.email} • {userItem.role}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${userItem.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-700'}`}>
                          {userItem.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <button type="button" onClick={() => handleUserStatusToggle(userItem._id, userItem.isActive)} className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700">
                          {userItem.isActive ? 'Disable' : 'Enable'}
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-slate-500">No users found.</div>
                )}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
