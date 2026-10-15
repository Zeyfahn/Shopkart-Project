import { useEffect, useState } from "react";
import ProductCard from "../components/ProductCard";
import { productApi, getErrorMessage } from "../services/api";

const CATEGORIES = ["Electronics", "Fashion", "Books", "Home"];

export default function Products() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0); // bump to retry

  // Refetch from the backend whenever the filters change (search is debounced).
  useEffect(() => {
    let cancelled = false; // ignore out-of-order responses
    const timer = setTimeout(
      async () => {
        setLoading(true);
        setError("");
        try {
          const res = await productApi.list({
            search: search.trim() || undefined,
            category: category || undefined,
          });
          if (!cancelled) setProducts(res.data.products);
        } catch (err) {
          if (!cancelled) setError(getErrorMessage(err));
        } finally {
          if (!cancelled) setLoading(false);
        }
      },
      search ? 300 : 0
    );
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search, category, attempt]);

  return (
    <main className="page">
      <h1>Products</h1>
      <div className="filters">
        <input
          type="search"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search products"
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {loading && <p className="status">Loading products...</p>}
      {!loading && error && (
        <div className="status">
          <p>Something went wrong while loading products.</p>
          <button className="btn" onClick={() => setAttempt((a) => a + 1)}>Try Again</button>
        </div>
      )}
      {!loading && !error && products.length === 0 && <p className="status">No products found.</p>}
      {!loading && !error && products.length > 0 && (
        <div className="grid">
          {products.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      )}
    </main>
  );
}
