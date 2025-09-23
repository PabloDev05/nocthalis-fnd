// app/pages/gameInterface/hooks/useCharacter.ts
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import type { CharacterApi } from "../../../../types/character";
import { useAuth } from "../../../context/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3030/api";

export type ProgressionApi = {
  level: number;
  experience: number;
  currentLevelAt: number;
  nextLevelAt: number;
  xpSinceLevel: number;
  xpForThisLevel: number;
  xpToNext: number;
  xpPercent?: number;
  isMaxLevel?: boolean;
  availablePoints?: number;
  pendingLevels?: number;
  canAllocateNow?: boolean;
};

/** ⛔️ Importante: NO normalizamos nada. Backend = fuente de verdad */
function identityCharacter(input: CharacterApi): CharacterApi {
  return input;
}

export function useCharacter() {
  const { token, setStamina } = useAuth();
  const [data, setData] = useState<CharacterApi | null>(null);
  const [progression, setProgression] = useState<ProgressionApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allocating, setAllocating] = useState<keyof CharacterApi["stats"] | null>(null);

  const client = useMemo(() => {
    const instance = axios.create({
      baseURL: API_BASE,
      headers: { "Content-Type": "application/json" },
    });
    instance.interceptors.request.use((cfg) => {
      if (token) (cfg.headers as any) = { ...cfg.headers, Authorization: `Bearer ${token}` };
      return cfg;
    });
    return instance;
  }, [token]);

  async function syncStamina(snapshot?: any) {
    try {
      const { data: st } = await client.get("/stamina");
      const cur = Number(st?.current ?? st?.value ?? st?.stamina ?? 0) || 0;
      const max = Number(st?.max ?? st?.staminaMax ?? 10) || 10;
      setStamina(cur, max);
    } catch {
      if (snapshot) {
        const cur = Number(snapshot?.stamina ?? snapshot?.energy ?? 0) || 0;
        const max = Number(snapshot?.staminaMax ?? 10) || 10;
        setStamina(cur, max);
      } else {
        setStamina(0, 10);
      }
    }
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [meRes, progRes] = await Promise.all([client.get<CharacterApi>("/character/me"), client.get<ProgressionApi>("/character/progression")]);
        if (!mounted) return;
        setData(identityCharacter(meRes.data)); // << sin normalizar
        setProgression(progRes.data);
        await syncStamina(meRes.data);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.response?.data?.message || e.message || "Error fetching character");
        await syncStamina();
      } finally {
        mounted && setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [client]);

  /**
   * Alias de claves permitidas por backend
   */
  const KEY_ALIAS: Record<string, keyof CharacterApi["stats"]> = {
    str: "strength",
    strength: "strength",
    dex: "dexterity",
    dexterity: "dexterity",
    int: "intelligence",
    intelligence: "intelligence",
    con: "constitution",
    constitution: "constitution",
    end: "endurance",
    endurance: "endurance",
    luk: "luck",
    luck: "luck",
    fate: "fate",
    pdef: "physicalDefense",
    physicaldefense: "physicalDefense",
    mdef: "magicalDefense",
    magicaldefense: "magicalDefense",
  };
  function canonKeyFront(k: string): keyof CharacterApi["stats"] {
    const low = String(k).toLowerCase();
    return KEY_ALIAS[low] ?? (k as keyof CharacterApi["stats"]);
  }

  async function allocateOne(key: keyof CharacterApi["stats"]) {
    if (allocating) return;
    const canon = canonKeyFront(String(key));
    setAllocating(canon);
    try {
      await client.post("/character/allocate", { allocations: { [canon]: 1 } });

      // ⛔️ importante: pisamos el estado con lo que devuelva el backend, sin mezclar.
      const [me, prog] = await Promise.all([client.get<CharacterApi>("/character/me"), client.get<ProgressionApi>("/character/progression")]);
      setData(identityCharacter(me.data)); // << sin merge
      setProgression(prog.data);
      setError(null);
      await syncStamina(me.data);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Error allocating points");
    } finally {
      setAllocating(null);
    }
  }

  return {
    data,
    progression,
    loading,
    error,
    setError,
    allocating,
    allocateOne,
  };
}
