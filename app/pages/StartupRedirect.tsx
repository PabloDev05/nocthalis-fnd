import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "~/context/AuthContext";
import GlobalSpinner from "../components/GlobalSpinner";

const StartupRedirect = () => {
  const navigate = useNavigate();
  const { isAuthenticated, classChosen, authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return; // No redirigir hasta que se cargue el estado

    if (!isAuthenticated) {
      navigate(classChosen ? "/register" : "/select-class");
    } else {
      navigate(classChosen ? "/game" : "/select-class");
    }
  }, [isAuthenticated, classChosen, authLoading, navigate]);

  // Mostrar spinner mientras se carga el estado de autenticación
  if (authLoading) {
    return <GlobalSpinner />;
  }

  return null;
};

export default StartupRedirect;
