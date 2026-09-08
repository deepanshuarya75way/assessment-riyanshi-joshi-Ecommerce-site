import React, { useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCart } from "../hooks/useCart.js";
import { AuthContext } from "../context/AuthContext.jsx";
import { CartItem } from "../components/CartItem.jsx";
import { CartSummary } from "../components/CartSummary.jsx";
import Button from "../components/ui/Button.jsx";

export function Cart() {
  const { user } = useContext(AuthContext);
  const { cart, loading, error, getCart, addToCart, removeCartItem, clearCart } =
    useCart();
  const navigate = useNavigate();

  if (!user) {
    navigate("/login");
    return null;
  }

  useEffect(() => {
    getCart();
  }, [getCart]);

  if (loading) {
    return <div>Loading cart...</div>;
  }

  if (error) {
    return <div className="text-red-600">Error: {error}</div>;
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="py-12 text-center">
        <h3>Your cart is empty</h3>
        <p>Start shopping to add items to your cart.</p>
        <Button
          variant="outline"
          onClick={() => navigate("/products")}
        >
          Continue Shopping
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h2 className="text-xl font-bold">Shopping Cart</h2>
        <CartSummary />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cart.items.map((item) => (
          <CartItem key={item.product._id} product={item} />
        ))}
      </div>
      <Button
        width="100%"
        variant="primary"
        className="mt-4"
        onClick={() => navigate("/checkout")}
      >
        Proceed to Checkout
      </Button>
    </div>
  );
}