import jwt from "jsonwebtoken";
import Customer from "../models/customer.model.js";

export const protect = async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const customer = await Customer.findById(decoded.id).select("-password");
    if (!customer) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    req.user = customer; // the server decides who you are, never the client
    next();
  } catch {
    res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};
