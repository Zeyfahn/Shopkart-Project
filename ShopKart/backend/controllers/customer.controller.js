import bcrypt from "bcrypt";
import Customer from "../models/customer.model.js";
import { generateToken, cookieOptions } from "../utils/generateToken.js";

const publicCustomer = (c) => ({
  _id: c._id,
  fullName: c.fullName,
  email: c.email,
  phone: c.phone,
});

export const register = async (req, res) => {
  try {
    const { fullName, email, password, phone } = req.body;

    if (!fullName || !email || !password || !phone) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ success: false, message: "Password must be at least 6 characters" });
    }

    const exists = await Customer.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const customer = await Customer.create({ fullName, email, password: hashed, phone });

    res.status(201).json({
      success: true,
      message: "Customer registered successfully",
      customer: publicCustomer(customer),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Registration failed" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const invalid = () =>
      res.status(401).json({ success: false, message: "Invalid credentials" });

    if (!email || !password) return invalid();

    const customer = await Customer.findOne({ email: email.toLowerCase() });
    if (!customer) return invalid();

    const match = await bcrypt.compare(password, customer.password);
    if (!match) return invalid();

    res.cookie("token", generateToken(customer._id), {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({
      success: true,
      message: "Login successful",
      customer: publicCustomer(customer),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Login failed" });
  }
};

export const me = (req, res) => {
  res.json({ success: true, customer: publicCustomer(req.user) });
};

export const logout = (req, res) => {
  res.clearCookie("token", cookieOptions);
  res.json({ success: true, message: "Logged out successfully" });
};
