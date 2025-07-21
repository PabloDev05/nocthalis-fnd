import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Card } from "../components/ui/CardCharSelect";
import { Button } from "../components/ui/ButtonCharSelect";
import { cn } from "../lib/utils";

const classes = [
  {
    id: "exo-titan",
    name: "Exo-Titan",
    description: "Un coloso blindado que domina el combate cuerpo a cuerpo.",
    icon: "shield",
    color: "from-indigo-600 to-indigo-900",
  },
  {
    id: "voidweaver",
    name: "Voidweaver",
    description: "Controla la energía del vacío para destruir o proteger.",
    icon: "sparkles",
    color: "from-purple-600 to-purple-900",
  },
  {
    id: "phantasm",
    name: "Phantasm",
    description: "Un asesino veloz que se desliza entre las sombras.",
    icon: "ghost",
    color: "from-pink-600 to-pink-900",
  },
];

const ClassSelection = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const classChosen = localStorage.getItem("classChosen");
    const selectedClass = localStorage.getItem("selectedClass");

    if (classChosen === "true" && selectedClass) {
      navigate("/game");
    }
  }, [navigate]);

  const handleClassSelect = (classId: string) => {
    setLoading(true);
    localStorage.setItem("selectedClass", classId);
    navigate("/register");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-3 gap-6">
        {classes.map((cls) => (
          <div
            key={cls.id}
            className={cn(
              "dark-panel text-white p-6 cursor-pointer hover:scale-105 transition-transform",
              `bg-gradient-to-br ${cls.color}`,
              loading ? "pointer-events-none opacity-60" : ""
            )}
            onClick={() => !loading && handleClassSelect(cls.id)}
          >
            <Card>
              <div className="flex flex-col items-center gap-4">
                <div className="text-4xl">
                  <i className={`lucide lucide-${cls.icon}`}></i>
                </div>
                <h2 className="text-xl font-bold">{cls.name}</h2>
                <p className="text-sm text-gray-200 text-center">
                  {cls.description}
                </p>
                <Button className="mt-4 w-full" disabled={loading}>
                  {loading ? "Procesando..." : `Elegir ${cls.name}`}
                </Button>
              </div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClassSelection;
