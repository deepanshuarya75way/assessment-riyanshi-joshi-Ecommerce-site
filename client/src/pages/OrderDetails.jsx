import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';
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
        setLoading(false);
      })
      .catch((err) => {
        console.error('[order-details] Error:', err.message);
        setError(err.response?.data?.message || 'Failed to load order');
        setLoading(false);
      });
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4"></div>
          <h3>Loading order details...</h3>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <h3>Order not found</h3>
        <p>{error}</p>
        <Button variant="outline" onClick={() => window.history.back()}>
          Back
        </Button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-12 text-center">
        <h3>Order not found</h3>
        <p>The order could not be located.</p>
        <Button variant="outline" onClick={() => window.history.back()}>
          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Order Details</h2>

      <div className="bg-slate-50 rounded p-6 mb-8">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Order Number</p>
            <p className="text-lg font-medium">{order.orderNumber}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">Date</p>
            <p>{new Date(order.createdAt).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">Payment Status</p>
            <span
              className={`px-3 py-1 rounded text-sm font-medium ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : order.paymentStatus === 'failed' ? 'bg-red-100 text-red-800' : order.paymentStatus === 'refunded' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}
            >
              {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
            </span>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">Order Status</p>
            <span
              className={`px-3 py-1 rounded text-sm font-medium ${order.status === 'processing' ? 'bg-blue-100 text-blue-800' : order.status === 'shipped' ? 'bg-green-100 text-green-800' : order.status === 'delivered' ? 'bg-green-100 text-green-800' : order.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}
            >
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">Payment Provider</p>
            <span className="text-medium">{order.paymentProvider || 'N/A'}</span>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">Paid Date</p>
            <p>{order.paidAt ? new Date(order.paidAt).toLocaleDateString() : 'N/A'}</p>
          </div>
        </div>
      </div>

      <div>
        <p className="text-sm text-muted-foreground mb-3">Order Total</p>
        <span className="text-3xl font-medium">${order.total.toFixed(2)}</span>
      </div>

      <h3 className="text-semibold mb-4">Items</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {order.items.map((item) => (
          <div
            key={item.product || item.productName}
            className="border rounded p-3"
          >
            <img
              src={item.image || '/placeholder.jpg'}
              alt={item.productName}
              width="80"
              height="80"
              className="object-cover rounded mb-3"
            />
            <div>
              <p className="font-medium">{item.productName}</p>
              <p className="text-sm text-muted-foreground">{item.quantity}x @ ${item.price.toFixed(2)} each</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 pt-6 border-t">
        <Button width="100%" variant="primary" onClick={() => window.history.back()}>
          Back to Orders
        </Button>
      </div>
    </div>
  );
}