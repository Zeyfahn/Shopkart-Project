import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { totalUnits } = useCart(); // same state the Cart page reads
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="navbar">
      <NavLink to="/products" className="brand">
        ShopKart
      </NavLink>
      <nav>
        {user ? (
          <>
            <NavLink to="/products">Products</NavLink>
            <NavLink to="/wishlist">Wishlist</NavLink>
            <NavLink to="/cart">Cart ({totalUnits})</NavLink>
            <NavLink to="/orders">Orders</NavLink>
            <button className="link-btn" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login">Login</NavLink>
            <NavLink to="/register">Register</NavLink>
          </>
        )}
      </nav>
    </header>
  );
}
