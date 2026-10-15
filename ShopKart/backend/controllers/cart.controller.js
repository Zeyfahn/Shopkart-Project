import mongoose from "mongoose";
import Product from "../models/product.model.js";

// Populate each cart row's Product and return a clean array.
// Rows whose product was deleted from the catalogue are skipped.
const buildCartResponse = async (customer) => {
  await customer.populate("cart.product");
  return customer.cart
    .filter((item) => item.product)
    .map((item) => ({
      product: {
        _id: item.product._id,
        name: item.product.name,
        price: item.product.price,
        image: item.product.image,
        category: item.product.category,
        stock: item.product.stock,
      },
      quantity: item.quantity,
    }));
};

// Compare ids as strings so this works before and after populate.
const rowId = (item) => (item.product._id ?? item.product).toString();
const findItem = (customer, productId) =>
  customer.cart.find((item) => rowId(item) === productId);

const badId = (res) =>
  res.status(400).json({ success: false, message: "Invalid product ID" });

// GET /cart
export const getCart = async (req, res) => {
  try {
    const cart = await buildCartResponse(req.user);
    res.json({ success: true, cart });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Could not load cart" });
  }
};

// POST /cart/:productId  -> add 1 (or increase the existing row by 1)
export const addToCart = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!mongoose.isValidObjectId(productId)) return badId(res);

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const customer = req.user;
    const item = findItem(customer, productId);
    const newQuantity = (item ? item.quantity : 0) + 1;

    if (newQuantity > product.stock) {
      return res.status(400).json({
        success: false,
        message:
          product.stock === 0
            ? "This product is out of stock"
            : `Only ${product.stock} unit${product.stock === 1 ? "" : "s"} available`,
      });
    }

    if (item) item.quantity = newQuantity;
    else customer.cart.push({ product: product._id, quantity: 1 });

    await customer.save();
    res.json({ success: true, message: "Cart updated", cart: await buildCartResponse(customer) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Could not update cart" });
  }
};

// PATCH /cart/:productId   body: { quantity }
export const updateQuantity = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!mongoose.isValidObjectId(productId)) return badId(res);
    if (typeof quantity !== "number" || !Number.isInteger(quantity)) {
      return res
        .status(400)
        .json({ success: false, message: "Quantity must be a whole number" });
    }
    if (quantity < 1) {
      return res.status(400).json({ success: false, message: "Quantity must be at least 1" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const customer = req.user;
    const item = findItem(customer, productId);
    if (!item) {
      return res.status(404).json({ success: false, message: "Product is not in your cart" });
    }

    if (quantity > product.stock) {
      return res
        .status(400)
        .json({ success: false, message: `Only ${product.stock} available in stock` });
    }

    item.quantity = quantity;
    await customer.save();
    res.json({ success: true, message: "Quantity updated", cart: await buildCartResponse(customer) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Could not update quantity" });
  }
};

// DELETE /cart/:productId
export const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!mongoose.isValidObjectId(productId)) return badId(res);

    const customer = req.user;
    if (!findItem(customer, productId)) {
      return res.status(404).json({ success: false, message: "Product is not in your cart" });
    }

    // Works even if the product itself was deleted from the catalogue.
    customer.cart = customer.cart.filter((item) => rowId(item) !== productId);
    await customer.save();
    res.json({ success: true, message: "Item removed", cart: await buildCartResponse(customer) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Could not remove item" });
  }
};
