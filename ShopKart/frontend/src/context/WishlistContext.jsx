import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { wishlistApi, getErrorMessage } from "../services/api";
import { useAuth } from "./AuthContext";

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]); // populated products
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [pendingIds, setPendingIds] = useState({});
  const pendingRef = useRef(new Set());

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await wishlistApi.get();
      setItems(res.data.wishlist);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (user) refresh();
    else {
      setItems([]);
      setError(null);
      setLoading(false);
      setLoaded(false);
    }
  }, [user, refresh]);

  const run = useCallback(async (productId, request) => {
    if (pendingRef.current.has(productId)) return { ok: false, message: "Please wait" };
    pendingRef.current.add(productId);
    setPendingIds((p) => ({ ...p, [productId]: true }));
    try {
      await request();
      return { ok: true };
    } catch (err) {
      return { ok: false, status: err.response?.status, message: getErrorMessage(err) };
    } finally {
      pendingRef.current.delete(productId);
      setPendingIds((p) => {
        const next = { ...p };
        delete next[productId];
        return next;
      });
    }
  }, []);

  const addToWishlist = useCallback(
    async (product) => {
      const result = await run(product._id, () => wishlistApi.add(product._id));
      // 409 = already saved on the server; make the UI agree with it.
      if (result.ok || result.status === 409) {
        setItems((prev) => (prev.some((p) => p._id === product._id) ? prev : [product, ...prev]));
        return { ok: true };
      }
      return result;
    },
    [run]
  );

  const removeFromWishlist = useCallback(
    async (productId) => {
      const result = await run(productId, () => wishlistApi.remove(productId));
      if (result.ok || result.status === 404) {
        setItems((prev) => prev.filter((p) => p._id !== productId));
        return { ok: true };
      }
      return result;
    },
    [run]
  );

  const isWishlisted = useCallback((id) => items.some((p) => p._id === id), [items]);
  const isPending = useCallback((id) => !!pendingIds[id], [pendingIds]);

  const value = {
    items,
    loading: loading || (!!user && !loaded),
    error,
    refresh,
    addToWishlist,
    removeFromWishlist,
    isWishlisted,
    isPending,
  };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export const useWishlist = () => useContext(WishlistContext);
