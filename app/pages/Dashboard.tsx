import React, { useState } from "react";
import { Button } from "../components/ui/Button";

import { Avatar } from "../components/ui/Avatar";
import { useAuth } from "~/context/AuthContext";
import CombatAvatar from "~/components/CombatAvatar";
import CombatStats from "@/components/CombatStats";

interface Item {
  id: string;
  name: string;
  imageUrl: string;
  attributes: Record<string, any>;
}

interface Character {
  name: string;
  level: number;
  class: string;
  stats: {
    strength: number;
    dexterity: number;
    willpower: number;
    constitution: number;
    charisma: number;
  };
  combat: {
    damage: string;
    attack: number;
    roar: number;
    vitality: number;
    influence: number;
  };
  resources: {
    gold: number;
    blood: number;
  };
  equipment: {
    head: Item | null;
    chest: Item | null;
    gloves: Item | null;
    boots: Item | null;
    amulet: Item | null;
    belt: Item | null;
    ring: Item | null;
    mainWeapon: Item | null;
    offHandWeapon: Item | null;
  };
}
// Simulo "base de datos" de items
const itemsDB: Record<string, Item> = {
  helmet: {
    id: "helmet",
    name: "Iron Helmet",
    imageUrl:
      "https://media.craiyon.com/2025-04-08/XEwg2s5OT-2XFlVB9pVroQ.webp",
    attributes: { defense: 10 },
  },
  armor: {
    id: "armor",
    name: "Steel Armor",
    imageUrl: "https://pics.craiyon.com/2025-07-20/sK4sHD-oSByf8tNKjmqKlA.webp",
    attributes: { defense: 25 },
  },
  sword: {
    id: "sword",
    name: "sword_normal_1",
    imageUrl: "https://pics.craiyon.com/2025-07-20/SNR36OLIRpaRS7a0YqnIIA.webp",
    attributes: { damage: 15 },
  },
  // ... otros items
};

// Datos del personaje
const character: Character = {
  name: "dwarlordus",
  level: 10,
  class: "Werewolf Mutt",
  stats: {
    strength: 117,
    dexterity: 46,
    willpower: 52,
    constitution: 110,
    charisma: 39,
  },
  combat: {
    damage: "267 - 546",
    attack: 160,
    roar: 520,
    vitality: 1125,
    influence: 29,
  },
  resources: {
    gold: 1600,
    blood: 33,
  },
  equipment: {
    head: itemsDB.helmet,
    chest: itemsDB.armor,
    gloves: null,
    boots: null,
    amulet: null,
    belt: null,
    ring: null,
    mainWeapon: itemsDB.sword,
    offHandWeapon: null,
  },
};

const Dashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Avatar src="/avatar.png" fallback="AW" size={48} />
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

      {/* Character Section - Avatar y Combat Stats unidos */}
      <div className="flex justify-center">
        <div className="flex flex-col items-center">
          <CombatAvatar
            name={character.name}
            level={character.level}
            hp={850}
            maxHp={character.combat.vitality}
          />
          {/* Combat Stats pegado directamente debajo */}
          <CombatStats combat={character.combat} />
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
