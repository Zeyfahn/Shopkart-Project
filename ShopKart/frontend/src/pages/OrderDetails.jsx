import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { orderApi, getErrorMessage } from "../services/api";
import { formatDate, formatPrice } from "../utils/format";

// Used for both /orders/:id and the post-payment /order-success/:id screen.
export default function OrderDetails({ celebrate = false }) {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    orderApi
      .get(id)
      .then((res) => !cancelled && setOrder(res.data.order))
      .catch((err) => !cancelled && setError(getErrorMessage(err)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id, attempt]);

  if (loading) return <p className="status">Loading order...</p>;
  if (error)
    return (
      <div className="status">
        <p>{error}</p>
        <button className="btn" onClick={() => setAttempt((a) => a + 1)}>Try Again</button>{" "}
        <Link to="/orders" className="btn ghost">My Orders</Link>
      </div>
    );

  const a = order.shippingAddress;
  return (
    <main className="page narrow">
      {celebrate ? (
        <header className="success">
          <h1>✅ Order Placed Successfully</h1>
          <p className="muted">Your order has been saved successfully.</p>
        </header>
      ) : (
        <h1>Order #{order._id.slice(-8)}</h1>
      )}

      <section className="panel">
        <dl className="facts">
          <div><dt>Order ID</dt><dd>{order._id}</dd></div>
          <div><dt>Placed on</dt><dd>{formatDate(order.createdAt)}</dd></div>
          <div><dt>Status</dt><dd><span className={`badge ${order.status.toLowerCase()}`}>{order.status}</span></dd></div>
          <div><dt>Payment</dt><dd>{order.paymentStatus}{order.razorpayPaymentId && ` (${order.razorpayPaymentId})`}</dd></div>
        </dl>
      </section>

      <section className="panel">
        <h2>Items</h2>
        <ul className="summary-items">
          {order.items.map((item) => (
            <li key={item.product}>
              <span>{item.name} × {item.quantity} <span className="muted">@ {formatPrice(item.price)}</span></span>
              <span>{formatPrice(item.price * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <p className="order-total">Total: {formatPrice(order.totalAmount)}</p>
      </section>

      <section className="panel">
        <h2>Shipping to</h2>
        <p>
          {a.fullName}<br />
          {a.addressLine1}<br />
          {a.city}, {a.state} {a.pincode}<br />
          {a.phone}
        </p>
      </section>

      <div className="row">
        <Link to="/orders" className="btn">View My Orders</Link>
        <Link to="/products" className="btn ghost">Continue Shopping</Link>
      </div>
    </main>
  );
}
