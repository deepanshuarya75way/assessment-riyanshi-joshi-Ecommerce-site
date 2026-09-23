import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';
import api from '../services/api.js';
import Button from '../components/ui/Button.jsx';

export default function Orders() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    api
      .get('/orders')
      .then((response) => {
        const payload = response.data?.data || response.data || [];
        const list = Array.isArray(payload) ? payload : [];
        setOrders(list);
      })
      .catch((err) => {
        console.error('[orders] Error:', err.message);
        setError(err.response?.data?.message || 'Failed to load your orders.');
      })
      .finally(() => setLoading(false));
  }, [user, navigate]);

  if (!user) return null;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600"></div>
          <h3 className="text-lg font-semibold text-slate-900">Loading your orders...</h3>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <h3 className="text-xl font-semibold text-slate-900">Unable to load your orders</h3>
        <p className="mt-2 text-sm text-slate-500">{error}</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/products')}>
          Continue shopping
        </Button>
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="py-12 text-center">
        <h3 className="text-xl font-semibold text-slate-900">No orders yet</h3>
        <p className="mt-2 text-sm text-slate-500">Your completed purchases will appear here.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/products')}>
          Start shopping
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h2 className="text-3xl font-bold text-slate-900">My Orders</h2>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-lg font-semibold text-slate-900">{order.orderNumber}</p>
                <p className="text-sm text-slate-500">
                  {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Recently'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${order.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' : order.paymentStatus === 'failed' ? 'bg-red-100 text-red-700' : order.paymentStatus === 'refunded' ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-200 text-slate-700'}`}>
                  {order.paymentStatus ? order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1) : 'Pending'}
                </span>
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${order.status === 'processing' ? 'bg-blue-100 text-blue-700' : order.status === 'shipped' ? 'bg-emerald-100 text-emerald-700' : order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' : order.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-700'}`}>
                  {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Pending'}
                </span>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
              <div>
                <span className="font-medium text-slate-900">Items:</span> {Array.isArray(order.items) ? order.items.length : 0}
              </div>
              <div>
                <span className="font-medium text-slate-900">Total:</span> ${Number(order.total || 0).toFixed(2)}
              </div>
            </div>

            <div className="mt-4">
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate(`/order-details/${order._id}`)}
              >
                View details
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
