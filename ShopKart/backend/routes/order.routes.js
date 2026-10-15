import { Router } from "express";
import {
  createPaymentOrder,
  verifyPayment,
  getOrders,
  getOrder,
} from "../controllers/order.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(protect);

router.post("/create-payment-order", createPaymentOrder);
router.post("/verify-payment", verifyPayment);
router.get("/", getOrders);
router.get("/:id", getOrder);

export default router;
