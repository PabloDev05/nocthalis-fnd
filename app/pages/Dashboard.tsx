import React, { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Progress } from "../components/ui/Progress";
import { Avatar } from "../components/ui/Avatar";
import { useAuth } from "~/context/AuthContext";

export default function Dashboard() {
  const [tab, setTab] = useState("pvp");
  const { user, logout } = useAuth(); 

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Avatar src="/avatar.png" fallback="NV" size={48} />
          <div>
            <h2 className="text-xl font-bold">{user}</h2>
            <p className="text-sm text-gray-400">Nv. 12 - Cuervo Sombrío</p>
          </div>
        </div>

       <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm">
              Almas: <span className="font-bold">1.340</span>
            </p>
            <p className="text-sm">
              Oro: <span className="font-bold">980</span>
            </p>
          </div>
          <Button
            variant="ghost"
            className="p-2 text-red-400 hover:text-red-600"
            onClick={logout}
          >
            Cerrar sesión
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="space-y-4">
        <nav className="grid grid-cols-4 gap-2 mb-4">
          {["pvp", "pve", "explore", "tienda"].map((value) => (
            <button
              key={value}
              onClick={() => setTab(value)}
              className={`py-2 rounded-md text-center font-semibold transition
                ${
                  tab === value
                    ? "bg-purple-700 text-white"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
                }`}
            >
              {value === "pvp"
                ? "PvP"
                : value === "pve"
                ? "Misiones"
                : value === "explore"
                ? "Exploración"
                : "Tienda"}
            </button>
          ))}
        </nav>

        {/* Tab Contents */}
        {tab === "pvp" && (
          <Card>
            <h3 className="text-lg font-semibold">PvP Clasificatorio</h3>
            <p>Enfréntate a otros jugadores en combates por turnos.</p>
            <Button>Buscar partida</Button>
          </Card>
        )}

        {tab === "pve" && (
          <Card className="space-y-2">
            <h3 className="text-lg font-semibold">Misiones activas</h3>
            <p>Fragmentos del Vacío: 3/5</p>
            <Progress value={60} />
            <Button>Continuar misión</Button>
          </Card>
        )}

        {tab === "explore" && (
          <Card className="space-y-2">
            <h3 className="text-lg font-semibold">Mapa oscuro</h3>
            <p>Explora zonas corruptas de Nocthalis y descubre secretos.</p>
            <Button>Ir al mapa</Button>
          </Card>
        )}

        {tab === "tienda" && (
          <Card className="space-y-2">
            <h3 className="text-lg font-semibold">Tienda</h3>
            <p>Compra objetos, mejoras y cofres místicos.</p>
            <Button>Ver tienda</Button>
          </Card>
        )}
      </div>
    </div>
  );
}
