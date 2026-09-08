import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../hooks/useCart.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useApi } from '../hooks/useApi.jsx';
import Button from '../components/ui/Button.jsx';

export default function Checkout() {
  const { user } = useAuth();
  const { cart, loading, error, getCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const { api } = useApi();
  const [paying, setPaying] = useState(false);
  const [order, setOrder] = useState(null);

  if (!user) {
    navigate('/login');
    return null;
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="py-12 text-center">
        <h3>Cart is empty</h3>
        <p>Start shopping to add items to your cart.</p>
        <Button variant="outline" onClick={() => navigate('/products')}>
          Continue Shopping
        </Button>
      </div>
    );
  }

  const cartTotal = cart.items.reduce(
    (total, item) => total + (item.price || 0) * (item.quantity || 1),
    0
  );

  const handleCreateOrder = async () => {
    setPaying(true);
    try {
      const response = await api.post('/orders', {
        items: cart.items,
        total: cartTotal,
      });
      const data = response.data;
      setOrder(data);
      return data._id || data.id;
    } catch (err) {
      console.error('[checkout] Error creating order:', err.message);
      alert('Failed to create order');
      setPaying(false);
      return null;
    } finally {
      setPaying(false);
    }
  };

  const handleCreateCheckoutSession = async (orderId) => {
    setPaying(true);
    try {
      const response = await api.post(`/payments/create-checkout-session/${orderId}`, {}, {
        withCredentials: true,
      });

      const data = response.data;

      if (!response.ok || !data.url) {
        throw new Error(data.message || 'Failed to create checkout session');
      }

      window.location.href = data.url;
    } catch (err) {
      console.error('[checkout] Error:', err.message);
      alert(err.message || 'Failed to create checkout session');
    } finally {
      setPaying(false);
    }
  };

  // Check for session ID in URL (return from Stripe)
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const sessionId = searchParams.get('session_id');
    const orderId = searchParams.get('orderId');

    if (sessionId && orderId) {
      const timer = setTimeout(() => {
        navigate(`/order-success?session_id=${sessionId}&orderId=${orderId}`);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [location.search, navigate]);

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Checkout</h2>

      {loading || error ? (
        <div>
          {loading && <p>Loading checkout...</p>}
          {error && <p className="text-red-600">{error}</p>}
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <h3>Cart Items</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {cart.items.map((item) => (
                <div
                  key={item.product._id}
                  className="border rounded p-4"
                >
                  <img
                    src={item.images?.[0] || '/placeholder.jpg'}
                    alt={item.name}
                    width="80"
                    height="80"
                    className="object-cover rounded mb-3"
                  />
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.sku || ''}</p>
                    <p className="text-right">
                      ${(item.price || 0)
                        .toFixed(2)}

                      x {item.quantity || 1}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3>Order Total</h3>
            <div className="flex justify-between font-medium">
              <span>Subtotal</span>
              <span>${cartTotal.toFixed(2)}</span>
            </div>
          </div>

          {order ? (
            <div>
              <h3>Order Created</h3>
              <p>Order ID: {order.orderNumber || order._id}</p>
            </div>
          ) : (
            <Button
              width="100%"
              variant="primary"
              disabled={paying}
              onClick={() => handleCreateOrder()}
            >
              {paying ? 'Creating Order...' : 'Create Order'}
            </Button>
          )}

          {order && !paying ? (
            <Button
              width="100%"
              variant="primary"
              disabled={paying}
              onClick={() => handleCreateCheckoutSession(order._id || order.id)}
            >
              {paying ? 'Processing Payment...' : 'Pay Now'}
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}