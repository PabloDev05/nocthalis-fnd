import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { CharacterApi, DuelResult, LogEntry, Opponent, ProgressionApi, Reward, TimelineBE, PVP_STAMINA_COST } from "../types";

import {
  // HTTP
  createArenaClient,
  getMe,
  getProgression,
  getOpponents,
  getStamina,
  adminSetStamina,
  postChallenge,
  resolveWithFallback,
  // logic
  mapOpponentsResponseToList,
  buildAnimationPlan,
  runAnimationPlan,
  clearTimers,
  getInitialDuelState,
  resetForNewDuel,
  resetForBackToSelect,
  centerLabelCopy as centerLabelByOutcome,
  mapRewards,
  skillTextSafe,
} from "../logic";

import { asInt } from "../helpers";
import type { FxAction } from "../logic";

export function useArena() {
  const { token, staminaCurrent, staminaMax, setStamina } = useAuth();
  const client = useMemo(() => createArenaClient(token ?? undefined), [token]);

  const [view, setView] = useState<"select" | "duel">("select");
  const [centerLabel, setCenterLabel] = useState<"VS" | "WIN" | "LOSE" | "DRAW">("VS");
  const [shakeKey, setShakeKey] = useState(0);
  const [duelResult, setDuelResult] = useState<DuelResult>(null);
  const [rewards, setRewards] = useState<Reward>(null);

  const [me, setMe] = useState<CharacterApi | null>(null);
  const [prog, setProg] = useState<ProgressionApi | null>(null);
  const [opponents, setOpponents] = useState<Opponent[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedOpp = opponents.find((o) => o.id === selectedId) || null;

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");

  // HP + combat
  const [hpMe, setHpMe] = useState(0);
  const [hpOpp, setHpOpp] = useState(0);
  const [combatLog, setCombatLog] = useState<LogEntry[]>([]);
  const [isFighting, setIsFighting] = useState(false);

  // Estado agrupado (sin hpMe/hpOpp)
  const [duelState, setDuelState] = useState(() => getInitialDuelState());

  // refs
  const timers = useRef<number[]>([]);
  const attackLockRef = useRef(false);
  const resolveLockRef = useRef(false);
  const currentMatchIdRef = useRef<string | null>(null);
  const idemKeyRef = useRef<string | null>(null);

  // derivados
  const myName = ((me as any)?.username ?? (me as any)?.name ?? "—") as string;
  const myLevel = (prog?.level ?? (me as any)?.level ?? "—") as number | string;
  const myMaxHP = asInt((me as any)?.combatStats?.maxHP ?? 0);

  function applyFx(action: FxAction) {
    setDuelState((s) => {
      const ns = { ...s };
      switch (action.kind) {
        case "hpGlow":
          if (action.side === "left") ns.hpGlowLeft += 1;
          else ns.hpGlowRight += 1;
          break;
        case "pulse":
          if (action.side === "left") {
            if (action.which === "passive") ns.pulseLeftPassive += 1;
            else ns.pulseLeftUlt += 1;
          } else {
            if (action.which === "passive") ns.pulseRightPassive += 1;
            else ns.pulseRightUlt += 1;
          }
          break;
        case "hitShake":
          if (action.side === "left") ns.hitShakeLeft += 1;
          else ns.hitShakeRight += 1;
          break;
        case "ultShake":
          if (action.side === "left") ns.ultShakeLeft += 1;
          else ns.ultShakeRight += 1;
          break;
        case "ultFlash":
          if (action.side === "left") ns.ultFlashLeft += 1;
          else ns.ultFlashRight += 1;
          break;
        case "blockFlash":
          if (action.side === "left") ns.blockFlashLeft += 1;
          else ns.blockFlashRight += 1;
          break;
        case "blockBump":
          if (action.side === "left") ns.blockBumpLeft += 1;
          else ns.blockBumpRight += 1;
          break;
        case "statusFlash":
          if (action.side === "left") {
            ns.statusVariantLeft = action.variant;
            ns.statusFlashLeft += 1;
          } else {
            ns.statusVariantRight = action.variant;
            ns.statusFlashRight += 1;
          }
          break;
        case "missNudge":
          if (action.side === "left") ns.missNudgeLeft += 1;
          else ns.missNudgeRight += 1;
          break;
        case "screenShake":
          setShakeKey((k) => k + 1);
          break;
      }
      return ns;
    });
  }

  async function refillStamina() {
    try {
      let max = staminaMax;
      if (!max || !Number.isFinite(max)) {
        const s0 = await getStamina(client);
        setStamina(s0.snapshot.current, s0.snapshot.max);
        max = s0.snapshot.max;
      }
      await adminSetStamina(client, Number(max ?? 100));
      const s1 = await getStamina(client);
      setStamina(s1.snapshot.current, s1.snapshot.max);
    } catch {
      try {
        const s = await getStamina(client);
        setStamina(s.snapshot.current, s.snapshot.max);
        setErr("No se pudo usar /stamina/admin/set (¿sin permiso?). Se refrescó la estamina.");
      } catch {
        setErr("No se pudo leer la estamina del servidor.");
      }
    }
  }

  // initial load
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setErr(null);

    Promise.all([getMe(client), getProgression(client), getOpponents(client, { size: 24, levelSpread: 20 }), getStamina(client)])
      .then(([meData, progData, oppData, stam]) => {
        if (!mounted) return;
        setMe(meData);
        setProg(progData);

        const list = mapOpponentsResponseToList(oppData);
        setOpponents(list);
        setSelectedId((prev) => prev ?? list[0]?.id ?? null);

        setStamina(stam.snapshot.current, stam.snapshot.max);

        if (view !== "duel") {
          setCenterLabel("VS");
          setDuelResult(null);
          setRewards(null);
          setCombatLog([]);
          setDuelState(getInitialDuelState());
        }
      })
      .catch((e) => {
        if (!mounted) return;
        setErr(e?.response?.data?.message || e.message || "Error loading arena");
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
      clearTimers({ current: timers.current });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client]);

  async function startChallenge() {
    if (attackLockRef.current) return;
    if (!selectedOpp || isFighting) return;

    if ((staminaCurrent ?? 0) < PVP_STAMINA_COST) {
      setErr(`You need ${PVP_STAMINA_COST} stamina to attack.`);
      return;
    }

    attackLockRef.current = true;
    resolveLockRef.current = false;
    currentMatchIdRef.current = null;

    setIsFighting(true);
    setErr(null);
    setView("duel");
    setCenterLabel("VS");
    setDuelResult(null);
    setRewards(null);
    setCombatLog([]);
    setHpMe(myMaxHP);
    setHpOpp(asInt(selectedOpp.maxHP ?? 0));
    setDuelState((prev) => ({ ...prev, ...resetForNewDuel() }));

    idemKeyRef.current = `${selectedOpp.id}:${Date.now()}:${Math.random().toString(36).slice(2)}`;

    try {
      const crt = await postChallenge(client, selectedOpp.id, idemKeyRef.current ?? undefined);

      // refresh stamina
      try {
        const s0 = await getStamina(client);
        setStamina(s0.snapshot.current, s0.snapshot.max);
      } catch {}

      const matchId: string | undefined = (crt as any)?.matchId;
      currentMatchIdRef.current = matchId ?? null;

      // Optional: seed textos/rangos
      const ca = (crt as any)?.attacker;
      const cd = (crt as any)?.defender;
      if (ca || cd) {
        setDuelState((s) => ({
          ...s,
          myPassiveText: skillTextSafe(ca?.passiveDefaultSkill),
          myUltText: skillTextSafe(ca?.ultimateSkill),
          oppPassiveText: skillTextSafe(cd?.passiveDefaultSkill),
          oppUltText: skillTextSafe(cd?.ultimateSkill),
          myDmgRange: ca?.combatStats
            ? {
                min: asInt(ca.combatStats.minDamage ?? ca.combatStats.damageMin ?? 0),
                max: asInt(ca.combatStats.maxDamage ?? ca.combatStats.damageMax ?? 0),
              }
            : s.myDmgRange,
          oppDmgRange: cd?.combatStats
            ? {
                min: asInt(cd.combatStats.minDamage ?? cd.combatStats.damageMin ?? 0),
                max: asInt(cd.combatStats.maxDamage ?? cd.combatStats.damageMax ?? 0),
              }
            : s.oppDmgRange,
        }));
      }

      if (!matchId) {
        setCenterLabel("DRAW");
        setDuelResult({ outcome: "draw", summary: "Match could not be created (invalid id)." });
        setIsFighting(false);
        return;
      }

      if (resolveLockRef.current) return;
      resolveLockRef.current = true;

      const result = await resolveWithFallback(client, matchId);

      // Mejor info de skills/rangos si viene en resolve
      const a = (result as any)?.attacker;
      const d = (result as any)?.defender;
      if (a || d) {
        setDuelState((s) => ({
          ...s,
          myPassiveText: a ? skillTextSafe(a?.passiveDefaultSkill) : s.myPassiveText,
          myUltText: a ? skillTextSafe(a?.ultimateSkill) : s.myUltText,
          oppPassiveText: d ? skillTextSafe(d?.passiveDefaultSkill) : s.oppPassiveText,
          oppUltText: d ? skillTextSafe(d?.ultimateSkill) : s.oppUltText,
          myDmgRange: a?.combatStats
            ? {
                min: asInt(a.combatStats.minDamage ?? a.combatStats.damageMin ?? 0),
                max: asInt(a.combatStats.maxDamage ?? a.combatStats.damageMax ?? 0),
              }
            : s.myDmgRange,
          oppDmgRange: d?.combatStats
            ? {
                min: asInt(d.combatStats.minDamage ?? d.combatStats.damageMin ?? 0),
                max: asInt(d.combatStats.maxDamage ?? d.combatStats.damageMax ?? 0),
              }
            : s.oppDmgRange,
        }));
      }

      // Plan
      const plan = buildAnimationPlan({
        rawTimeline: (result.timeline as TimelineBE[]) ?? [],
        myMaxHP,
        oppMaxHP: asInt(selectedOpp.maxHP ?? 0),
        myName,
        oppName: selectedOpp?.name ?? "—",
      });

      runAnimationPlan(plan, {
        timerRef: { current: timers.current },
        callbacks: {
          onDamage: (info) => {
            if (info.actorIsPlayer) {
              setHpOpp((hp) => Math.max(0, hp - info.dmg));
            } else {
              setHpMe((hp) => Math.max(0, hp - info.dmg));
            }
          },
          onFx: (action) => applyFx(action),
          onLog: (entry) => setCombatLog((prev) => [...prev, entry]),
        },
      });

      // ⛔ IMPORTANTE:
      // Al final NO forzamos HP desde la proyección si hubo animación.
      // Dejamos los HP tal como quedaron por onDamage (evita "salto" a full).
      setTimeout(() => {
        const outcome = (result.outcome as "win" | "lose" | "draw") ?? "draw";
        setCenterLabel(centerLabelByOutcome(outcome));
        setDuelResult({
          outcome,
          summary: outcome === "win" ? "You have won." : outcome === "lose" ? "You were defeated." : "Draw.",
        });
        setRewards(mapRewards((result as any)?.rewards));

        // Fallback ONLY si no hubo animación (plan.totalMs = 0)
        if (!plan.totalMs) {
          // en ese caso nadie aplicó onDamage, así que fijamos proyección
          setHpMe(plan.projection.finalPlayerHP);
          setHpOpp(plan.projection.finalEnemyHP);
        }
      }, plan.totalMs + 140);
    } catch {
      setCenterLabel("DRAW");
      setDuelResult({ outcome: "draw", summary: "Could not resolve combat (visual fallback)." });
    } finally {
      setIsFighting(false);
      attackLockRef.current = false;
      resolveLockRef.current = false;
    }
  }

  const canAttack = (staminaCurrent ?? 0) >= PVP_STAMINA_COST;

  const selectProps = {
    opponents,
    selectedId,
    setSelectedId,
    q,
    setQ,
    canAttack,
    isFighting,
    onAttack: startChallenge,
    staminaCost: PVP_STAMINA_COST,
  };

  const duelProps =
    selectedOpp && me
      ? {
          me,
          myName,
          myLevel,
          myMaxHP,
          selectedOpp,
          hpMe,
          hpOpp,
          centerLabel,
          shakeKey,
          onBack: () => {
            clearTimers({ current: timers.current });
            setView("select");
            setCenterLabel("VS");
            setCombatLog([]);
            setRewards(null);
            setDuelState((prev) => ({ ...prev, ...resetForBackToSelect() }));
          },
          ...duelState,
          duelResult,
          rewards,
          combatLog,
        }
      : null;

  return {
    loading,
    err,
    setErr,
    view,
    setView,
    selectedOpp,
    refillStamina,
    selectProps,
    duelProps,
  };
}
