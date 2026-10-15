import { Link } from "react-router-dom";
import ProductActions from "./ProductActions";
import { formatPrice } from "../utils/format";

export default function ProductCard({ product }) {
  return (
    <article className="product-card">
      <Link to={`/products/${product._id}`}>
        <img src={product.image} alt={product.name} loading="lazy" />
      </Link>
      <div className="product-body">
        <p className="category">{product.category}</p>
        <h3>{product.name}</h3>
        <p className="price">{formatPrice(product.price)}</p>
        <p className="stock">
          {product.stock === 0 ? "Out of stock" : `${product.stock} units left`}
        </p>
        <Link to={`/products/${product._id}`} className="btn ghost">
          View Details
        </Link>
        <ProductActions product={product} />
      </div>
    </article>
  );
}
