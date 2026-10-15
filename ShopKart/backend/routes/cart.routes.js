import { Router } from "express";
import {
  getCart,
  addToCart,
  updateQuantity,
  removeFromCart,
} from "../controllers/cart.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(protect); // every cart route needs a logged-in customer

router.get("/", getCart);
router.post("/:productId", addToCart);
router.patch("/:productId", updateQuantity);
router.delete("/:productId", removeFromCart);

export default router;
