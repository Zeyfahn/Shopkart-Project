import { useState } from "react";
import { useCart } from "../context/CartContext";
import { formatPrice } from "../utils/format";

export default function CartItem({ item }) {
  const { updateQuantity, removeFromCart, isPending } = useCart();
  const [message, setMessage] = useState("");

  const { product, quantity } = item;
  const busy = isPending(product._id); // only THIS row is disabled

  const run = async (action) => {
    setMessage("");
    const result = await action();
    if (!result.ok) setMessage(result.message);
  };

  return (
    <li className="cart-item">
      <img src={product.image} alt={product.name} />
      <div className="cart-info">
        <h3>{product.name}</h3>
        <p className="muted">{formatPrice(product.price)} each</p>
        <div className="qty">
          <button
            aria-label="Decrease quantity"
            disabled={busy || quantity <= 1}
            onClick={() => run(() => updateQuantity(product._id, quantity - 1))}
          >
            −
          </button>
          <span aria-live="polite">{quantity}</span>
          <button
            aria-label="Increase quantity"
            disabled={busy || quantity >= product.stock}
            onClick={() => run(() => updateQuantity(product._id, quantity + 1))}
          >
            +
          </button>
        </div>
        {quantity >= product.stock && (
          <p className="muted">Maximum available ({product.stock}) in your cart</p>
        )}
        {message && <p className="error-text">{message}</p>}
      </div>
      <div className="cart-side">
        <p className="line-total">{formatPrice(product.price * quantity)}</p>
        <button
          className="link-btn danger"
          disabled={busy}
          onClick={() => run(() => removeFromCart(product._id))}
        >
          {busy ? "Updating..." : "Remove"}
        </button>
      </div>
    </li>
  );
}
