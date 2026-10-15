import crypto from "crypto";
import mongoose from "mongoose";
import Product from "../models/product.model.js";
import Order from "../models/order.model.js";
import { getRazorpay } from "../config/razorpay.js";

const PHONE_RE = /^(\+91[\s-]?)?[6-9]\d{9}$/;
const PINCODE_RE = /^\d{6}$/;
const FIELDS = [
  ["fullName", "Full name"],
  ["phone", "Phone"],
  ["addressLine1", "Address"],
  ["city", "City"],
  ["state", "State"],
  ["pincode", "Pincode"],
];

// Returns { error } or { address } (trimmed, only the known fields).
const validateShipping = (raw) => {
  if (!raw || typeof raw !== "object") return { error: "Shipping address is required" };
  const address = {};
  for (const [key, label] of FIELDS) {
    const value = typeof raw[key] === "string" ? raw[key].trim() : "";
    if (!value) return { error: `${label} is required` };
    address[key] = value;
  }
  if (!PHONE_RE.test(address.phone)) return { error: "Enter a valid 10-digit phone number" };
  if (!PINCODE_RE.test(address.pincode)) return { error: "Pincode must contain 6 digits" };
  return { address };
};

// POST /orders/create-payment-order
export const createPaymentOrder = async (req, res) => {
  try {
    // Only the shipping address is read from the body. Any total/items sent are ignored.
    const { error, address } = validateShipping(req.body.shippingAddress);
    if (error) return res.status(400).json({ success: false, message: error });

    const customer = req.user;
    if (customer.cart.length === 0) {
      return res.status(400).json({ success: false, message: "Your cart is empty" });
    }

    // Reload the LATEST product data, then re-check existence and stock.
    const products = await Product.find({ _id: { $in: customer.cart.map((i) => i.product) } });
    const byId = new Map(products.map((p) => [p._id.toString(), p]));

    const items = [];
    let total = 0;
    for (const row of customer.cart) {
      const product = byId.get(row.product.toString());
      if (!product) {
        return res.status(400).json({
          success: false,
          message: "A product in your cart is no longer available. Remove it and try again.",
        });
      }
      if (row.quantity > product.stock) {
        return res
          .status(400)
          .json({ success: false, message: `Insufficient stock for ${product.name}.` });
      }
      items.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: row.quantity,
        image: product.image,
      });
      total += product.price * row.quantity;
    }
    total = Math.round(total * 100) / 100; // the server owns the total

    const order = await Order.create({
      user: customer._id,
      items,
      shippingAddress: address,
      totalAmount: total,
    });

    let razorpayOrder;
    try {
      razorpayOrder = await getRazorpay().orders.create({
        amount: Math.round(total * 100), // rupees -> paise
        currency: "INR",
        receipt: order._id.toString(),
      });
    } catch (err) {
      await Order.deleteOne({ _id: order._id }); // no orphan pending order; cart untouched
      if (err.message === "RAZORPAY_NOT_CONFIGURED") {
        return res
          .status(500)
          .json({ success: false, message: "Payment gateway is not configured on the server" });
      }
      console.error("Razorpay order creation failed:", err);
      return res
        .status(502)
        .json({ success: false, message: "Could not start payment. Please try again." });
    }

    order.razorpayOrderId = razorpayOrder.id;
    await order.save();

    res.status(201).json({
      success: true,
      shopKartOrderId: order._id,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID, // key id is public; the secret never leaves the server
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Could not create order" });
  }
};

// POST /orders/verify-payment
export const verifyPayment = async (req, res) => {
  try {
    const { shopKartOrderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    const allStrings = [shopKartOrderId, razorpay_order_id, razorpay_payment_id, razorpay_signature]
      .every((v) => typeof v === "string" && v);
    if (!allStrings) {
      return res.status(400).json({ success: false, message: "Missing payment details" });
    }
    if (!mongoose.isValidObjectId(shopKartOrderId)) {
      return res.status(400).json({ success: false, message: "Invalid order ID" });
    }

    // Must be this user's order.
    const order = await Order.findOne({ _id: shopKartOrderId, user: req.user._id });
    if (!order || !order.razorpayOrderId) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    if (razorpay_order_id !== order.razorpayOrderId) {
      return res
        .status(400)
        .json({ success: false, message: "Payment does not match this order" });
    }
    if (!process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ success: false, message: "Payment gateway is not configured" });
    }

    // HMAC over the order id WE stored (not one supplied by the browser) + payment id.
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${order.razorpayOrderId}|${razorpay_payment_id}`)
      .digest("hex");
    const a = Buffer.from(expected);
    const b = Buffer.from(razorpay_signature);
    const valid = a.length === b.length && crypto.timingSafeEqual(a, b);

    if (!valid) {
      // Order stays PENDING and the cart is NOT cleared.
      return res.status(400).json({ success: false, message: "Invalid payment signature" });
    }

    if (order.paymentStatus !== "PAID") {
      order.paymentStatus = "PAID";
      order.status = "PLACED";
      order.razorpayPaymentId = razorpay_payment_id;
      await order.save();
    }

    // Only now, after verified payment, is the cart cleared.
    req.user.cart = [];
    await req.user.save();

    res.json({ success: true, message: "Payment verified. Order placed.", order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Could not verify payment" });
  }
};

// GET /orders  (paid orders only, newest first)
export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id, paymentStatus: "PAID" }).sort({
      createdAt: -1,
    });
    res.json({ success: true, count: orders.length, orders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Could not load orders" });
  }
};

// GET /orders/:id
export const getOrder = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid order ID" });
    }
    // Filtering by user means someone else's order is simply "not found".
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    res.json({ success: true, order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Could not load order" });
  }
};
