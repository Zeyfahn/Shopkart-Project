import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ProductActions from "../components/ProductActions";
import { productApi, getErrorMessage } from "../services/api";
import { formatPrice } from "../utils/format";

export default function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    productApi
      .get(id)
      .then((res) => !cancelled && setProduct(res.data.product))
      .catch((err) => !cancelled && setError(getErrorMessage(err)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id, attempt]);

  if (loading) return <p className="status">Loading product...</p>;
  if (error)
    return (
      <div className="status">
        <p>{error}</p>
        <button className="btn" onClick={() => setAttempt((a) => a + 1)}>Try Again</button>{" "}
        <Link to="/products" className="btn ghost">Back to products</Link>
      </div>
    );

  return (
    <main className="page details">
      <img src={product.image} alt={product.name} />
      <section>
        <Link to="/products">← All products</Link>
        <h1>{product.name}</h1>
        <p className="category">{product.category}</p>
        <p className="price big">{formatPrice(product.price)}</p>
        <p>{product.description}</p>
        <p className="stock">
          {product.stock === 0 ? "Out of stock" : `${product.stock} units in stock`}
        </p>
        <ProductActions product={product} />
      </section>
    </main>
  );
}
