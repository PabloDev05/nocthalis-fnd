// src/pages/FactionSelection.tsx
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router";
import { soundManager } from "../lib/sound/SoundManager"; // ← ej: "../audio/SoundManager" o "../utils/SoundManager"

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3030/api";

/* ───────── Types ───────── */
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
  id: string;
  name: string;
  description: string;
  iconName: string;
  imageMainClassUrl: string;
  passiveDefault: Passive;
  subclasses: Subclass[];
}

export default function FactionSelection() {
  const [classes, setClasses] = useState<GameClass[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  async function fetchClasses() {
    try {
      const res = await axios.get<GameClass[]>(
        `${API_BASE_URL}/character/classes`
      );
      setClasses(res.data);
      console.log("classes api:", res.data);
    } catch (err) {
      console.error("Error al cargar clases:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    // ⭐ Precarga mínima para evitar el “primer click en frío”
    // (tenés mapeado uiStart / uiReward en tu SoundManager)
    try {
      soundManager.preload(["ui_selected"]); // ⭐
    } catch {}
  }, []);

  function handleClassSelect(cls: GameClass) {
    // ⭐ Desbloquea audio y reproduce SFX dentro del gesto del usuario
    try {
      soundManager.unlock(); // ⭐ asegura audio en mobile
      soundManager.play("ui_selected", { volume: 0.9 }); // ⭐ o "uiReward" si preferís fanfarria
      // soundManager.play("uiReward", { volume: 0.85 });
    } catch {}

    // ⭐ LÓGICA INTACTA (solo claves de CLASE)
    localStorage.setItem("selectedClassId", cls.id);
    localStorage.setItem("selectedClassName", cls.name);
    localStorage.setItem("selectedClassImage", cls.imageMainClassUrl);
    localStorage.setItem("selectedClassDescription", cls.description);
    localStorage.setItem("selectedClassJSON", JSON.stringify(cls));
    localStorage.setItem("classChosen", "true");

    navigate("/register");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Cargando clases...
      </div>
    );
  }

  return (
    <>
      {/* ⭐ Efectos: borde con pulso leve + drift del contenido */}
      <style>
        {`
        @keyframes borderGlowMinimal {
          0% { opacity: .28; }
          50% { opacity: .5; }
          100% { opacity: .28; }
        }
        @keyframes gothicDrift {
          0% { transform: translateY(0px) }
          50% { transform: translateY(-3px) }
          100% { transform: translateY(0px) }
        }
        `}
      </style>

      <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white flex flex-col items-center justify-center px-4 py-10">
        <h1 className="text-5xl font-serif font-bold mb-3 text-center tracking-wider">
          Swear Your Oath
        </h1>
        <p className="mb-10 text-gray-400 text-center">
          Five factions. One eternal war. Choose wisely…
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-8 max-w-screen-2xl w-full mx-auto">
          {classes.map((cls) => (
            <div
              key={cls.id}
              onClick={() => handleClassSelect(cls)}
              onKeyDown={(e) =>
                (e.key === "Enter" || e.key === " ") && handleClassSelect(cls)
              } // ⭐ accesible
              tabIndex={0}
              role="button"
              className={
                "relative group cursor-pointer rounded-2xl overflow-hidden " +
                "transition-transform duration-500 ease-out " +
                "focus:outline-none focus:ring-2 focus:ring-purple-700 " +
                "hover:scale-[1.02]"
              }
              style={{
                height: "500px",
                width: "300px",
                isolation: "isolate", // ⭐ evita tapados por z-index externos
              }}
            >
              {/* Fondo (NO bloquea click) */}
              <div
                className="absolute inset-0 bg-cover bg-center pointer-events-none" // ⭐
                style={{ backgroundImage: `url(${cls.imageMainClassUrl})` }}
              />
              {/* Oscurecido (NO bloquea click) */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-transparent pointer-events-none" />{" "}
              {/* ⭐ */}
              {/* Borde base estilo Register */}
              <div className="pointer-events-none absolute inset-0 rounded-2xl border border-[#1e1f2b]" />
              {/* Filete interior con brillo mínimo (violeta del registro) */}
              <div
                className="pointer-events-none absolute inset-[1px] rounded-2xl"
                style={{
                  boxShadow: "inset 0 0 0 1px #2f1e4d",
                  opacity: 0.42,
                  animation: "borderGlowMinimal 7s ease-in-out infinite",
                }}
              />
              {/* Refuerzo en hover */}
              <div
                className="pointer-events-none absolute inset-[1px] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                style={{
                  boxShadow:
                    "inset 0 0 0 1px #40235f, inset 0 0 0 2px rgba(47,30,77,0.35)",
                }}
              />
              {/* Badge “Faction” (decorativo, NO bloquea click) */}
              <div className="absolute top-3 left-3 z-20 pointer-events-none">
                <span
                  className="px-2 py-0.5 text-xs tracking-wide rounded
                             bg-[#1a1433]/60 border border-[#3a2a6b]/60 text-[#dcd8ff]"
                >
                  Faction
                </span>
              </div>
              {/* Contenido con drift sutil */}
              <div
                className="relative z-10 flex flex-col justify-end h-full p-6 text-center"
                style={{ animation: "gothicDrift 7s ease-in-out infinite" }}
              >
                <h2 className="text-2xl font-bold font-serif mb-1 drop-shadow-[0_1px_0_rgba(0,0,0,0.75)]">
                  {cls.name}
                </h2>

                {cls.passiveDefault?.name && (
                  <p className="text-[13px] text-gray-300 italic">
                    Oath:{" "}
                    <span className="text-gray-200 font-medium">
                      {cls.passiveDefault.name}
                    </span>
                  </p>
                )}

                <p className="text-gray-400 text-sm mt-2 max-w-xs text-center mx-auto line-clamp-4">
                  {cls.description}
                </p>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation(); // evita doble disparo
                    handleClassSelect(cls);
                  }}
                  className="mt-3 w-full py-2 bg-gray-900/80 hover:bg-gray-800 text-white font-semibold rounded transition duration-300"
                >
                  Pledge to {cls.name}
                </button>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-xs text-gray-500 text-center max-w-2xl">
          Note: You choose a <b>Faction</b>. Mechanically, it defines your{" "}
          <b>class</b> (abilities, combat style, progression).
        </p>
      </div>
    </>
  );
}
