import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import {
  Sword,
  Shield,
  Settings,
  Swords,
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
  Trophy,
  Star,
  FlaskConical as Flask,
} from "lucide-react";
import type { CharacterApi, EquipmentSlot } from "../../types/character";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3030/api";

// Orden visible de Character Stats (izquierda de las 5 filas)
const STATS_LEFT_5: (keyof CharacterApi["stats"])[] = [
  "strength",
  "agility",
  "vitality",
  "endurance",
  "luck",
];

// Resistencias (sin critical reductions)
const ORDERED_RESIST: (keyof CharacterApi["resistances"])[] = [
  "fire",
  "ice",
  "lightning",
  "poison",
  "sleep",
  "paralysis",
  "confusion",
  "fear",
  "dark",
  "holy",
  "stun",
  "bleed",
  "curse",
  "knockback",
];

// Orden completo de combat para calcular qué queda en el bloque de la izquierda
const ORDERED_COMBAT: (keyof NonNullable<CharacterApi["combatStats"]>)[] = [
  "maxHP",
  "maxMP",
  "attackPower",
  "magicPower",
  "criticalChance",
  "criticalDamageBonus",
  "attackSpeed",
  "evasion",
  "blockChance",
  "blockValue",
  "lifeSteal",
  "manaSteal",
  "damageReduction",
  "movementSpeed",
];

// /character/progression
type ProgressionApi = {
  level: number;
  experience: number;
  nextLevelAt: number;
  xpToNext: number;
};

function labelize(key: string) {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
}

const EquipmentSlotView = ({
  slot,
  icon: Icon,
  itemId,
}: {
  slot: EquipmentSlot;
  icon: any;
  itemId: string | null;
}) => (
  <div
    className="equipment-slot flex items-center justify-center"
    title={itemId ?? slot}
  >
    <Icon className="w-10 h-10 text-gray-500" />
  </div>
);

// Elegimos Attack/Magic como “principal” y escondemos el otro
function pickPrimaryPower(data?: CharacterApi | null): {
  key: "attackPower" | "magicPower";
  label: string;
  isMage: boolean;
} {
  const name =
    ((data as any)?.class?.name as string | undefined)?.toLowerCase() ??
    (data?.className ?? "").toLowerCase();
  const isMage = /mago|mage|wizard|sorcer/i.test(name);
  if (!data?.combatStats)
    return {
      key: isMage ? "magicPower" : "attackPower",
      label: isMage ? "Magic Power" : "Attack Power",
      isMage,
    };
  const { attackPower = 0, magicPower = 0 } = data.combatStats;
  if (isMage || magicPower > attackPower) {
    return { key: "magicPower", label: "Magic Power", isMage: true };
  }
  return { key: "attackPower", label: "Attack Power", isMage: false };
}

