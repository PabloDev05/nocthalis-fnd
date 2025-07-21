/* Proteje las rutas públicas (/login y /register) para que no sean accesibles si el usuario ya está logueado y tiene clase elegida */
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router";
import GlobalSpinner from "~/components/GlobalSpinner";

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { token, classChosen, authLoading } = useAuth();
  const navigate = useNavigate();
  const [canRender, setCanRender] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (token && classChosen) {
      navigate("/game");
    } else {
      setCanRender(true);
    }
  }, [authLoading, token, classChosen, navigate]);

  if (authLoading || !canRender) {
    return <GlobalSpinner />;
  }

  return <>{children}</>;
};

export default PublicRoute;
