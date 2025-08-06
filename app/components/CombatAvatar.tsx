import { User } from "lucide-react";

interface AvatarProps {
  name: string;
  level: number;
  hp: number;
  maxHp: number;
}

const CombatAvatar = ({ name, level, hp, maxHp }: AvatarProps) => {
  const hpPercent = Math.max(0, Math.min(100, (hp / maxHp) * 100));

  return (
    <div className="flex flex-col items-center justify-center">
      {/* Nivel arriba del avatar con estilo de card */}
      <div className="w-48 text-center text-white text-xs font-bold py-1 bg-gradient-to-r from-rose-900 to-red-800 border border-gray-600 rounded-t-lg shadow-lg">
        Level {level}
      </div>

      {/* Avatar */}
      <div className="w-48 h-56 bg-gradient-to-b from-zinc-800 to-zinc-900 shadow-inner flex flex-col items-center justify-center border-l border-r border-gray-600 relative">
        <User className="w-24 h-24 text-gray-300 mb-4" />

        {/* Nombre del personaje como barra completa en la parte inferior */}
        <div className="absolute bottom-0 left-0 right-0">
          <div className="w-full text-center text-white text-sm font-bold py-2 bg-gradient-to-r from-stone-800 to-indigo-950 border-t border-gray-600 shadow-lg">
            {name}
          </div>
        </div>
      </div>

      {/* Barra de vida roja pegada */}
      <div className="w-48 h-7 bg-gray-800 border-l border-r border-gray-600 border-t-0 relative overflow-hidden shadow-lg">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-rose-900 to-red-800"
          style={{ width: `${hpPercent}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-white text-sm font-bold z-10">
          {hp} / {maxHp} HP
        </div>
      </div>
    </div>
  );
};

export default CombatAvatar;
