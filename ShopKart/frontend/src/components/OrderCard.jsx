import { Link } from "react-router-dom";
import { formatDate, formatPrice, shortId } from "../utils/format";

export default function OrderCard({ order }) {
  return (
    <li className="order-card">
      <div className="order-head">
        <div>
          <h3>Order #{shortId(order._id)}</h3>
          <p className="muted">{formatDate(order.createdAt)}</p>
        </div>
        <span className={`badge ${order.status.toLowerCase()}`}>{order.status}</span>
      </div>
      <ul className="order-items">
        {order.items.map((item) => (
          <li key={item.product}>
            {item.name} × {item.quantity}
          </li>
        ))}
      </ul>
      <div className="order-foot">
        <strong>Total: {formatPrice(order.totalAmount)}</strong>
        <Link to={`/orders/${order._id}`} className="btn ghost">
          View Details
        </Link>
      </div>
    </li>
  );
}
