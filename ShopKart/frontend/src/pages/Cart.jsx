import { Link } from "react-router-dom";
import CartItem from "../components/CartItem";
import { useCart } from "../context/CartContext";
import { formatPrice } from "../utils/format";

export default function Cart() {
  const { cartItems, loading, error, totalUnits, subtotal, refreshCart } = useCart();

  if (loading) return <p className="status">Loading your cart...</p>;

  if (error)
    return (
      <div className="status">
        <p>Unable to load your cart.</p>
        <button className="btn" onClick={refreshCart}>Try Again</button>
      </div>
    );

  if (cartItems.length === 0)
    return (
      <div className="status">
        <h2>Your cart is empty 🛒</h2>
        <p className="muted">Looks like you haven't added anything yet.</p>
        <Link to="/products" className="btn">Browse Products</Link>
      </div>
    );

  return (
    <main className="page cart-layout">
      <section>
        <h1>My Cart</h1>
        <ul className="cart-list">
          {cartItems.map((item) => (
            <CartItem key={item.product._id} item={item} />
          ))}
        </ul>
      </section>

      <aside className="summary">
        <h2>Order Summary</h2>
        <dl>
          <div><dt>Items</dt><dd>{totalUnits}</dd></div>
          <div className="total"><dt>Subtotal</dt><dd>{formatPrice(subtotal)}</dd></div>
        </dl>
        <Link to="/checkout" className="btn block">Proceed to Checkout</Link>
      </aside>
    </main>
  );
}
