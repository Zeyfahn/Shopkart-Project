import { useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { orderApi, getErrorMessage } from "../services/api";
import { loadRazorpayScript } from "../utils/razorpay";
import { formatPrice } from "../utils/format";

const FIELDS = [
  { name: "fullName", label: "Full name" },
  { name: "phone", label: "Phone" },
  { name: "addressLine1", label: "Address" },
  { name: "city", label: "City" },
  { name: "state", label: "State" },
  { name: "pincode", label: "Pincode" },
];

const validate = (form) => {
  const errors = {};
  for (const { name, label } of FIELDS) {
    if (!form[name].trim()) errors[name] = `${label} is required.`;
  }
  if (!errors.phone && !/^(\+91[\s-]?)?[6-9]\d{9}$/.test(form.phone.trim())) {
    errors.phone = "Enter a valid 10-digit phone number.";
  }
  if (!errors.pincode && !/^\d{6}$/.test(form.pincode.trim())) {
    errors.pincode = "Pincode must contain 6 digits.";
  }
  return errors;
};

export default function Checkout() {
  const { user } = useAuth();
  const { cartItems, loading, subtotal, clearCart, refreshCart } = useCart();
  const navigate = useNavigate();

  // Checkout form state is local: nothing else in the app needs it.
  const [form, setForm] = useState({
    fullName: user?.fullName || "",
    phone: user?.phone || "",
    addressLine1: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [processing, setProcessing] = useState(false);
  const finished = useRef(false); // set once payment is verified, so we don't bounce to /cart

  if (loading) return <p className="status">Loading your cart...</p>;
  if (cartItems.length === 0) return finished.current ? null : <Navigate to="/cart" replace />;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return; // no backend call if the form is invalid

    setProcessing(true);
    const shippingAddress = Object.fromEntries(
      FIELDS.map(({ name }) => [name, form[name].trim()])
    );

    try {
      // 1. Server validates stock + price, saves a pending order, creates the Razorpay order.
      const { data } = await orderApi.createPayment(shippingAddress);

      const loaded = await loadRazorpayScript();
      if (!loaded) {
        setFormError("Could not load the payment gateway. Check your connection and try again.");
        setProcessing(false);
        return;
      }

      // 2. Razorpay Checkout. Its success callback is NOT proof of payment:
      //    we send the details to the server, which verifies the signature.
      const rzp = new window.Razorpay({
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        name: "ShopKart",
        description: "ShopKart Order",
        order_id: data.razorpayOrderId,
        prefill: { name: shippingAddress.fullName, contact: shippingAddress.phone },
        handler: async (response) => {
          try {
            const res = await orderApi.verify({
              shopKartOrderId: data.shopKartOrderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            finished.current = true;
            clearCart(); // navbar -> Cart (0) immediately
            navigate(`/order-success/${res.data.order._id}`, { replace: true });
          } catch (err) {
            setFormError(`${getErrorMessage(err)}. Your cart has not been cleared.`);
            setProcessing(false);
          }
        },
        modal: { ondismiss: () => setProcessing(false) },
      });
      rzp.on("payment.failed", () => {
        setFormError("Payment failed. Your cart has not been cleared. Please try again.");
        setProcessing(false);
      });
      rzp.open();
    } catch (err) {
      setFormError(getErrorMessage(err));
      setProcessing(false);
      refreshCart({ silent: true }); // stock/price may have changed; resync the cart
    }
  };

  return (
    <main className="page checkout">
      <h1>Checkout</h1>
      <form onSubmit={handleSubmit} noValidate className="checkout-layout">
        <section className="panel">
          <h2>Shipping Details</h2>
          {FIELDS.map(({ name, label }) => (
            <label key={name}>
              {label}
              <input
                name={name}
                value={form[name]}
                onChange={handleChange}
                aria-invalid={!!errors[name]}
                disabled={processing}
              />
              {errors[name] && <span className="error-text">{errors[name]}</span>}
            </label>
          ))}
        </section>

        <aside className="summary">
          <h2>Order Summary</h2>
          <ul className="summary-items">
            {cartItems.map(({ product, quantity }) => (
              <li key={product._id}>
                <span>{product.name} × {quantity}</span>
                <span>{formatPrice(product.price * quantity)}</span>
              </li>
            ))}
          </ul>
          <dl>
            <div className="total"><dt>Total</dt><dd>{formatPrice(subtotal)}</dd></div>
          </dl>
          <p className="muted">The final amount is confirmed by the server before payment.</p>
          {formError && <p className="error-text" role="alert">{formError}</p>}
          <button className="btn block" disabled={processing}>
            {processing ? "Processing..." : "Place Order"}
          </button>
        </aside>
      </form>
    </main>
  );
}
