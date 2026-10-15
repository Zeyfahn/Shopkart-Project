import mongoose from "mongoose";
import Product from "../models/product.model.js";

export const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, image, stock } = req.body;
    const product = await Product.create({ name, description, price, category, image, stock });
    res.status(201).json({ success: true, product });
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ success: false, message: err.message });
    }
    console.error(err);
    res.status(500).json({ success: false, message: "Could not create product" });
  }
};

export const getProducts = async (req, res) => {
  try {
    // Build the query dynamically from optional ?search= and ?category=
    const { search, category } = req.query;
    const escape = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // treat input as plain text
    const filter = {};
    if (typeof search === "string" && search.trim()) {
      filter.name = { $regex: escape(search.trim()), $options: "i" };
    }
    if (typeof category === "string" && category.trim()) {
      filter.category = { $regex: `^${escape(category.trim())}$`, $options: "i" };
    }

    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .select("name price category image stock");
    res.json({ success: true, count: products.length, products });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Could not load products" });
  }
};

export const getProduct = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    res.json({ success: true, product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Could not load product" });
  }
};
