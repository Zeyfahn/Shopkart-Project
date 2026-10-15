import axios from "axios";

// withCredentials lets the browser send/receive the HttpOnly JWT cookie.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  withCredentials: true,
});

export const getErrorMessage = (err) =>
  err.response?.data?.message || err.message || "Something went wrong";

export const authApi = {
  register: (data) => api.post("/customers/register", data),
  login: (data) => api.post("/customers/login", data),
  me: () => api.get("/customers/me"),
  logout: () => api.post("/customers/logout"),
};

export const productApi = {
  list: (params) => api.get("/products", { params }),
  get: (id) => api.get(`/products/${id}`),
};

export const wishlistApi = {
  get: () => api.get("/wishlist"),
  add: (productId) => api.post(`/wishlist/${productId}`),
  remove: (productId) => api.delete(`/wishlist/${productId}`),
};

export const orderApi = {
  createPayment: (shippingAddress) =>
    api.post("/orders/create-payment-order", { shippingAddress }),
  verify: (payload) => api.post("/orders/verify-payment", payload),
  list: () => api.get("/orders"),
  get: (id) => api.get(`/orders/${id}`),
};

export const cartApi = {
  get: () => api.get("/cart"),
  add: (productId) => api.post(`/cart/${productId}`),
  setQuantity: (productId, quantity) => api.patch(`/cart/${productId}`, { quantity }),
  remove: (productId) => api.delete(`/cart/${productId}`),
};
