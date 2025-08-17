// src/pages/protected/ClassSelectionRoute.tsx
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import ClassSelection from "../ClassSelection";

const ClassSelectionRoute = () => {
  const { authLoading, classChosen } = useAuth();
  const navigate = useNavigate();
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (classChosen) {
      navigate("/game", { replace: true });
    } else {
      setShouldRender(true);
    }
  }, [authLoading, classChosen, navigate]);

  if (authLoading || !shouldRender) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black">
        <div className="animate-spin h-16 w-16 rounded-full border-t-4 border-b-4 border-purple-500" />
        <p className="mt-4 text-white text-lg">Cargando...</p>
      </div>
    );
  }

  return <ClassSelection />;
};

export default ClassSelectionRoute;
