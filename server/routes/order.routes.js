import express from "express";
import * as orderController from "../controllers/order.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/orders/create", authenticate, orderController.createOrderFromCart);
router.post("/payments/create-checkout-session/:orderId", authenticate, orderController.createCheckoutSession);
router.post("/payments/webhook", orderController.webhook);
router.get("/orders/me", authenticate, orderController.getUserOrders);
router.get("/orders/:orderId", authenticate, orderController.getOrderDetails);
router.post("/orders/:orderId/cancel", authenticate, orderController.cancelOrder);

export default router;