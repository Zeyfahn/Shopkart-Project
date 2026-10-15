import jwt from "jsonwebtoken";

export const generateToken = (customerId) =>
  jwt.sign({ id: customerId }, process.env.JWT_SECRET, { expiresIn: "7d" });

const isProd = process.env.NODE_ENV === "production";

// Local dev: frontend and API are both "localhost", so Lax works.
// Production: Vercel and Render are different sites, so the cookie must be
// SameSite=None, and browsers only accept that together with Secure.
export const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "none" : "lax",
};
