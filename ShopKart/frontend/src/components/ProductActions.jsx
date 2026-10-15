import { useState } from "react";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";

// Add-to-cart + wishlist buttons, shared by the product card and details page.
export default function ProductActions({ product }) {
  const { addToCart, isPending: cartPending, quantityOf } = useCart();
  const { addToWishlist, removeFromWishlist, isWishlisted, isPending: wishPending } = useWishlist();
  const [message, setMessage] = useState("");

  const inCart = quantityOf(product._id);
  const outOfStock = product.stock === 0;
  const atLimit = inCart >= product.stock;
  const adding = cartPending(product._id);
  const saved = isWishlisted(product._id);
  const saving = wishPending(product._id);

  const handleAdd = async () => {
    setMessage("");
    const result = await addToCart(product._id);
    if (!result.ok) setMessage(result.message);
  };

  const handleWishlist = async () => {
    setMessage("");
    const result = saved
      ? await removeFromWishlist(product._id)
      : await addToWishlist(product);
    if (!result.ok) setMessage(result.message || "Unable to save product. Please try again.");
  };

  let cartLabel = "Add to Cart";
  if (adding) cartLabel = "Adding...";
  else if (outOfStock) cartLabel = "Out of stock";
  else if (atLimit) cartLabel = "Max in cart";
  else if (inCart > 0) cartLabel = "Add Another";

  return (
    <div className="actions">
      <button className="btn" onClick={handleAdd} disabled={adding || outOfStock || atLimit}>
        {cartLabel}
      </button>
      <button
        className="btn ghost"
        onClick={handleWishlist}
        disabled={saving}
        title={saved ? "Click to remove from wishlist" : undefined}
        aria-pressed={saved}
      >
        {saving ? "⏳ Saving..." : saved ? "♥ Added to Wishlist" : "♡ Add to Wishlist"}
      </button>
      {inCart > 0 && <p className="muted">{inCart} in your cart</p>}
      {message && <p className="error-text">{message}</p>}
    </div>
  );
}
