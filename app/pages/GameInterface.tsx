import { useState } from "react";
import {
  Crown,
  Sword,
  Shield,
  Gem,
  Star,
  Trophy,
  Settings,
  MessageSquare,
  Package,
  Castle,
  Swords,
  Skull,
  Church,
  Map,
  ShoppingCart,
  FlaskRoundIcon as Flask,
  Droplet,
  User,
  Zap,
  Plus,
  Backpack,
  CircleDot,
  Shirt,
  Hand,
  DockIcon as Boots,
  NetworkIcon as Necklace,
  BellIcon as Belt,
  BellRingIcon as Ring,
  Info,
  Flame,
} from "lucide-react";

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

// Menú del juego
const menuItems = [
  { id: "character", label: "CHARACTER", icon: User },
  { id: "messages", label: "MESSAGES", icon: MessageSquare },
  { id: "pack", label: "PACK", icon: Backpack },
  { id: "hall-of-fame", label: "HALL OF FAME", icon: Trophy },
  { id: "options", label: "OPTIONS", icon: Settings },
  { id: "castle", label: "CASTLE", icon: Castle },
  { id: "arena", label: "ARENA", icon: Swords },
  { id: "gravedigger", label: "GRAVEDIGGER", icon: Skull },
  { id: "sanctuary", label: "SANCTUARY", icon: Church },
  { id: "world-map", label: "WORLD MAP", icon: Map },
  { id: "weapons-shop", label: "WEAPONS SHOP", icon: ShoppingCart },
  { id: "laboratory", label: "LABORATORY", icon: Flask },
  { id: "blood-stones", label: "BLOOD STONES", icon: Droplet },
];

