import mongoose from "mongoose";
import Product from "../models/product.model.js";

const hasProduct = (customer, productId) =>
  customer.wishlist.some((id) => (id._id ?? id).toString() === productId);

// POST /wishlist/:productId
export const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    if (hasProduct(req.user, productId)) {
      return res.status(409).json({ success: false, message: "Product already in wishlist" });
    }
    req.user.wishlist.push(product._id);
    await req.user.save();
    res.status(201).json({ success: true, message: "Product added to wishlist" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Could not update wishlist" });
  }
};

// GET /wishlist
export const getWishlist = async (req, res) => {
  try {
    await req.user.populate({ path: "wishlist", select: "name price category image stock" });
    const wishlist = req.user.wishlist.filter(Boolean); // skip deleted products
    res.json({ success: true, count: wishlist.length, wishlist });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Could not load wishlist" });
  }
};

// DELETE /wishlist/:productId
export const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }
    if (!hasProduct(req.user, productId)) {
      return res.status(404).json({ success: false, message: "Product not in wishlist" });
    }
    req.user.wishlist = req.user.wishlist.filter((id) => id.toString() !== productId);
    await req.user.save();
    res.json({ success: true, message: "Product removed from wishlist" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Could not update wishlist" });
  }
};
