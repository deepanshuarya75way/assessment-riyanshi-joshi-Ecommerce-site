import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';
import api from '../services/api.js';
import Button from '../components/ui/Button.jsx';

export default function OrderDetails() {
  const { user } = useAuth();
  const { orderId } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!orderId) {
      setError('Order ID not provided');
      setLoading(false);
      return;
    }

    api
      .get(`/orders/${orderId}`)
      .then((response) => {
        const orderData = response.data?.data || response.data;
        setOrder(orderData);
        setLoading(false);
      })
      .catch((err) => {
        console.error('[order-details] Error:', err.message);
        setError(err.response?.data?.message || err.message || 'Failed to load order');
        setLoading(false);
      });
  }, [orderId]);

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center px-4 py-12">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
          <h3 className="text-lg font-semibold text-slate-900">Loading order details...</h3>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-slate-900">Order not found</h1>
        <p className="mt-2 text-sm text-slate-500">{error}</p>
        <Button variant="outline" className="mt-5" onClick={() => window.history.back()}>
          Back to orders
        </Button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-slate-900">Order not found</h1>
        <p className="mt-2 text-sm text-slate-500">The order could not be located.</p>
        <Button variant="outline" className="mt-5" onClick={() => window.history.back()}>
          Back to orders
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-indigo-600">Purchase history</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Order details</h1>
        </div>
        <Button variant="outline" size="small" onClick={() => window.history.back()}>Back to orders</Button>
      </div>

      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="mb-2 text-sm text-slate-500">Order number</p>
            <p className="text-lg font-semibold text-slate-900">{order.orderNumber}</p>
          </div>
          <div>
            <p className="mb-2 text-sm text-slate-500">Date</p>
            <p className="text-slate-800">{new Date(order.createdAt).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="mb-2 text-sm text-slate-500">Payment status</p>
            <span
              className={`px-3 py-1 rounded text-sm font-medium ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : order.paymentStatus === 'failed' ? 'bg-red-100 text-red-800' : order.paymentStatus === 'refunded' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}
            >
              {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
            </span>
          </div>
          <div>
            <p className="mb-2 text-sm text-slate-500">Order status</p>
            <span
              className={`px-3 py-1 rounded text-sm font-medium ${order.status === 'processing' ? 'bg-blue-100 text-blue-800' : order.status === 'shipped' ? 'bg-green-100 text-green-800' : order.status === 'delivered' ? 'bg-green-100 text-green-800' : order.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}
            >
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
          </div>
          <div>
            <p className="mb-2 text-sm text-slate-500">Payment provider</p>
            <span className="text-slate-800">{order.paymentProvider || 'Not available'}</span>
          </div>
          <div>
            <p className="mb-2 text-sm text-slate-500">Paid date</p>
            <p className="text-slate-800">{order.paidAt ? new Date(order.paidAt).toLocaleDateString() : 'Not available'}</p>
          </div>
        </div>
      </div>

      <div>
        <p className="text-sm text-slate-500">Order total</p>
        <span className="text-3xl font-bold text-slate-900">${Number(order.total || 0).toFixed(2)}</span>
      </div>

      <h2 className="mb-4 text-lg font-semibold text-slate-900">Items</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {order.items.map((item) => (
          <div
            key={item.product || item.productName}
            className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            {item.image ? (
              <img src={item.image} alt={item.productName} width="80" height="80" className="h-20 w-20 rounded-xl object-cover" />
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-400">No image</div>
            )}
            <div>
              <p className="font-medium text-slate-900">{item.productName}</p>
              <p className="mt-1 text-sm text-slate-500">{item.quantity} × ${Number(item.price || 0).toFixed(2)} each</p>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}