// Componente principal del juego
export default function GameInterfaceCopy() {
  const [activeMenu, setActiveMenu] = useState("character");

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

  const EquipmentSlot = ({ type, icon: Icon, item }: any) => (
    <div
      className="equipment-slot flex items-center justify-center w-23 h-23 bg-gray-700 rounded-lg"
      title={item ? item.name : type}
    >
      {item && item.imageUrl ? (
        <img
          src={item.imageUrl}
          alt={item.name}
          className="w-20 h-20 object-contain"
        />
      ) : (
        <Icon className="w-10 h-10 text-gray-500" />
      )}
    </div>
  );

  return (
    <div className="min-h-screen text-sm leading-tight space-y-2 bg-gradient-to-br from-gray-900 via-black to-gray-800 relative">
      {/* Fondo oscuro */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/90"></div>

      {/* Header del juego */}
      <header className="relative z-10 dark-panel m-4 p-4 flex justify-between items-center">
        <div className="flex items-center space-x-8">
          <h1 className="text-3xl font-bold stat-text tracking-wide font-serif">
            Nocthalis
          </h1>
          <div className="text-sm stat-text-muted">
            <span className="text-red-400">●</span> Souls Online: 1,247
          </div>
        </div>
        <nav className="flex space-x-6 text-sm">
          {[
            "Terms of Use",
            "Privacy",
            "Legal notice",
            "Forum",
            "Support",
            "Logout",
          ].map((item) => (
            <a
              key={item}
              href="#"
              className="stat-text-muted hover:text-gray-300 transition-colors"
            >
              {item}
            </a>
          ))}
        </nav>
      </header>

      <div className="relative z-10 flex h-[calc(100vh-40px)]">
        {/* Menú lateral izquierdo */}
        <aside className="w-59 h-215 p-2 space-y-1 bg-gray-800/60 ml-1 rounded-lg shadow-lg">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveMenu(item.id)}
                className={`w-full gothic-button flex items-center space-x-4 text-left ${
                  activeMenu === item.id ? "active" : ""
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Contenido principal */}
        <main className="flex-1 space-y-4">
          <div className="grid grid-cols-3 gap-1 h-[calc(100%-40px)]">
            {/* Panel combinado: personaje + stats */}
            <div className="col-span-2 dark-panel p-3 flex flex-col ml-1">
              {/* Info principal */}
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-red-700 to-red-900 rounded-full flex items-center justify-center">
                  <Skull className="w-6 h-6 text-red-200" />
                </div>
                <span className="stat-text font-semibold text-lg">
                  {character.class}
                </span>
              </div>

              {/* 🔍 Información extra + 💥 Habilidades */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                {/* 🔍 Info extra */}
                <div className="bg-gray-800/60 p-4 rounded-xl">
                  <h3 className="stat-text font-semibold mb-4 flex items-center text-lg">
                    <Info className="w-5 h-5 mr-3 text-blue-400" />
                    Extra Info
                  </h3>
                  <ul className="text-sm space-y-2 stat-text-muted">
                    <li>
                      <strong>Raza:</strong> Human
                    </li>
                    <li>
                      <strong>Origen:</strong> Northern Wastes
                    </li>
                    <li>
                      <strong>Afiliación:</strong> "Order of the Flame
                    </li>
                    <li>
                      <strong>Historia:</strong>{" "}
                      <span className="text-xs italic">
                        A fearless warrior with a haunted past.
                      </span>
                    </li>
                  </ul>
                </div>

                {/* 💥 Habilidades pasivas o ultimates */}
                <div className="bg-gray-800/60 p-4 rounded-xl">
                  <h3 className="stat-text font-semibold mb-4 flex items-center text-lg">
                    <Flame className="w-5 h-5 mr-3 text-red-500" />
                    Passive / Ultimate Skills
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start space-x-3">
                      <Shield className="w-5 h-5 text-gray-300 mt-1" />
                      <div>
                        <strong className="text-white">Unbreakable Will</strong>
                        <br />
                        <span className="stat-text-muted">
                          Reduces incoming damage by 10% when below 30% HP.
                        </span>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Zap className="w-5 h-5 text-purple-400 mt-1" />
                      <div>
                        <strong className="text-white">Wrath Surge</strong>
                        <br />
                        <span className="stat-text-muted">
                          Ultimate: Boosts damage by 50% for 6 seconds.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 🏆 Achievements + 🧪 Potions */}
              <div className="grid grid-cols-2 gap-6">
                {/* Achievements */}
                <div className="bg-gray-800/60 p-4 rounded-xl">
                  <h3 className="stat-text font-semibold mb-4 flex items-center text-lg">
                    <Trophy className="w-6 h-6 mr-3 text-yellow-500" />
                    Achievements
                  </h3>
                  <div className="flex space-x-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-full flex items-center justify-center"
                      >
                        <Star className="w-5 h-5 text-yellow-900" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Potions */}
                <div className="bg-gray-800/60 p-4 rounded-xl">
                  <h3 className="stat-text font-semibold mb-4 flex items-center text-lg">
                    <Flask className="w-6 h-6 mr-3 text-green-500" />
                    Potions
                  </h3>
                  <div className="grid grid-cols-4 gap-3">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                      <div
                        key={i}
                        className="equipment-slot flex items-center justify-center"
                      >
                        {i === 1 && (
                          <div className="w-8 h-8 bg-red-600 rounded-lg"></div>
                        )}
                        {i === 2 && (
                          <Flask className="w-6 h-6 text-green-400" />
                        )}
                        {i === 3 && (
                          <div className="w-8 h-8 bg-blue-600 rounded-lg"></div>
                        )}
                        {i === 5 && (
                          <div className="w-8 h-8 bg-purple-600 rounded-lg"></div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Panel derecho: equipamiento y stats */}
            <div className="dark-panel p-6 max-w-4x2 mx-auto">
              {/* Character Equipment Grid */}
              <div className="flex justify-center mb-8">
                <div className="relative">
                  {/* Equipment Grid Layout */}
                  <div className="grid grid-cols-3 gap-4 items-center">
                    {/* Left Column - Equipment */}
                    <div className="flex flex-col gap-3 items-center justify-center">
                      <EquipmentSlot
                        type="Head"
                        icon={CircleDot}
                        item={character.equipment.head}
                      />
                      <EquipmentSlot
                        type="Chest"
                        icon={Shirt}
                        item={character.equipment.chest}
                      />
                      <EquipmentSlot
                        type="Gloves"
                        icon={Hand}
                        item={character.equipment.gloves}
                      />
                      <EquipmentSlot
                        type="Boots"
                        icon={Boots}
                        item={character.equipment.boots}
                      />
                    </div>

                    {/* Center Column - Avatar */}
                    <div className="flex flex-col items-center justify-center">
                      {/* Character name pegado arriba del avatar */}
                      <div className="w-48 text-center text-lg text-blue-300 font-bold  px-3 py-1 bg-black/40 rounded-t-lg border-t border-l border-r border-gray-600">
                        {character.name}
                      </div>

                      <div className="w-48 h-56 bg-gradient-to-b from-zinc-800 to-zinc-900  shadow-inner flex items-center justify-center border-l border-r border-gray-600">
                        <User className="w-24 h-24 text-gray-300" />
                      </div>

                      {/* Level como barra de progreso pegada al avatar */}
                      <div className="w-48 h-8 bg-gray-800 rounded-b-lg border-b border-l border-r border-gray-600 relative overflow-hidden">
                        {/* Barra de progreso */}
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 w-[75%] "></div>
                        {/* Label del level centrado */}
                        <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm z-10 ">
                          Level {character.level}
                        </div>
                      </div>
                      {/* Weapons below avatar */}
                      <div className="flex gap-4 mt-5.5 justify-center">
                        <EquipmentSlot
                          type="Main Weapon"
                          icon={Sword}
                          item={character.equipment.mainWeapon}
                        />
                        <EquipmentSlot
                          type="Off-hand"
                          icon={Shield}
                          item={character.equipment.offHandWeapon}
                        />
                      </div>
                    </div>

                    {/* Right Column - Accessories */}
                    <div className="flex flex-col gap-3 items-center justify-center">
                      <EquipmentSlot
                        type="Amulet"
                        icon={Necklace}
                        item={character.equipment.amulet}
                      />
                      <EquipmentSlot
                        type="Belt"
                        icon={Belt}
                        item={character.equipment.belt}
                      />
                      <EquipmentSlot
                        type="Ring"
                        icon={Ring}
                        item={character.equipment.ring}
                      />
                      {/* Empty slot for symmetry */}
                      <div className="w-20 h-20"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Character Stats */}
                <div className="bg-gray-800/60 p-4 rounded-xl">
                  <h3 className="text-white font-semibold mb-4 flex items-center text-base">
                    <Zap className="w-5 h-5 mr-3 text-purple-400" />
                    Character Stats
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(character.stats).map(([stat, value]) => (
                      <div
                        key={stat}
                        className="flex justify-between items-center"
                      >
                        <span className="text-gray-300 capitalize text-sm">
                          {stat}
                        </span>
                        <div className="flex items-center space-x-3">
                          <span className="text-white font-bold">{value}</span>
                          <Plus className="w-4 h-4 text-green-500 cursor-pointer hover:text-green-400 transition-colors" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Combat Stats */}
                <div className="bg-gray-800/60 p-4 rounded-xl">
                  <h3 className="text-white font-semibold mb-4 text-base">
                    Combat Stats
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(character.combat).map(([label, value]) => (
                      <div
                        key={label}
                        className="flex justify-between items-center"
                      >
                        <span className="text-gray-300 capitalize text-sm">
                          {label}
                        </span>
                        <span className="text-purple-400 font-bold text-sm">
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Inventory Section */}
              <div className="border-t border-gray-600 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold flex items-center">
                    <Package className="w-5 h-5 mr-2 text-gray-400" />
                    Inventory
                  </h3>
                  <div className="text-xs text-gray-400">
                    <span className="text-purple-400">6</span>/10
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-2 mb-4">
                  {Array.from({ length: 10 }, (_, i) => (
                    <div
                      key={i}
                      className="aspect-square bg-gray-800/80 border border-gray-600 rounded-lg flex items-center justify-center hover:border-purple-400 transition-colors cursor-pointer"
                    >
                      {i === 0 && <Sword className="w-6 h-6 text-gray-400" />}
                      {i === 1 && <Shield className="w-6 h-6 text-gray-400" />}
                      {i === 2 && (
                        <div className="w-8 h-8 bg-purple-600 rounded-lg"></div>
                      )}
                      {i === 3 && <Gem className="w-6 h-6 text-purple-400" />}
                      {i === 4 && (
                        <div className="w-8 h-8 bg-green-600 rounded-lg"></div>
                      )}
                      {i === 5 && <Crown className="w-6 h-6 text-yellow-500" />}
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-gray-600">
                  <div className="text-xs text-gray-400">
                    Weight: <span className="text-purple-400">45.2</span>/100
                  </div>
                  <button className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
                    Auto Sort
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
