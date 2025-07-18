import { Navigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { JSX } from "react";
import GlobalSpinner from "./GlobalSpinner";

export const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, authLoading } = useAuth();

  if (authLoading) {
    return <GlobalSpinner />; 
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};


