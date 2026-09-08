import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';
import { useApi } from '../hooks/useApi.jsx';

export default function Profile() {
  const { user, logout, updateProfile, changePassword } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('profile');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [profileData, setProfileData] = useState({
    fullName: user?.fullName || '',
    username: user?.username || '',
    phone: user?.phone || '',
    avatar: user?.avatar || '',
  });

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState('');

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
  });

  const handleProfileChange = (e) => {
    setProfileData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePasswordChange = (e) => {
    setPasswordData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await updateProfile(profileData);
      setSuccess('Profile updated successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!passwordData.currentPassword || !passwordData.newPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      await changePassword(passwordData);
      setPasswordData({ currentPassword: '', newPassword: '' });
      setSuccess('Password changed successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  useEffect(() => {
    const loadOrders = async () => {
      setOrdersLoading(true);
      try {
        const response = await api.get('/api/orders/me');
        setOrders(response.data.data);
        setOrdersError('');
      } catch (err) {
        setOrdersError(err.response?.data?.message || 'Failed to load orders');
        setOrders([]);
      } finally {
        setOrdersLoading(false);
      }
    };
    loadOrders();
  }, [api]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">My Account</h1>

      <div className="mt-6 flex gap-2 border-b border-slate-200">
        <button
          onClick={() => { setActiveTab('profile'); setError(''); setSuccess(''); }}
          className={`px-4 py-2.5 text-sm font-medium transition ${
            activeTab === 'profile'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Profile
        </button>
        <button
          onClick={() => { setActiveTab('orders'); setError(''); setSuccess(''); }}
          className={`px-4 py-2.5 text-sm font-medium transition ${
            activeTab === 'orders'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          My Orders
        </button>
        <button
          onClick={() => { setActiveTab('password'); setError(''); setSuccess(''); }}
          className={`px-4 py-2.5 text-sm font-medium transition ${
            activeTab === 'password'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Change Password
        </button>
      </div>

      {(success || error) && (
        <div className={`mt-4 rounded-lg px-4 py-3 text-sm ${
          success
            ? 'border border-emerald-200 bg-emerald-50 text-emerald-600'
            : 'border border-red-200 bg-red-50 text-red-600'
        }`}>
          {success || error}
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Profile Information</h2>
          <p className="mt-1 text-sm text-slate-500">
            Email: <span className="font-medium text-slate-700">{user?.email}</span>
            <span className="ml-2 inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600">
              {user?.role}
            </span>
          </p>

          <form onSubmit={handleProfileSubmit} className="mt-6 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-slate-700">
                  Full Name
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={profileData.fullName}
                  onChange={handleProfileChange}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-slate-700">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={profileData.username}
                  onChange={handleProfileChange}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-slate-700">
                  Phone
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="text"
                  value={profileData.phone}
                  onChange={handleProfileChange}
                  placeholder="Phone number"
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label htmlFor="avatar" className="block text-sm font-medium text-slate-700">
                  Avatar URL
                </label>
                <input
                  id="avatar"
                  name="avatar"
                  type="text"
                  value={profileData.avatar}
                  onChange={handleProfileChange}
                  placeholder="https://..."
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
              >
                Logout
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">My Orders</h2>

          {ordersLoading && <p>Loading orders...</p>}

          {ordersError && <p className="text-red-600">{ordersError}</p>}

          {!ordersLoading && ordersError && orders && orders.length > 0 && (
            <div className="mt-4 space-y-4">
              {orders.map((order) => (
                <div key={order._id} className="border rounded p-4 hover:bg-slate-50 transition">
                  <div className="flex justify-between items-start mb-3">
                    <span className="font-medium">{order.orderNumber}</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex text-sm text-muted-foreground mb-2">
                    <span>Total: ${order.total.toFixed(2)}</span>
                    <span>&nbsp;|&nbsp;</span>
                    <span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : order.paymentStatus === 'failed' ? 'bg-red-100 text-red-800' : order.paymentStatus === 'refunded' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}
                      >
                        {order.paymentStatus}
                      </span>
                    </span>
                    <span>&nbsp;|&nbsp;</span>
                    <span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${order.status === 'processing' ? 'bg-blue-100 text-blue-800' : order.status === 'shipped' ? 'bg-green-100 text-green-800' : order.status === 'delivered' ? 'bg-green-100 text-green-800' : order.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}
                      >
                        {order.status}
                      </span>
                    </span>
                  </div>

                  <Button
                    variant="link"
                    size="small"
                    onClick={() => navigate(`/order-details/${order._id}`)}
                  >
                    View Details
                  </Button>
                </div>
              ))}
            </div>
          )}

          {!ordersLoading && (!orders || orders.length === 0) && (
            <p className="text-muted-foreground mt-4">
              No orders found.
            </p>
          )}
        </div>
      )}

      {activeTab === 'password' && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Change Password</h2>

          <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-slate-700">
                Current Password
              </label>
              <input
                id="currentPassword"
                name="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                placeholder="Enter current password"
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700">
                New Password
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                placeholder="At least 8 characters"
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
