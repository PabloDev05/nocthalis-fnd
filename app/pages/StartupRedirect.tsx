import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import GlobalSpinner from "../components/GlobalSpinner";

const StartupRedirect = () => {
  const navigate = useNavigate();
  const { isAuthenticated, classChosen, authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      navigate("/login", { replace: true });
    } else {
      navigate(classChosen ? "/game" : "/select-class", { replace: true });
    }
  }, [isAuthenticated, classChosen, authLoading, navigate]);

  if (authLoading) return <GlobalSpinner />;

  return null;
};

export default StartupRedirect;
