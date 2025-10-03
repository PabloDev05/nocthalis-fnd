/**
 * Arena logic — HTTP client & API wrappers
 * ------------------------------------------------------------------
 * Responsable de:
 *  - Crear un AxiosInstance con baseURL y Authorization (si hay token)
 *  - Exponer funciones de alto nivel para los endpoints del Arena
 *  - Incluir un "resolveWithFallback" que encapsula la cadena:
 *      POST /combat/resolve  → fallback a  POST /combat/simulate
 *        → fallback final a  GET  /combat/simulate (preview)
 *
 * *No* guarda estado de React ni conoce la UI. Reutilizable en hooks/views.
 */

import axios, { AxiosInstance } from "axios";
import { API_BASE, type TimelineBE } from "../types";
import { extractStamina } from "../helpers";

/* ────────────────────────── tipos de respuesta ────────────────────────── */

export type ResolveOutcome = "win" | "lose" | "draw";

/** Respuesta canónica de resolución/simulación de combate. */
export interface ResolvePayload {
  outcome: ResolveOutcome;
  timeline: TimelineBE[];
  rewards?: any | null;
  attacker?: any;
  defender?: any;
  /** Marcador para indicar que proviene de un preview o fallback. */
  __preview?: boolean;
}

/* ────────────────────────── fábrica de cliente ────────────────────────── */

/**
 * Crea un AxiosInstance con:
 *  - baseURL: API_BASE
 *  - Content-Type: application/json
 *  - Authorization: Bearer <token> (si se pasa un token)
 *
 * No tiene side-effects sobre React; se puede memoizar desde el hook.
 */
export function createArenaClient(token?: string): AxiosInstance {
  const inst = axios.create({
    baseURL: API_BASE,
    headers: { "Content-Type": "application/json" },
  });

  // Inyecta Authorization sólo si hay token
  inst.interceptors.request.use((cfg) => {
    if (token) {
      (cfg.headers as any) = {
        ...cfg.headers,
        Authorization: `Bearer ${token}`,
      };
    }
    return cfg;
  });

  return inst;
}

/* ────────────────────────── endpoints básicos ────────────────────────── */

/** GET /character/me */
export async function getMe(client: AxiosInstance) {
  const res = await client.get("/character/me");
  return res.data;
}

/** GET /character/progression */
export async function getProgression(client: AxiosInstance) {
  const res = await client.get("/character/progression");
  return res.data;
}

/** GET /arena/opponents */
export async function getOpponents(client: AxiosInstance, params: { size?: number; levelSpread?: number } = { size: 24, levelSpread: 20 }) {
  const res = await client.get("/arena/opponents", { params });
  return res.data;
}

/** GET /stamina */
export async function getStamina(client: AxiosInstance) {
  const res = await client.get("/stamina");
  // devolvemos crudo + snapshot útil ya parseado
  const snap = extractStamina(res.data);
  return { raw: res.data, snapshot: snap };
}

/** POST /stamina/admin/set (puede fallar si no hay permiso) */
export async function adminSetStamina(client: AxiosInstance, value: number) {
  const res = await client.post("/stamina/admin/set", { value: Number(value) });
  return res.data;
}

/** POST /arena/challenges (puede recibir X-Idempotency-Key opcional) */
export async function postChallenge(client: AxiosInstance, opponentId: string, idempotencyKey?: string) {
  const headers = idempotencyKey ? { "X-Idempotency-Key": idempotencyKey } : undefined;
  const res = await client.post("/arena/challenges", { opponentId }, headers ? { headers } : undefined);
  return res.data as { matchId?: string; attacker?: any; defender?: any };
}

/* ────────────────────────── resolución con fallbacks ─────────────────── */

/** POST /combat/resolve */
async function postCombatResolve(client: AxiosInstance, matchId: string) {
  const res = await client.post("/combat/resolve", { matchId });
  return res.data;
}

/** POST /combat/simulate */
async function postCombatSimulate(client: AxiosInstance, matchId: string) {
  const res = await client.post("/combat/simulate", { matchId });
  return res.data;
}

/** GET /combat/simulate (preview) */
async function getCombatSimulate(client: AxiosInstance, matchId: string) {
  const res = await client.get("/combat/simulate", { params: { matchId } });
  return res.data;
}

/**
 * Intenta resolver el match con varios fallbacks, normalizando la salida.
 * Orden: resolve → simulate(POST) → simulate(GET preview)
 *
 * @returns ResolvePayload (outcome, timeline, rewards?, attacker/defender?, __preview?)
 */
export async function resolveWithFallback(client: AxiosInstance, matchId: string): Promise<ResolvePayload> {
  try {
    const data = await postCombatResolve(client, matchId);
    return {
      outcome: (data?.outcome as ResolveOutcome) ?? "draw",
      timeline: (data?.timeline as TimelineBE[]) ?? (data?.snapshots as TimelineBE[]) ?? [],
      rewards: data?.rewards ?? null,
      attacker: data?.attacker,
      defender: data?.defender,
      __preview: false,
    };
  } catch {
    try {
      const data = await postCombatSimulate(client, matchId);
      return {
        outcome: (data?.outcome as ResolveOutcome) ?? "draw",
        timeline: (data?.timeline as TimelineBE[]) ?? (data?.snapshots as TimelineBE[]) ?? [],
        rewards: data?.rewards ?? null,
        attacker: data?.attacker,
        defender: data?.defender,
        __preview: false,
      };
    } catch {
      // Último recurso: GET preview
      const prev = await getCombatSimulate(client, matchId);
      return {
        outcome: (prev?.outcome as ResolveOutcome) ?? "draw",
        timeline: (prev?.timeline as TimelineBE[]) ?? (prev?.snapshots as TimelineBE[]) ?? [],
        rewards: null,
        attacker: prev?.attacker,
        defender: prev?.defender,
        __preview: true,
      };
    }
  }
}
