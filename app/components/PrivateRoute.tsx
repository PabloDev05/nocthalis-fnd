import { Navigate } from "react-router-dom";
import { JSX, useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import GlobalSpinner from "./GlobalSpinner";

interface PrivateRouteProps {
  children: JSX.Element;
  requireClassChosen?: boolean;
}

export const PrivateRoute = ({
  children,
  requireClassChosen = false,
}: PrivateRouteProps) => {
  const { isAuthenticated, authLoading } = useAuth();
  const [classChosen, setClassChosen] = useState<string | null>(null);
  const [checkingClassChosen, setCheckingClassChosen] = useState(true);

  useEffect(() => {
    // Esto solo corre en el cliente, después del primer render
    const storedClassChosen = localStorage.getItem("classChosen");
    setClassChosen(storedClassChosen);
    setCheckingClassChosen(false);
  }, []);

  // Mientras cargas el estado auth o classChosen, muestra spinner
  if (authLoading || checkingClassChosen) return <GlobalSpinner />;

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (requireClassChosen && classChosen !== "true") {
    return <Navigate to="/" replace />;
  }

  return children;
};
