import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { cartApi, getErrorMessage } from "../services/api";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();

  // Server state mirrored on the client: the ONE source of truth for the cart.
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loaded, setLoaded] = useState(false); // has the first fetch finished?

  // Which products have a request in flight (drives per-item loading UI).
  const [pendingIds, setPendingIds] = useState({});
  const pendingRef = useRef(new Set()); // synchronous guard against double-clicks

  // Load the cart from the backend (also used by "Try again").
  const refreshCart = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true); // silent = re-sync without a loading screen
    setError(null);
    try {
      const res = await cartApi.get();
      setCartItems(res.data.cart);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, []);

  // Fetch once when a user logs in; clear everything when they log out.
  useEffect(() => {
    if (user) {
      refreshCart();
    } else {
      setCartItems([]);
      setError(null);
      setLoading(false);
      setLoaded(false);
    }
  }, [user, refreshCart]);

  // After a verified payment the server has already emptied the cart; mirror that here.
  const clearCart = useCallback(() => setCartItems([]), []);

  // Every mutation: call API -> on success replace state with the server's cart.
  // On failure state is untouched, so the UI never shows a change that didn't save.
  const mutate = useCallback(async (productId, request) => {
    if (pendingRef.current.has(productId)) {
      return { ok: false, message: "Please wait for the current update" };
    }
    pendingRef.current.add(productId);
    setPendingIds((p) => ({ ...p, [productId]: true }));
    try {
      const res = await request();
      setCartItems(res.data.cart);
      return { ok: true };
    } catch (err) {
      return { ok: false, message: getErrorMessage(err) };
    } finally {
      pendingRef.current.delete(productId);
      setPendingIds((p) => {
        const next = { ...p };
        delete next[productId];
        return next;
      });
    }
  }, []);

  const addToCart = useCallback((id) => mutate(id, () => cartApi.add(id)), [mutate]);
  const updateQuantity = useCallback(
    (id, qty) => mutate(id, () => cartApi.setQuantity(id, qty)),
    [mutate]
  );
  const removeFromCart = useCallback((id) => mutate(id, () => cartApi.remove(id)), [mutate]);

  // Derived values: computed from state, never stored in MongoDB.
  const totalUnits = useMemo(
    () => cartItems.reduce((sum, i) => sum + i.quantity, 0),
    [cartItems]
  );
  const subtotal = useMemo(
    () => cartItems.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
    [cartItems]
  );
  const quantityOf = useCallback(
    (productId) => cartItems.find((i) => i.product._id === productId)?.quantity ?? 0,
    [cartItems]
  );
  const isPending = useCallback((productId) => !!pendingIds[productId], [pendingIds]);

  const value = {
    cartItems,
    // true until the first fetch for a logged-in user completes (avoids a false "empty" flash)
    loading: loading || (!!user && !loaded),
    error,
    totalUnits,
    subtotal,
    quantityOf,
    isPending,
    addToCart,
    updateQuantity,
    removeFromCart,
    refreshCart,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
