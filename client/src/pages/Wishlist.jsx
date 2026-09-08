import React from "react";
import Button from "../components/ui/Button.jsx";
import { useParams, useNavigate } from "react-router-dom";
import { useWishlist } from "../hooks/useWishlist.js";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext.jsx";

export function Wishlist() {
  const { user } = useContext(AuthContext);
  const {
    wishlist,
    products,
    loading,
    error,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
  } = useWishlist();

  const navigate = useNavigate();

  if (!user) {
    navigate("/login");
    return null;
  }

  useEffect(() => {
    if (!wishlist) getWishlist();
  }, [wishlist, getWishlist]);

  if (loading) {
    return <div>Loading wishlist...</div>;
  }

  if (error) {
    return <div className="text-red-600">Error: {error}</div>;
  }

  if (!products || products.length === 0) {
    return (
      <div className="py-12 text-center">
        <h3>Your wishlist is empty</h3>
        <p>Save products you love here.</p>
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
      <h2 className="text-xl font-bold">My Wishlist</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {products.map((item) => {
          const product = item.product;
          const inWishlist = isInWishlist(product._id);
          return (
            <div
              key={product._id}
              className="border rounded-lg p-4 hover:border-blue-500 transition-colors"
            >
              <img
                src={product.images?.[0] || "/placeholder.jpg"}
                alt={product.name}
                width="150"
                height="150"
                className="object-cover rounded mb-3"
              />
              <h3 className="font-medium truncate">{product.name}</h3>
              <p className="text-sm text-muted-foreground">{product.sku || ""}</p>
              <div className="mt-2">
                <span>
                  {product.rating?.toFixed(1) || "0"}★
                  {product.numReviews ? ` ({product.numReviews} reviews)` : ""}
                </span>
                <span className="ml-2">
                  {product.isActive && product.stock > 0 ? (
                    <span className="text-green-600">In stock</span>
                  ) : (
                    <span className="text-red-600">Out of stock</span>
                  )}
                </span>
              </div>
              <Button
                size="sm"
                variant={inWishlist ? "secondary" : "outline"}
                className="mt-2 w-full"
                onClick={() => removeFromWishlist(product._id)}
              >
                {inWishlist ? "Removed" : "Add to Wishlist"}
              </Button>
              <Button
                size="sm"
                variant="primary"
                mt-2
                className="hidden"
              >
                Add to Cart
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}