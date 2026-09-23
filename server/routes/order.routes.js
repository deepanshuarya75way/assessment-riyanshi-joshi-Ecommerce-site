import express from "express";
import * as orderController from "../controllers/order.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", authenticate, orderController.createOrderFromCart);
router.get("/", authenticate, orderController.getUserOrders);
router.post("/checkout-session/:orderId", authenticate, orderController.createCheckoutSession);
router.post("/webhook", orderController.webhook);
router.get("/:orderId", authenticate, orderController.getOrderDetails);
router.put("/:orderId/cancel", authenticate, orderController.cancelOrder);

export default router;