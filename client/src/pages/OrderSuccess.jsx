import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';
import api from '../services/api.js';
import Button from '../components/ui/Button.jsx';

export default function OrderSuccess() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const sessionId = new URLSearchParams(location.search).get('session_id');
  const orderId = new URLSearchParams(location.search).get('orderId');

  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [orderStatus, setOrderStatus] = useState('pending');
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    if (!sessionId || !orderId) {
      setPaymentStatus('failed');
      setOrderStatus('failed');
      return;
    }

    setLoading(true);
    api
      .get(`/orders/${orderId}`)
      .then((response) => {
        const orderData = response.data?.data || response.data;
        setOrder(orderData);
        setPaymentStatus(orderData.paymentStatus || 'pending');
        setOrderStatus(orderData.status || 'pending');
        setTotal(Number(orderData.total || 0));
      })
      .catch((err) => {
        console.error('[order-success] Error:', err.message);
        setPaymentStatus('failed');
        setOrderStatus('failed');
      })
      .finally(() => setLoading(false));
  }, [sessionId, orderId, user, navigate]);

  if (!user) return null;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600"></div>
          <h3 className="text-lg font-semibold text-slate-900">Payment processing...</h3>
          <p className="text-sm text-slate-500">Verifying payment state...</p>
        </div>
      </div>
    );
  }

  if (!order && !loading) {
    return (
      <div className="py-12 text-center">
        <h3 className="text-xl font-semibold text-slate-900">Order could not be verified</h3>
        <p className="mt-2 text-sm text-slate-500">The order could not be located. Please contact support.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/cart')}>
          Back to cart
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <p className="text-sm font-medium text-emerald-600">Order confirmation</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Thanks for your order</h1>
        <p className="mt-2 text-sm text-slate-500">Order {order.orderNumber || 'created'} is saved to your account.</p>
      </div>

      <div className="mb-8 rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <div className="mb-4 grid grid-cols-2 gap-4">
          <div>
            <p className="mb-2 text-sm text-slate-500">Payment status</p>
            <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' : paymentStatus === 'failed' ? 'bg-red-100 text-red-700' : paymentStatus === 'refunded' ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-200 text-slate-700'}`}>
              {paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1)}
            </span>
          </div>
          <div>
            <p className="mb-2 text-sm text-slate-500">Order status</p>
            <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${orderStatus === 'processing' ? 'bg-blue-100 text-blue-700' : orderStatus === 'shipped' ? 'bg-emerald-100 text-emerald-700' : orderStatus === 'delivered' ? 'bg-emerald-100 text-emerald-700' : orderStatus === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-700'}`}>
              {orderStatus.charAt(0).toUpperCase() + orderStatus.slice(1)}
            </span>
          </div>
        </div>

        {paymentStatus === 'paid' ? (
          <div>
            <p className="mb-1 text-sm text-slate-500">Payment date</p>
            <p className="text-slate-800">{order.paidAt ? new Date(order.paidAt).toLocaleString() : 'Confirmed'}</p>
          </div>
        ) : paymentStatus === 'pending' ? (
          <p className="text-sm text-slate-600">Payment is being confirmed by our payment processor.</p>
        ) : (
          <p className="text-sm text-red-600">Payment was not completed.</p>
        )}
      </div>

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="mb-2 text-sm text-slate-500">Order total</p>
        <span className="text-2xl font-semibold text-slate-900">${Number(total || 0).toFixed(2)}</span>
        <div className="mt-4 grid gap-4 border-t border-slate-200 pt-4 sm:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-slate-900">Shipping to</p>
            <p className="mt-1 text-sm text-slate-600">{order.shippingAddress?.fullName}</p>
            <p className="text-sm text-slate-600">{order.shippingAddress?.addressLine1}</p>
            <p className="text-sm text-slate-600">{order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.postalCode}</p>
            <p className="text-sm text-slate-600">{order.shippingAddress?.country}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900">Items</p>
            <div className="mt-1 space-y-1">
              {(order.items || []).map((item) => (
                <p key={`${item.product}-${item.productName}`} className="text-sm text-slate-600">{item.productName} × {item.quantity}</p>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button width="100%" variant="primary" onClick={() => navigate('/orders')}>View your orders</Button>
        <Button width="100%" variant="outline" onClick={() => navigate('/products')}>Continue shopping</Button>
      </div>
    </div>
  );
}