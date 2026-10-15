import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";
import Wishlist from "./pages/Wishlist";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import OrderDetails from "./pages/OrderDetails";

const guard = (el) => <ProtectedRoute>{el}</ProtectedRoute>;

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to="/products" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/products" element={guard(<Products />)} />
        <Route path="/products/:id" element={guard(<ProductDetails />)} />
        <Route path="/wishlist" element={guard(<Wishlist />)} />
        <Route path="/cart" element={guard(<Cart />)} />
        <Route path="/checkout" element={guard(<Checkout />)} />
        <Route path="/orders" element={guard(<Orders />)} />
        <Route path="/orders/:id" element={guard(<OrderDetails />)} />
        <Route path="/order-success/:id" element={guard(<OrderDetails celebrate />)} />
        <Route path="*" element={<Navigate to="/products" replace />} />
      </Routes>
    </>
  );
}
