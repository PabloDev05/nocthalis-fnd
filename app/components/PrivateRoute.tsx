// src/components/PrivateRoute.tsx
import { Navigate } from "react-router-dom";
import { JSX } from "react";
import { useAuth } from "../context/AuthContext";
import GlobalSpinner from "./GlobalSpinner";

interface PrivateRouteProps {
  children: JSX.Element;
  /** Si es true, además de estar autenticado debe tener clase elegida */
  requireClassChosen?: boolean;
}

export const PrivateRoute = ({
  children,
  requireClassChosen = false,
}: PrivateRouteProps) => {
  const { isAuthenticated, authLoading, classChosen } = useAuth();

  // Mientras el AuthProvider lee LS / valida token:
  if (authLoading) return <GlobalSpinner />;

  // No autenticado → login
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Autenticado pero sin clase y la ruta la exige → select-class
  if (requireClassChosen && !classChosen) {
    return <Navigate to="/select-class" replace />;
  }

  return children;
};
