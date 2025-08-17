import { Navigate } from "react-router";
import { useAuth } from "./AuthProvider";
import type { JSX } from "react";

export default function ProtectedRoute({
  children,
}: {
  children: JSX.Element;
}) {
  const { isAuthenticated, authLoading } = useAuth();
  if (authLoading) return null; // o un spinner si preferís
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}
