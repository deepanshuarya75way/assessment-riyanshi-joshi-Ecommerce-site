import express from "express";
import * as cartController from "../controllers/cart.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", authenticate, cartController.getCart);
router.post("/", authenticate, cartController.addToCart);
router.put("/:productId", authenticate, cartController.updateCartItem);
router.delete("/:productId", authenticate, cartController.removeCartItem);
router.delete("/", authenticate, cartController.clearCart);

export default router;