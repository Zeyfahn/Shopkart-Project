import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import OrderCard from "../components/OrderCard";
import { orderApi, getErrorMessage } from "../services/api";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    orderApi
      .list()
      .then((res) => !cancelled && setOrders(res.data.orders))
      .catch((err) => !cancelled && setError(getErrorMessage(err)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  if (loading) return <p className="status">Loading your orders...</p>;
  if (error)
    return (
      <div className="status">
        <p>Unable to load your orders.</p>
        <button className="btn" onClick={() => setAttempt((a) => a + 1)}>Try Again</button>
      </div>
    );
  if (orders.length === 0)
    return (
      <div className="status">
        <h2>You have not placed any orders yet.</h2>
        <Link to="/products" className="btn">Start Shopping</Link>
      </div>
    );

  return (
    <main className="page">
      <h1>My Orders</h1>
      <ul className="order-list">
        {orders.map((o) => (
          <OrderCard key={o._id} order={o} />
        ))}
      </ul>
    </main>
  );
}
