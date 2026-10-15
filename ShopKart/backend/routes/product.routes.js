import { Router } from "express";
import { createProduct, getProducts, getProduct } from "../controllers/product.controller.js";

const router = Router();

router.post("/", createProduct);
router.get("/", getProducts);
router.get("/:id", getProduct);

export default router;
