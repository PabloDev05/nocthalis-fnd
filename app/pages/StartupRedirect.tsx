import { useEffect } from "react";
import { useNavigate } from "react-router";

const StartupRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const classChosen = localStorage.getItem("classChosen");

    if (!token && !classChosen) {
      // Usuario completamente nuevo
      navigate("/select-class");
    } else if (!token && classChosen === "true") {
      // Ya eligió clase pero no está registrado todavía
      navigate("/register");
    } else if (token && classChosen === "true") {
      // Usuario registrado y con clase
      navigate("/game");
    } else if (token && classChosen !== "true") {
      // Usuario registrado pero no eligió clase aún
      navigate("/select-class");
    }
  }, [navigate]);

  return null;
};

export default StartupRedirect;
