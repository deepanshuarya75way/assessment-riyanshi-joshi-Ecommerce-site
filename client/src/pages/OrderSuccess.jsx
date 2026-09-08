import React, { useState, useEffect, useLocation } from 'react';
import useAuth from '../hooks/useAuth.js';
import { useNavigate, useLocation as useRouterLocation } from 'react-router-dom';
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
  const [confirming, setConfirming] = useState(false);
  const [order, setOrder] = useState(null);

  if (!user) {
    navigate('/login');
    return null;
  }

  useEffect(() => {
    if (!sessionId || !orderId) {
      setPaymentStatus('failed');
      setOrderStatus('failed');
      return;
    }

    setConfirming(true);
    fetch(`/api/orders/${orderId}`, {
      credentials: 'include',
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load order');
        return res.json();
      })
      .then((data) => {
        const orderData = data.data || data;
        setOrder(orderData);
        setPaymentStatus(orderData.paymentStatus || 'pending');
        setOrderStatus(orderData.status || 'pending');
        setTotal(orderData.total || 0);
        setConfirming(false);
      })
      .catch((err) => {
        console.error('[order-success] Error:', err.message);
        setPaymentStatus('failed');
        setOrderStatus('failed');
        setConfirming(false);
      });
  }, [sessionId, orderId, user]);

  if (confirming) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4"></div>
          <h3>Payment processing...</h3>
          <p>Verifying payment state...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-12 text-center">
        <h3>Order not found</h3>
        <p>The order could not be located. Please contact support.</p>
        <Button variant="outline" onClick={() => window.history.back()}>
          Back to Cart
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">
        Order {order.orderNumber || ''}
      </h2>

      <div className="bg-slate-50 rounded p-6 mb-8">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Payment Status</p>
            <span
              className={`px-3 py-1 rounded text-sm font-medium ${paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : paymentStatus === 'failed' ? 'bg-red-100 text-red-800' : paymentStatus === 'refunded' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}
            >
              {paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1)}
            </span>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">Order Status</p>
            <span
              className={`px-3 py-1 rounded text-sm font-medium ${orderStatus === 'processing' ? 'bg-blue-100 text-blue-800' : orderStatus === 'shipped' ? 'bg-green-100 text-green-800' : orderStatus === 'delivered' ? 'bg-green-100 text-green-800' : orderStatus === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}
            >
              {orderStatus.charAt(0).toUpperCase() + orderStatus.slice(1)}
            </span>
          </div>
        </div>

        {paymentStatus === 'paid' ? (
          <div>
            <p className="text-sm text-muted-foreground mb-2">Payment Date</p>
            <p>{new Date(order.paidAt).toLocaleDateString()}</p>
          </div>
        ) : paymentStatus === 'pending' ? (
          <p className="text-sm text-muted-foreground">
            Payment is being confirmed by our payment processor.
          </p>
        ) : (
          <p className="text-sm text-red-600">
            Payment was not completed.
          </p>
        )}
      </div>

      <div>
        <p className="text-sm text-muted-foreground mb-3">Order Total</p>
        <span className="text-2xl font-medium">${total.toFixed(2)}</span>
      </div>

      <Button
        width="100%"
        variant="primary"
        onClick={() => window.history.back()}
      >
        My Orders
      </Button>
    </div>
  );
}