import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = "http://localhost:3030/api";
interface Passive {
  name: string;
  description: string;
  detail?: string;
}

interface Subclass {
  name: string;
  iconName: string;
  imageSubclassUrl?: string;
  passives: Passive[];
}

interface GameClass {
  _id: string;
  name: string;
  description: string;
  iconName: string;
  imageMainClassUrl: string;
  passiveDefault: Passive;
  subclasses: Subclass[];
}

const ClassSelection = () => {
  const [classes, setClasses] = useState<GameClass[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchClasses = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/character/classes`);
      setClasses(res.data);
    } catch (err) {
      console.error("Error al cargar clases:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClassSelect = (classId: string) => {
    localStorage.setItem("selectedClass", classId);
    localStorage.setItem("classChosen", "true");
    navigate("/register");
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Cargando clases...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white flex flex-col items-center justify-center px-4 py-10">
      <h1 className="text-5xl font-serif font-bold mb-4 text-center tracking-wider">
        Escoge tu Destino
      </h1>
      <p className="mb-10 text-gray-400 text-center">
        Cuatro caminos. Una guerra eterna. Elige con sabiduría...
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl w-full">
        {classes.map((cls) => (
          <div
            key={cls._id}
            onClick={() => handleClassSelect(cls.name)}
            className="relative group cursor-pointer rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition duration-300 border border-gray-800 bg-cover bg-center"
            style={{
              backgroundImage: `url(${cls.imageMainClassUrl})`,
              height: "460px",
            }}
          >
            {/* Overlay oscuro para contraste */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-0"></div>

            {/* Contenido centrado */}
            <div className="relative z-10 flex flex-col justify-end h-full p-6 text-center">
              <h2 className="text-2xl font-bold font-serif mb-2">{cls.name}</h2>
              <p className="text-sm text-gray-300 mb-4">{cls.description}</p>
              <button className="w-full py-2 bg-gray-900/80 hover:bg-gray-800 text-white font-semibold rounded transition duration-300">
                Elegir {cls.name}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClassSelection;
