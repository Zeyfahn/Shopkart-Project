import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, authLoading } = useAuth();
  if (authLoading) return <p className="status">Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