export default function GameInterface() {
  const { token } = useAuth();

  const [activeMenu, setActiveMenu] = useState("character");
  const [data, setData] = useState<CharacterApi | null>(null);
  const [progression, setProgression] = useState<ProgressionApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const client = useMemo(() => {
    const instance = axios.create({
      baseURL: API_BASE,
      headers: { "Content-Type": "application/json" },
    });
    instance.interceptors.request.use((cfg) => {
      if (token)
        cfg.headers = {
          ...cfg.headers,
          Authorization: `Bearer ${token}`,
        } as any;
      return cfg;
    });
    return instance;
  }, [token]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    Promise.all([
      client.get<CharacterApi>("/character/me"),
      client.get<ProgressionApi>("/character/progression").catch((e) => {
        console.warn("GET /character/progression failed:", e?.response ?? e);
        return { data: null as any };
      }),
    ])
      .then(([meRes, progRes]) => {
        if (!mounted) return;
        console.log("GET /character/me status:", meRes.status);
        console.log("GET /character/me data:", meRes.data);
        if (progRes?.data)
          console.log("GET /character/progression data:", progRes.data);
        setData(meRes.data);
        setProgression(progRes?.data ?? null);
      })
      .catch((err) => {
        if (!mounted) return;
        console.error("Character load error:", err?.response ?? err);
        setError(
          err?.response?.data?.message ||
            err.message ||
            "Error fetching character"
        );
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [client]);

  const menuItems = [
    { id: "character", label: "CHARACTER", icon: User, disabled: false },
    { id: "options", label: "OPTIONS", icon: Settings, disabled: true },
    { id: "arena", label: "ARENA", icon: Swords, disabled: true },
  ] as const;

  // Extra Info
  const lvl = progression?.level ?? data?.level ?? "—";
  const exp = progression?.experience ?? data?.experience ?? 0;
  const clazz = (data as any)?.class as
    | {
        name?: string;
        description?: string;
        passiveDefault?: { name: string; description: string };
      }
    | undefined;
  const className = clazz?.name ?? data?.className ?? "—";

  // Combat destacados (derecha), en el orden pedido
  const p = pickPrimaryPower(data);
  const RIGHT_FEATURED: Array<{
    key: keyof NonNullable<CharacterApi["combatStats"]>;
    label?: string;
  }> = [
    { key: p.key, label: p.label }, // Strength ↔ Attack/Magic
    { key: "evasion" }, // Agility ↔ Evasion
    { key: "blockChance" }, // Vitality ↔ Block Chance
    { key: "damageReduction" }, // Endurance ↔ Damage Reduction
    { key: "criticalChance" }, // Luck ↔ Critical Chance
  ];

  // Combat “resto” (izquierda): quitamos los 5 de la derecha y también el poder contrario (para no repetir)
  const combatRest = ORDERED_COMBAT.filter(
    (k) =>
      !RIGHT_FEATURED.some((r) => r.key === k) &&
      k !== (p.isMage ? "attackPower" : "magicPower")
  );

  // Pasivas desbloqueadas sin duplicar la default
  const unlockedUnique = (() => {
    const base = data?.passivesUnlocked ?? [];
    const exclude = clazz?.passiveDefault?.name?.toLowerCase();
    const set = new Set<string>();
    base.forEach((name) => {
      const k = (name || "").toLowerCase();
      if (exclude && k === exclude) return;
      if (!set.has(k)) set.add(name);
    });
    return Array.from(set);
  })();

  return (
    <div className="min-h-screen text-sm leading-tight space-y-2 bg-[var(--bg)] relative">
      {/* Navbar original */}
      <header className="relative z-10 dark-panel m-4 p-4 flex justify-between items-center">
        <div className="flex items-center space-x-8">
          <h1 className="text-3xl font-bold stat-text tracking-wide font-serif">
            Nocthalis
          </h1>
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
        {/* Menú lateral */}
        <aside className="w-59 h-215 p-2 space-y-1 ml-1 rounded-lg shadow-lg border border-[var(--border)] bg-[var(--panel-2)]">
          {menuItems.map((item) => {
            const Icon = item.icon as any;
            const isActive = activeMenu === item.id;
            const common =
              "w-full gothic-button flex items-center space-x-4 text-left";
            if (item.disabled) {
              return (
                <div
                  key={item.id}
                  aria-disabled
                  className={`${common} opacity-50 cursor-not-allowed`}
                  title={`${item.label} (próximamente)`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
              );
            }
            return (
              <button
                key={item.id}
                onClick={() => setActiveMenu(item.id)}
                className={`${common} ${isActive ? "active" : ""}`}
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
            {/* CONTENEDOR IZQUIERDO “lindo” */}
            <div className="col-span-2 ml-1">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-2)] p-4 space-y-6 shadow-lg">
                {loading && (
                  <div className="card-muted p-4 text-sm stat-text-muted">
                    Cargando personaje…
                  </div>
                )}
                {error && !loading && (
                  <div className="card-muted p-4 text-sm text-red-400">
                    {error}
                  </div>
                )}

                {/* Fila 1: Extra info + Pasivas */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="dark-panel p-4">
                    <h3 className="stat-text font-semibold mb-4 flex items-center text-lg">
                      <Info className="w-5 h-5 mr-3 text-accent" /> Extra Info
                    </h3>
                    <ul className="text-sm space-y-2 stat-text-muted">
                      <li>
                        <strong>Nombre:</strong> {data?.name ?? "—"}
                      </li>
                      <li>
                        <strong>Nivel:</strong> {lvl}
                      </li>
                      <li>
                        <strong>Experiencia:</strong> {exp}
                      </li>{" "}
                      {/* único relacionado a XP */}
                      <li>
                        <strong>Clase:</strong> {className}
                      </li>
                      {clazz?.description && (
                        <li className="leading-snug">
                          <strong>Descripción:</strong> {clazz.description}
                        </li>
                      )}
                      {(data as any)?.selectedSubclass?.name && (
                        <li>
                          <strong>Subclase:</strong>{" "}
                          {(data as any).selectedSubclass.name}
                        </li>
                      )}
                    </ul>
                  </div>

                  <div className="dark-panel p-4">
                    <h3 className="stat-text font-semibold mb-4 flex items-center text-lg">
                      <Flame className="w-5 h-5 mr-3 text-accent" /> Passive /
                      Ultimate Skills
                    </h3>
                    <div className="space-y-3 text-sm">
                      {clazz?.passiveDefault && (
                        <div className="flex items-start space-x-3">
                          <Shield className="w-5 h-5 text-gray-300 mt-1" />
                          <div>
                            <strong className="text-white">
                              {clazz.passiveDefault.name}
                            </strong>
                            <div className="stat-text-muted">
                              {clazz.passiveDefault.description}
                            </div>
                          </div>
                        </div>
                      )}
                      {unlockedUnique.map((p) => (
                        <div key={p} className="flex items-start space-x-3">
                          <Zap className="w-5 h-5 text-accent mt-1" />
                          <div>
                            <strong className="text-white">{p}</strong>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Fila 2: Resistencias | Combat (resto + defensas) */}
                <div className="grid grid-cols-2 gap-6 auto-rows-fr">
                  <div className="dark-panel p-4 h-full">
                    <h3 className="text-white font-semibold mb-4 text-base">
                      Resistencias
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {ORDERED_RESIST.map((key) => (
                        <div
                          key={String(key)}
                          className="flex justify-between items-center"
                        >
                          <span className="text-gray-300 text-sm">
                            {labelize(String(key))}
                          </span>
                          <span className="text-accent font-bold text-sm">
                            {data?.resistances?.[key] ?? "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="dark-panel p-4 h-full">
                    <h3 className="text-white font-semibold mb-4 text-base">
                      Combat Stats
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {combatRest.map((key) => (
                        <div
                          key={String(key)}
                          className="flex justify-between items-center"
                        >
                          <span className="text-gray-300 text-sm">
                            {labelize(String(key))}
                          </span>
                          <span className="text-accent font-bold text-sm">
                            {data?.combatStats
                              ? String(data.combatStats[key])
                              : "—"}
                          </span>
                        </div>
                      ))}

                      {/* Agregados: Physical/Magical Defense (vienen de stats) */}
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300 text-sm">
                          Physical Defense
                        </span>
                        <span className="text-accent font-bold text-sm">
                          {data?.stats?.physicalDefense ?? "—"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300 text-sm">
                          Magical Defense
                        </span>
                        <span className="text-accent font-bold text-sm">
                          {data?.stats?.magicalDefense ?? "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fila 3: Achievements | Potions (alineados) */}
                <div className="grid grid-cols-2 gap-6 auto-rows-fr">
                  <div className="dark-panel p-4 h-full">
                    <h3 className="stat-text font-semibold mb-4 flex items-center text-base">
                      <Trophy className="w-5 h-5 mr-3 text-yellow-500" />{" "}
                      Achievements
                    </h3>
                    <div className="flex gap-3">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-700 flex items-center justify-center shadow"
                        >
                          <Star className="w-5 h-5 text-yellow-900" />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="dark-panel p-4 h-full">
                    <h3 className="stat-text font-semibold mb-4 flex items-center text-base">
                      <Flask className="w-5 h-5 mr-3 text-green-500" /> Potions
                    </h3>

                    {/* 5 slots: solo 1 poción ficticia */}
                    <div className="grid grid-cols-5 gap-2">
                      {Array.from({ length: 5 }, (_, i) => (
                        <div
                          key={i}
                          className="aspect-square equipment-slot flex items-center justify-center"
                          title={i === 0 ? "Small Healing Potion" : "Empty"}
                        >
                          {i === 0 ? (
                            <div className="w-6 h-6 rounded-md bg-red-600" />
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Panel derecho: equipo + avatar + 2 columnas (5 y 5) + inventario */}
            <div className="dark-panel p-6 max-w-4x2 mx-auto">
              {/* Equipo */}
              <div className="flex justify-center mb-8">
                <div className="relative">
                  <div className="grid grid-cols-3 gap-4 items-center">
                    {/* Izquierda */}
                    <div className="flex flex-col gap-3 items-center justify-center">
                      <EquipmentSlotView
                        slot="helmet"
                        icon={CircleDot}
                        itemId={data?.equipment.helmet ?? null}
                      />
                      <EquipmentSlotView
                        slot="chest"
                        icon={Shirt}
                        itemId={data?.equipment.chest ?? null}
                      />
                      <EquipmentSlotView
                        slot="gloves"
                        icon={Hand}
                        itemId={data?.equipment.gloves ?? null}
                      />
                      <EquipmentSlotView
                        slot="boots"
                        icon={Boots}
                        itemId={data?.equipment.boots ?? null}
                      />
                    </div>

                    {/* Centro: avatar */}
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-48 text-center text-lg text-accent font-bold px-3 py-1 bg-[var(--panel-2)] border border-[var(--border)]">
                        {data?.name ?? "—"}
                      </div>
                      <div className="w-48 h-56 bg-[var(--panel-2)] shadow-inner flex items-center justify-center border-x border-[var(--border)]">
                        <User className="w-24 h-24 text-gray-300" />
                      </div>
                      <div className="w-48 h-8 bg-[var(--panel-2)] rounded-b-lg border border-[var(--border)] relative overflow-hidden badge-level flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          Level {lvl}
                        </span>
                      </div>
                      <div className="flex gap-4 mt-5.5 justify-center">
                        <EquipmentSlotView
                          slot="mainWeapon"
                          icon={Sword}
                          itemId={data?.equipment.mainWeapon ?? null}
                        />
                        <EquipmentSlotView
                          slot="offWeapon"
                          icon={Shield}
                          itemId={data?.equipment.offWeapon ?? null}
                        />
                      </div>
                    </div>

                    {/* Derecha accesorios */}
                    <div className="flex flex-col gap-3 items-center justify-center">
                      <EquipmentSlotView
                        slot="amulet"
                        icon={Necklace}
                        itemId={data?.equipment.amulet ?? null}
                      />
                      <EquipmentSlotView
                        slot="belt"
                        icon={Belt}
                        itemId={data?.equipment.belt ?? null}
                      />
                      <EquipmentSlotView
                        slot="ring"
                        icon={Ring}
                        itemId={data?.equipment.ring ?? null}
                      />
                      <div className="w-20 h-20" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Dos columnas: Character Stats (5) | Combat Stats (5) */}
              {data && (
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="card-muted p-4">
                    <h3 className="text-white font-semibold mb-4 flex items-center text-base">
                      <Zap className="w-5 h-5 mr-3 text-accent" /> Character
                      Stats
                    </h3>
                    <div className="space-y-3">
                      {STATS_LEFT_5.map((key) => (
                        <div
                          key={String(key)}
                          className="flex justify-between items-center"
                        >
                          <span className="text-gray-300 text-sm">
                            {labelize(String(key))}
                          </span>
                          <div className="flex items-center space-x-3">
                            <span className="text-white font-bold">
                              {data.stats[key]}
                            </span>
                            <Plus className="w-4 h-4 text-green-500 cursor-pointer hover:text-green-400 transition-colors" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="card-muted p-4">
                    <h3 className="text-white font-semibold mb-4 text-base">
                      Combat Stats
                    </h3>
                    <div className="space-y-3">
                      {RIGHT_FEATURED.map(({ key, label }) => (
                        <div
                          key={String(key)}
                          className="flex justify-between items-center"
                        >
                          <span className="text-gray-300 text-sm">
                            {label ?? labelize(String(key))}
                          </span>
                          <span className="text-accent font-bold text-sm">
                            {data?.combatStats
                              ? String(data.combatStats[key])
                              : "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Inventario (placeholder) */}
              <div className="border-t border-[var(--border)] pt-6">
                <div className="flex items-centered justify-between mb-4">
                  <h3 className="text-white font-semibold flex items-center">
                    <Backpack className="w-5 h-5 mr-2 text-gray-400" />{" "}
                    Inventory
                  </h3>
                  <div className="text-xs text-gray-400">
                    <span className="text-accent">—</span>/—
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-2 mb-4">
                  {Array.from({ length: 10 }, (_, i) => (
                    <div
                      key={i}
                      className="aspect-square equipment-slot flex items-center justify-center hover:border-[var(--accent-weak)] transition-colors cursor-pointer"
                    >
                      {i === 0 && <Sword className="w-6 h-6 text-gray-400" />}
                      {i === 1 && <Shield className="w-6 h-6 text-gray-400" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
