import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { useWishlist } from "../context/WishlistContext";

export default function Wishlist() {
  const { items, loading, error, refresh } = useWishlist();

  if (loading) return <p className="status">Loading your wishlist...</p>;
  if (error)
    return (
      <div className="status">
        <p>Unable to load wishlist.</p>
        <button className="btn" onClick={refresh}>Try Again</button>
      </div>
    );
  if (items.length === 0)
    return (
      <div className="status">
        <h2>Your wishlist is empty ❤️</h2>
        <p className="muted">Start saving products you love.</p>
        <Link to="/products" className="btn">Browse Products</Link>
      </div>
    );

  return (
    <main className="page">
      <h1>My Wishlist</h1>
      <p className="muted">{items.length} product{items.length === 1 ? "" : "s"} saved</p>
      <div className="grid">
        {items.map((p) => (
          <ProductCard key={p._id} product={p} />
        ))}
      </div>
    </main>
  );
}
