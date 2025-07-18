import { Navigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { JSX, useEffect, useState } from "react";

export const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated } = useAuth();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setChecked(true);
  }, []);

  if (!checked) {
    return null; 
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};
