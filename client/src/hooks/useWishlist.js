import { useContext } from "react";
import { WishlistContext } from "../context/WishlistContext.jsx";

export function useWishlist() {
  return useContext(WishlistContext);
}