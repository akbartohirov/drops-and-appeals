// src/components/AdminRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthProvider.jsx";

export default function AdminRoute({ children }) {
  const { auth } = useAuth();
  if (!auth?.token) return <Navigate to="/login" replace />;
  if (!auth?.user?.is_admin) return <Navigate to="/" replace />;
  return children;
}
