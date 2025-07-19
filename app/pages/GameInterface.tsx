"use client"

import { useState } from "react"
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
} from "lucide-react"

// Tipos de datos
interface Character {
  name: string
  level: number
  class: string
  stats: {
    strength: number
    dexterity: number
    willpower: number
    constitution: number
    charisma: number
  }
  combat: {
    damage: string
    attack: number
    roar: number
    vitality: number
    influence: number
  }
  resources: {
    gold: number
    blood: number
  }
  equipment: {
    head: string | null
    chest: string | null
    gloves: string | null
    boots: string | null
    amulet: string | null
    belt: string | null
    ring: string | null
    mainWeapon: string | null
    offHandWeapon: string | null
  }
}

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
]

// Componente principal del juego
export default function GameInterface() {
  const [activeMenu, setActiveMenu] = useState("character")

  // Datos del personaje
  const character: Character = {
    name: "dwarlordus",
    level: 9,
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
      head: "helmet",
      chest: "armor",
      gloves: "gauntlets",
      boots: "boots",
      amulet: "pendant",
      belt: "leather_belt",
      ring: "power_ring",
      mainWeapon: "knife",
      offHandWeapon: null,
    },
  }

  // Componente para slots de equipamiento
  const EquipmentSlot = ({ type, icon: Icon, item }: any) => (
    <div className="equipment-slot flex items-center justify-center" title={type}>
      {item ? (
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-md flex items-center justify-center">
          <Icon className="w-6 h-6 text-purple-200" />
        </div>
      ) : (
        <Icon className="w-6 h-6 text-gray-500" />
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 relative">
      {/* Fondo oscuro */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/90"></div>

      {/* Header del juego */}
      <header className="relative z-10 dark-panel m-4 p-4 flex justify-between items-center">
        <div className="flex items-center space-x-8">
          <h1 className="text-5xl font-bold stat-text tracking-wider font-serif">Nocthalis</h1>
          <div className="text-sm stat-text-muted">
            <span className="text-red-400">●</span> Souls Online: 1,247
          </div>
        </div>
        <nav className="flex space-x-6 text-sm">
          {["Terms of Use", "Privacy", "Legal notice", "Forum", "Support", "Logout"].map((item) => (
            <a key={item} href="#" className="stat-text-muted hover:text-gray-300 transition-colors">
              {item}
            </a>
          ))}
        </nav>
      </header>

      <div className="relative z-10 flex h-[calc(100vh-120px)]">
        {/* Menú lateral izquierdo */}
        <aside className="w-72 p-4 space-y-3">
          {menuItems.map((item) => {
            const Icon = item.icon
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
            )
          })}
        </aside>

        {/* Contenido principal */}
        <main className="flex-1 p-4 space-y-4">
          {/* Barra de recursos */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              {/* Oro */}
              <div className="dark-panel px-4 py-2 flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-full flex items-center justify-center">
                  <Crown className="w-5 h-5 text-yellow-900" />
                </div>
                <span className="stat-text font-bold text-lg">{character.resources.gold.toLocaleString("en-US")}</span>
              </div>
              {/* Sangre */}
              <div className="dark-panel px-4 py-2 flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center">
                  <Droplet className="w-5 h-5 text-red-200" />
                </div>
                <span className="stat-text font-bold text-lg">{character.resources.blood}</span>
              </div>
            </div>
            <div className="text-sm stat-text-muted">
              Last seen: <span className="stat-text-accent">9 hours ago</span>
            </div>
          </div>

          {/* Grid principal */}
          <div className="grid grid-cols-4 gap-6 h-[calc(100%-80px)]">
            {/* Panel del personaje y equipamiento */}
            <div className="col-span-2 dark-panel p-6">
              {/* Información del personaje */}
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-red-700 to-red-900 rounded-full flex items-center justify-center">
                  <Skull className="w-6 h-6 text-red-200" />
                </div>
                <span className="stat-text font-semibold text-lg">{character.class}</span>
                <div className="ml-auto px-4 py-2 bg-gradient-to-r from-blue-700 to-blue-800 border border-blue-600 text-sm font-bold stat-text rounded">
                  Level {character.level}
                </div>
              </div>

              {/* Área del personaje con equipamiento */}
              <div className="relative flex justify-center items-center min-h-[400px]">
                {/* Retrato del personaje - Centro */}
                <div className="w-40 h-40 bg-gradient-to-b from-gray-600 to-gray-800 rounded-lg flex items-center justify-center relative border-2 border-gray-500">
                  <User className="w-24 h-24 text-gray-300" />
                  <div className="absolute bottom-1 left-1 right-1 bg-blue-800/90 text-center py-1 rounded text-xs">
                    <span className="stat-text">{character.name}</span>
                  </div>
                </div>

                {/* Slots de equipamiento alrededor del personaje */}
                <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
                  <EquipmentSlot type="Head" icon={CircleDot} item={character.equipment.head} />
                </div>
                <div className="absolute top-12 right-16">
                  <EquipmentSlot type="Amulet" icon={Necklace} item={character.equipment.amulet} />
                </div>
                <div className="absolute top-20 left-12">
                  <EquipmentSlot type="Chest" icon={Shirt} item={character.equipment.chest} />
                </div>
                <div className="absolute top-20 right-12">
                  <EquipmentSlot type="Belt" icon={Belt} item={character.equipment.belt} />
                </div>
                <div className="absolute bottom-20 left-16">
                  <EquipmentSlot type="Gloves" icon={Hand} item={character.equipment.gloves} />
                </div>
                <div className="absolute bottom-20 right-16">
                  <EquipmentSlot type="Ring" icon={Ring} item={character.equipment.ring} />
                </div>
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 -translate-x-8">
                  <EquipmentSlot type="Main Weapon" icon={Sword} item={character.equipment.mainWeapon} />
                </div>
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 translate-x-8">
                  <EquipmentSlot type="Off-hand" icon={Shield} item={character.equipment.offHandWeapon} />
                </div>
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                  <EquipmentSlot type="Boots" icon={Boots} item={character.equipment.boots} />
                </div>
              </div>

              {/* Logros */}
              <div className="mt-6 border-t border-gray-600 pt-4">
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
            </div>

            {/* Panel de estadísticas */}
            <div className="dark-panel p-6">
              <h3 className="stat-text font-semibold mb-6 flex items-center text-lg">
                <Zap className="w-6 h-6 mr-3 text-purple-400" />
                Character Stats
              </h3>

              {/* Estadísticas principales */}
              <div className="space-y-4 mb-6">
                {Object.entries(character.stats).map(([stat, value]) => (
                  <div key={stat} className="flex justify-between items-center">
                    <span className="stat-text-muted capitalize">{stat}</span>
                    <div className="flex items-center space-x-3">
                      <span className="stat-text font-bold">{value}</span>
                      <Plus className="w-4 h-4 text-green-500 cursor-pointer hover:text-green-400" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Estadísticas de combate */}
              <div className="border-t border-gray-600 pt-4">
                <h4 className="stat-text-muted font-semibold mb-4">Combat Stats</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="stat-text-muted">Damage</span>
                    <span className="stat-text-purple font-bold">{character.combat.damage}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="stat-text-muted">Attack</span>
                    <span className="stat-text-purple font-bold">{character.combat.attack}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="stat-text-muted">Roar</span>
                    <span className="stat-text-purple font-bold">{character.combat.roar}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="stat-text-muted">Vitality</span>
                    <span className="stat-text-purple font-bold">{character.combat.vitality}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="stat-text-muted">Influence</span>
                    <span className="stat-text-purple font-bold">{character.combat.influence}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Panel de pociones e inventario */}
            <div className="dark-panel p-6">
              {/* Pociones */}
              <div className="mb-6">
                <h3 className="stat-text font-semibold mb-4 flex items-center text-lg">
                  <Flask className="w-6 h-6 mr-3 text-green-500" />
                  Potions
                </h3>
                <div className="grid grid-cols-4 gap-3">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="equipment-slot flex items-center justify-center">
                      {i === 1 && <div className="w-8 h-8 bg-red-600 rounded-lg"></div>}
                      {i === 2 && <Flask className="w-6 h-6 text-green-400" />}
                      {i === 3 && <div className="w-8 h-8 bg-blue-600 rounded-lg"></div>}
                      {i === 5 && <div className="w-8 h-8 bg-purple-600 rounded-lg"></div>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Inventario */}
              <div className="border-t border-gray-600 pt-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="stat-text font-semibold flex items-center">
                    <Package className="w-5 h-5 mr-2 text-gray-400" />
                    Inventory
                  </h3>
                  <div className="text-xs stat-text-muted">
                    <span className="stat-text-accent">12</span>/30
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                  {Array.from({ length: 30 }, (_, i) => (
                    <div key={i} className="equipment-slot aspect-square flex items-center justify-center">
                      {i === 0 && <Sword className="w-6 h-6 text-gray-400" />}
                      {i === 1 && <Shield className="w-6 h-6 text-gray-400" />}
                      {i === 2 && <div className="w-8 h-8 bg-purple-600 rounded-lg"></div>}
                      {i === 3 && <Gem className="w-6 h-6 text-purple-400" />}
                      {i === 4 && <div className="w-8 h-8 bg-green-600 rounded-lg"></div>}
                      {i === 5 && <Crown className="w-6 h-6 text-yellow-500" />}
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-600">
                  <div className="text-xs stat-text-muted">
                    Weight: <span className="stat-text-accent">45.2</span>/100
                  </div>
                  <button className="text-xs stat-text-accent hover:text-purple-300 transition-colors">
                    Auto Sort
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
