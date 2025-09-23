import { JSX, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, useLocation } from "react-router";
import { Flame, Settings, Swords, User, RotateCcw } from "lucide-react";
import { BigStaminaBar } from "./components/LadderAndStamina";

import {
  API_BASE,
  PVP_STAMINA_COST,
  CharacterApi,
  DuelResult,
  LogEntry,
  Opponent,
  ProgressionApi,
  Reward,
  ViewMode,
  TimelineBE,
} from "./types";
import { asInt, extractStamina, skillText } from "./helpers";
import { buildAnimationSchedule } from "./scheduler";

// vistas nuevas
import { SelectView } from "./views/SelectView";
import { DuelView } from "./views/DuelView";

export default function Arena() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, logout, staminaCurrent, staminaMax, setStamina } = useAuth();

  const client = useMemo(() => {
    const i = axios.create({
      baseURL: API_BASE,
      headers: { "Content-Type": "application/json" },
    });
    i.interceptors.request.use((cfg) => {
      if (token)
        (cfg.headers as any) = {
          ...cfg.headers,
          Authorization: `Bearer ${token}`,
        };
      return cfg;
    });
    return i;
  }, [token]);

  const [view, setView] = useState<ViewMode>("select");
  const [centerLabel, setCenterLabel] = useState<
    "VS" | "WIN" | "LOSE" | "DRAW"
  >("VS");
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
  const timers = useRef<number[]>([]);

  // locks
  const attackLockRef = useRef(false);
  const resolveLockRef = useRef(false);
  const currentMatchIdRef = useRef<string | null>(null);
  const idemKeyRef = useRef<string | null>(null);

  // FX
  const [pulseLeftPassive, setPulseLeftPassive] = useState(0);
  const [pulseLeftUlt, setPulseLeftUlt] = useState(0);
  const [pulseRightPassive, setPulseRightPassive] = useState(0);
  const [pulseRightUlt, setPulseRightUlt] = useState(0);
  const [hpGlowLeft, setHpGlowLeft] = useState(0);
  const [hpGlowRight, setHpGlowRight] = useState(0);
  const [blockFlashLeft, setBlockFlashLeft] = useState(0);
  const [blockFlashRight, setBlockFlashRight] = useState(0);
  const [ultFlashLeft, setUltFlashLeft] = useState(0);
  const [ultFlashRight, setUltFlashRight] = useState(0);
  const [ultShakeLeft, setUltShakeLeft] = useState(0);
  const [ultShakeRight, setUltShakeRight] = useState(0);
  const [hitShakeLeft, setHitShakeLeft] = useState(0);
  const [hitShakeRight, setHitShakeRight] = useState(0);
  const [blockBumpLeft, setBlockBumpLeft] = useState(0);
  const [blockBumpRight, setBlockBumpRight] = useState(0);

  // skills + dmg ranges
  const [myPassiveText, setMyPassiveText] = useState<string | null>(null);
  const [myUltText, setMyUltText] = useState<string | null>(null);
  const [oppPassiveText, setOppPassiveText] = useState<string | null>(null);
  const [oppUltText, setOppUltText] = useState<string | null>(null);
  const [myDmgRange, setMyDmgRange] = useState<{
    min: number;
    max: number;
  } | null>(null);
  const [oppDmgRange, setOppDmgRange] = useState<{
    min: number;
    max: number;
  } | null>(null);

  function clearTimers() {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  }

  async function refillStamina() {
    try {
      // si conocemos el max del contexto, lo usamos; si no, pedimos snapshot primero
      let max = staminaMax;
      if (!max || !Number.isFinite(max)) {
        const s0 = await client.get("/stamina");
        const snap0 = extractStamina(s0.data);
        setStamina(snap0.current, snap0.max);
        max = snap0.max;
      }

      // setear a tope con endpoint admin
      await client.post("/stamina/admin/set", { value: Number(max ?? 100) });

      // refrescar snapshot para reflejar la UI
      const s1 = await client.get("/stamina");
      const snap1 = extractStamina(s1.data);
      setStamina(snap1.current, snap1.max);
    } catch (e: any) {
      // si no hay permisos/admin, al menos refrescamos
      try {
        const s = await client.get("/stamina");
        const snap = extractStamina(s.data);
        setStamina(snap.current, snap.max);
        // feedback útil
        setErr(
          "No se pudo usar /stamina/admin/set (¿sin permiso?). Se refrescó la estamina."
        );
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

    Promise.all([
      client.get<CharacterApi>("/character/me"),
      client.get<ProgressionApi>("/character/progression"),
      client.get<any>("/arena/opponents?size=24&levelSpread=20"),
      client.get<any>("/stamina"),
    ])
      .then(([meRes, progRes, oppRes, stamRes]) => {
        if (!mounted) return;

        setMe(meRes.data);
        setProg(progRes.data);

        const rawList =
          oppRes.data?.opponents ??
          oppRes.data?.rivals ??
          (Array.isArray(oppRes.data) ? oppRes.data : []);
        const list: Opponent[] = Array.isArray(rawList)
          ? rawList.map((raw: any) => ({
              id: String(raw?.userId ?? raw?.id ?? raw?._id ?? ""),
              name: String(raw?.name ?? raw?.username ?? "—"),
              level: Number(raw?.level ?? 0),
              className: raw?.className ?? raw?.class?.name ?? undefined,
              stats: { ...(raw?.stats ?? {}) },
              combatStats: {
                ...(raw?.combatStats ?? {}),
                minDamage:
                  raw?.combatStats?.minDamage ??
                  raw?.combatStats?.damageMin ??
                  raw?.combatStats?.min ??
                  undefined,
                maxDamage:
                  raw?.combatStats?.maxDamage ??
                  raw?.combatStats?.damageMax ??
                  raw?.combatStats?.max ??
                  undefined,
                criticalChance:
                  raw?.combatStats?.criticalChance ??
                  raw?.combatStats?.critChance ??
                  raw?.combatStats?.crit ??
                  undefined,
                blockChance:
                  raw?.combatStats?.blockChance ??
                  raw?.combatStats?.block ??
                  undefined,
                evasion:
                  raw?.combatStats?.evasion ??
                  raw?.combatStats?.evade ??
                  raw?.combatStats?.evasionChance ??
                  raw?.combatStats?.evadeChance ??
                  raw?.combatStats?.dodge ??
                  raw?.combatStats?.dodgeChance ??
                  undefined,
                attackPower: raw?.combatStats?.attackPower,
                magicPower: raw?.combatStats?.magicPower,
              },
              maxHP: Number(raw?.maxHP ?? raw?.combatStats?.maxHP ?? 0),
              avatarUrl: raw?.avatarUrl ?? null,
              passiveDefaultSkill: null,
              ultimateSkill: null,
              clanName:
                raw?.clanName ?? raw?.clan?.name ?? raw?.guild?.name ?? null,
              honor: raw?.honor ?? raw?.rating ?? null,
            }))
          : [];
        setOpponents(list);
        setSelectedId((prev) => prev ?? (list[0]?.id as string) ?? null);

        const snap = extractStamina(stamRes.data);
        setStamina(snap.current, snap.max);

        if (view !== "duel") {
          setCenterLabel("VS");
          setDuelResult(null);
          setRewards(null);
          setCombatLog([]);
          setMyDmgRange(null);
          setOppDmgRange(null);
          setMyPassiveText(null);
          setMyUltText(null);
          setOppPassiveText(null);
          setOppUltText(null);
        }
      })
      .catch((e) => {
        if (!mounted) return;
        setErr(
          e?.response?.data?.message || e.message || "Error loading arena"
        );
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client]);

  const myName = (me as any)?.username ?? (me as any)?.name ?? "—";
  const myLevel = prog?.level ?? me?.level ?? "—";
  const myMaxHP = asInt(me?.combatStats?.maxHP ?? 0);

  useEffect(() => {
    clearTimers();
    if (view === "duel") {
      setHpMe(myMaxHP);
      setHpOpp(asInt(selectedOpp?.maxHP ?? 0));
      setCombatLog([]);
      setPulseLeftPassive(0);
      setPulseLeftUlt(0);
      setPulseRightPassive(0);
      setPulseRightUlt(0);
      setHpGlowLeft(0);
      setHpGlowRight(0);
      setBlockFlashLeft(0);
      setBlockFlashRight(0);
      setUltFlashLeft(0);
      setUltFlashRight(0);
      setUltShakeLeft(0);
      setUltShakeRight(0);
      setHitShakeLeft(0);
      setHitShakeRight(0);
      setBlockBumpLeft(0);
      setBlockBumpRight(0);
      setMyPassiveText("—");
      setMyUltText("—");
      setOppPassiveText("—");
      setOppUltText("—");
      setMyDmgRange(null);
      setOppDmgRange(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, selectedId, myMaxHP, selectedOpp?.maxHP]);

  const isPlayerRole = (role: "attacker" | "defender", turn: number) =>
    turn % 2 === 1 ? role === "attacker" : role === "defender";

  function playScheduled(timeline: TimelineBE[]) {
    const schedule = buildAnimationSchedule(timeline);
    if (!schedule.events.length) return 0;
    let playerHP = myMaxHP;
    let enemyHP = asInt(selectedOpp?.maxHP || 0);
    setHpMe(playerHP);
    setHpOpp(enemyHP);

    schedule.events.forEach((ev) => {
      const t = window.setTimeout(() => {
        const p = ev.payload;
        const turn = p.turn;
        const actorIsPlayer = isPlayerRole(ev.role, turn);
        const who = actorIsPlayer ? myName : (selectedOpp?.name ?? "—");
        const tgt = actorIsPlayer ? (selectedOpp?.name ?? "—") : myName;
        const dmg = Math.max(0, asInt(p.damage ?? 0));

        const pushLog = (kind: LogEntry["kind"], text: string) =>
          setCombatLog((prev) =>
            prev.concat({
              turn,
              kind,
              text,
              actor: actorIsPlayer ? "me" : "opp",
              value: dmg,
            })
          );

        if (ev.type === "passive_proc") {
          if (actorIsPlayer) {
            setPulseLeftPassive((x) => x + 1);
            setHpGlowLeft((x) => x + 1);
          } else {
            setPulseRightPassive((x) => x + 1);
            setHpGlowRight((x) => x + 1);
          }
          const passiveName = p.ability?.name ?? "Passive";
          pushLog(
            "passive",
            dmg > 0
              ? `${who} triggers ${passiveName} for ${dmg}.`
              : `${who} triggers ${passiveName}.`
          );
          if (dmg > 0) {
            if (actorIsPlayer) enemyHP = Math.max(0, enemyHP - dmg);
            else playerHP = Math.max(0, playerHP - dmg);
            setHpMe(playerHP);
            setHpOpp(enemyHP);
          }
          return;
        }

        if (ev.type === "ultimate_cast") {
          if (actorIsPlayer) {
            setPulseLeftUlt((x) => x + 1);
            setHpGlowLeft((x) => x + 1);
            setUltFlashRight((x) => x + 1);
            setUltShakeRight((x) => x + 1);
          } else {
            setPulseRightUlt((x) => x + 1);
            setHpGlowRight((x) => x + 1);
            setUltFlashLeft((x) => x + 1);
            setUltShakeLeft((x) => x + 1);
          }
          const ultName = p.ability?.name ?? "Ultimate";
          pushLog(
            "ultimate",
            dmg > 0
              ? `${who} unleashes ${ultName} on ${tgt} for ${dmg}!`
              : `${who} unleashes ${ultName}.`
          );
          if (dmg > 0) {
            if (actorIsPlayer) enemyHP = Math.max(0, enemyHP - dmg);
            else playerHP = Math.max(0, playerHP - dmg);
            setHpMe(playerHP);
            setHpOpp(enemyHP);
          }
          return;
        }

        if (ev.type === "dot_tick") {
          if (dmg > 0) {
            if (actorIsPlayer) {
              enemyHP = Math.max(0, enemyHP - dmg);
              pushLog(
                "dot",
                `${who} deals damage over time to ${tgt} for ${dmg}.`
              );
            } else {
              playerHP = Math.max(0, playerHP - dmg);
              pushLog(
                "dot",
                `${who} deals damage over time to ${tgt} for ${dmg}.`
              );
            }
            setHpMe(playerHP);
            setHpOpp(enemyHP);
          } else pushLog("dot", `${who} applies a damage-over-time effect.`);
          return;
        }

        if (ev.type === "impact_crit") {
          if (dmg > 0) {
            if (actorIsPlayer) enemyHP = Math.max(0, enemyHP - dmg);
            else playerHP = Math.max(0, playerHP - dmg);
            setHpMe(playerHP);
            setHpOpp(enemyHP);
          }
          if (actorIsPlayer) setHitShakeRight((k) => k + 1);
          else setHitShakeLeft((k) => k + 1);
          setShakeKey((k) => k + 1);
          pushLog("crit", `${who} lands a CRITICAL! on ${tgt} for ${dmg}!`);
          return;
        }

        if (ev.type === "impact_block") {
          if (dmg > 0) {
            if (actorIsPlayer) enemyHP = Math.max(0, enemyHP - dmg);
            else playerHP = Math.max(0, playerHP - dmg);
            setHpMe(playerHP);
            setHpOpp(enemyHP);
          }
          if (actorIsPlayer) {
            setBlockFlashRight((x) => x + 1);
            setBlockBumpRight((x) => x + 1);
          } else {
            setBlockFlashLeft((x) => x + 1);
            setBlockBumpLeft((x) => x + 1);
          }
          pushLog(
            "block",
            `BLOCKED! ${tgt} stops ${who}'s strike (only ${dmg} through).`
          );
          return;
        }

        if (ev.type === "impact_miss") {
          pushLog("miss", `MISSED! ${who} fails to connect.`);
          return;
        }

        if (ev.type === "impact_hit") {
          if (dmg > 0) {
            if (actorIsPlayer) enemyHP = Math.max(0, enemyHP - dmg);
            else playerHP = Math.max(0, playerHP - dmg);
            setHpMe(playerHP);
            setHpOpp(enemyHP);
          }
          pushLog("hit", `${who} hits ${tgt} for ${dmg}.`);
          return;
        }
      }, ev.startMs);
      timers.current.push(t);
    });

    return schedule.totalMs;
  }

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
    setHpOpp(asInt(selectedOpp.maxHP));
    setPulseLeftPassive(0);
    setPulseLeftUlt(0);
    setPulseRightPassive(0);
    setPulseRightUlt(0);
    setHpGlowLeft(0);
    setHpGlowRight(0);
    setBlockFlashLeft(0);
    setBlockFlashRight(0);
    setUltFlashLeft(0);
    setUltFlashRight(0);
    setUltShakeLeft(0);
    setUltShakeRight(0);
    setHitShakeLeft(0);
    setHitShakeRight(0);
    setBlockBumpLeft(0);
    setBlockBumpRight(0);
    setMyPassiveText("—");
    setMyUltText("—");
    setOppPassiveText("—");
    setOppUltText("—");
    setMyDmgRange(null);
    setOppDmgRange(null);

    idemKeyRef.current = `${selectedOpp.id}:${Date.now()}:${Math.random()
      .toString(36)
      .slice(2)}`;

    try {
      const crt = await client.post(
        "/arena/challenges",
        { opponentId: selectedOpp.id },
        { headers: { "X-Idempotency-Key": idemKeyRef.current! } }
      );

      try {
        const s0 = await client.get("/stamina");
        const snap0 = extractStamina(s0.data);
        setStamina(snap0.current, snap0.max);
      } catch {}

      const matchId: string | undefined = crt?.data?.matchId;
      currentMatchIdRef.current = matchId ?? null;

      const ca = crt?.data?.attacker;
      const cd = crt?.data?.defender;

      if (ca?.combatStats)
        setMyDmgRange({
          min: asInt(ca.combatStats.minDamage ?? ca.combatStats.damageMin ?? 0),
          max: asInt(ca.combatStats.maxDamage ?? ca.combatStats.damageMax ?? 0),
        });
      if (cd?.combatStats)
        setOppDmgRange({
          min: asInt(cd.combatStats.minDamage ?? cd.combatStats.damageMin ?? 0),
          max: asInt(cd.combatStats.maxDamage ?? cd.combatStats.damageMax ?? 0),
        });
      setMyPassiveText(skillText(ca?.passiveDefaultSkill) ?? "—");
      setMyUltText(skillText(ca?.ultimateSkill) ?? "—");
      setOppPassiveText(skillText(cd?.passiveDefaultSkill) ?? "—");
      setOppUltText(skillText(cd?.ultimateSkill) ?? "—");

      if (!matchId) {
        setCenterLabel("DRAW");
        setDuelResult({
          outcome: "draw",
          summary: "Match could not be created (invalid id).",
        });
        try {
          const s = await client.get("/stamina");
          const snap = extractStamina(s.data);
          setStamina(snap.current, snap.max);
        } catch {}
        setIsFighting(false);
        return;
      }

      if (resolveLockRef.current) return;
      resolveLockRef.current = true;

      let pvp: any;
      try {
        pvp = await client.post("/combat/resolve", { matchId });
      } catch {
        try {
          pvp = await client.post("/combat/simulate", { matchId });
        } catch {
          const prev = await client.get("/combat/simulate", {
            params: { matchId },
          });
          pvp = {
            data: {
              outcome: prev.data?.outcome ?? "draw",
              timeline: prev.data?.timeline ?? prev.data?.snapshots ?? [],
              rewards: null,
              __preview: true,
              attacker: prev.data?.attacker,
              defender: prev.data?.defender,
            },
          };
        }
      }

      const a = pvp.data?.attacker;
      const d = pvp.data?.defender;
      if (a?.combatStats)
        setMyDmgRange({
          min: asInt(a.combatStats.minDamage ?? a.combatStats.damageMin ?? 0),
          max: asInt(a.combatStats.maxDamage ?? a.combatStats.damageMax ?? 0),
        });
      if (d?.combatStats)
        setOppDmgRange({
          min: asInt(d.combatStats.minDamage ?? d.combatStats.damageMin ?? 0),
          max: asInt(d.combatStats.maxDamage ?? d.combatStats.damageMax ?? 0),
        });
      if (a?.passiveDefaultSkill || a?.ultimateSkill) {
        setMyPassiveText(skillText(a?.passiveDefaultSkill) ?? "—");
        setMyUltText(skillText(a?.ultimateSkill) ?? "—");
      }
      if (d?.passiveDefaultSkill || d?.ultimateSkill) {
        setOppPassiveText(skillText(d?.passiveDefaultSkill) ?? "—");
        setOppUltText(skillText(d?.ultimateSkill) ?? "—");
      }

      const outcome = (pvp.data?.outcome as "win" | "lose" | "draw") ?? "draw";
      const rawTimeline: TimelineBE[] =
        (pvp.data?.timeline as TimelineBE[]) ??
        (pvp.data?.snapshots as TimelineBE[]) ??
        [];

      const total = playScheduled(rawTimeline) ?? 0;
      await new Promise((r) => setTimeout(r, total + 140));

      setCenterLabel(
        outcome === "win" ? "WIN" : outcome === "lose" ? "LOSE" : "DRAW"
      );
      setDuelResult({
        outcome,
        summary:
          outcome === "win"
            ? "You have won."
            : outcome === "lose"
              ? "You were defeated."
              : "Draw.",
      });

      const rw: Reward = pvp.data?.rewards
        ? {
            gold:
              pvp.data.rewards.goldGained ??
              pvp.data.rewards.gold ??
              pvp.data.rewards.coins ??
              0,
            xp:
              pvp.data.rewards.xpGained ??
              pvp.data.rewards.xp ??
              pvp.data.rewards.experience ??
              0,
            honor:
              pvp.data.rewards.honorDelta ??
              pvp.data.rewards.honor ??
              undefined,
            items: Array.isArray(pvp.data.rewards.items)
              ? pvp.data.rewards.items.map((it: any) => ({
                  name: String(it.name ?? it.itemName ?? "Item"),
                  qty: asInt(it.qty ?? it.quantity ?? 1),
                }))
              : [],
          }
        : null;
      setRewards(rw);

      try {
        const s = await client.get("/stamina");
        const snap = extractStamina(s.data);
        setStamina(snap.current, snap.max);
      } catch {}
      try {
        const meRes = await client.get<CharacterApi>("/character/me");
        setMe(meRes.data);
      } catch {}
    } catch (e: any) {
      console.error(e);
      setCenterLabel("DRAW");
      setDuelResult({
        outcome: "draw",
        summary: "Could not resolve combat (visual fallback).",
      });
      try {
        const s = await client.get("/stamina");
        const snap = extractStamina(s.data);
        setStamina(snap.current, snap.max);
      } catch {}
    } finally {
      setIsFighting(false);
      attackLockRef.current = false;
      resolveLockRef.current = false;
    }
  }

  const NAV_ITEMS = [
    { label: "Terms of Use", href: "/legal/terms" },
    { label: "Privacy", href: "/legal/privacy" },
    { label: "Legal notice", href: "/legal/notice" },
    { label: "Forum", href: "/forum" },
    { label: "Support", href: "/support" },
  ];

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    logout();
    navigate("/login", { replace: true });
  };
  const canAttack = (staminaCurrent ?? 0) >= PVP_STAMINA_COST;

  return (
    <div className="min-h-screen text-sm leading-tight bg-[var(--bg)] text-[13px]">
      <style>{`@keyframes shake{0%,100%{transform:translateY(0)}25%{transform:translateY(-2px)}50%{transform:translateY(1px)}75%{transform:translateY(-1px)}} .shake-once{animation:shake 260ms ease-out 1}`}</style>

      {/* Navbar */}
      <div className="mx-auto max-w-[1440px] xl:px-6 lg:px-5 md:px-4 px-3">
        <header className="relative z-10 dark-panel mt-3 mb-3 p-3 md:p-4 flex justify-between items-center rounded-lg border border-[var(--border)]">
          <div className="flex items-center space-x-6">
            <h1 className="text-2xl md:text-3xl font-bold stat-text tracking-wide font-serif">
              Nocthalis
            </h1>
          </div>
          <nav className="hidden md:flex items-center space-x-5 text-xs">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.label}
                target="_blank"
                rel="noreferrer"
                href={item.href}
                className="stat-text-muted hover:text-gray-300"
              >
                {item.label}
              </a>
            ))}
            <button
              type="button"
              onClick={handleLogout}
              className="stat-text-muted hover:text-gray-300 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-weak)] rounded-sm"
              title="Log out"
            >
              Logout
            </button>
          </nav>
        </header>
      </div>

      {/* Grid */}
      <div className="mx-auto max-w-[1440px] xl:px-6 lg:px-5 md:px-4 px-3 pb-24">
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-3 xl:gap-4 pb-4">
          {/* Sidebar */}
          <aside className="lg:col-span-2 dark-panel p-2 space-y-1 rounded-lg shadow-lg border border-[var(--border)]">
            {[
              {
                id: "character",
                label: "CHARACTER",
                icon: User,
                href: "/game",
              },
              { id: "arena", label: "ARENA", icon: Swords, href: "/arena" },
              {
                id: "options",
                label: "OPTIONS",
                icon: Settings,
                href: "/options",
                disabled: true,
              },
            ].map((item: any) => {
              const Icon = item.icon;
              const active =
                (item.id === "character" &&
                  location.pathname.startsWith("/game")) ||
                (item.id === "arena" &&
                  location.pathname.startsWith("/arena")) ||
                (item.id === "options" &&
                  location.pathname.startsWith("/options"));
              const cls = `w-full gothic-button flex items-center space-x-3 text-left ${active ? "active" : ""}`;
              if (item.disabled) {
                return (
                  <div
                    key={item.id}
                    aria-disabled
                    className={`${cls} opacity-50 cursor-not-allowed`}
                    title="Coming soon"
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-medium">{item.label}</span>
                  </div>
                );
              }
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.href)}
                  className={cls}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{item.label}</span>
                </button>
              );
            })}
          </aside>

          {/* Main */}
          <main className="lg:col-span-10 space-y-4">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-2)] p-3 md:p-4 space-y-4 shadow-lg overflow-visible">
              <div className="flex items-center gap-3">
                <Flame className="w-5 h-5 text-[var(--accent)]" />
                <h2 className="text-white font-semibold text-lg">Arena</h2>
                <button
                  onClick={refillStamina}
                  className="ml-auto inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border)] hover:border-[var(--accent-weak)] text-[12px] text-zinc-200"
                  title="Set stamina to max (admin) y refrescar"
                >
                  <RotateCcw className="w-4 h-4" /> Refill
                </button>
              </div>

              {loading && (
                <div className="card-muted p-3 text-xs stat-text-muted">
                  Loading…
                </div>
              )}
              {err && !loading && (
                <div className="card-muted p-3 text-xs text-red-400">{err}</div>
              )}

              {/* LIST */}
              {!loading && view === "select" && (
                <SelectView
                  opponents={opponents}
                  selectedId={selectedId}
                  setSelectedId={(id) => setSelectedId(id)}
                  q={q}
                  setQ={setQ}
                  canAttack={canAttack}
                  isFighting={isFighting}
                  onAttack={startChallenge}
                  staminaCost={PVP_STAMINA_COST}
                />
              )}

              {/* DUEL */}
              {!loading && view === "duel" && selectedOpp && me && (
                <DuelView
                  me={me}
                  myName={myName}
                  myLevel={myLevel}
                  myMaxHP={myMaxHP}
                  selectedOpp={selectedOpp}
                  // hp
                  hpMe={hpMe}
                  hpOpp={hpOpp}
                  // labels
                  centerLabel={centerLabel}
                  shakeKey={shakeKey}
                  onBack={() => {
                    clearTimers();
                    setView("select");
                    setCenterLabel("VS");
                    setCombatLog([]);
                    setRewards(null);
                  }}
                  // skills text
                  myPassiveText={myPassiveText}
                  myUltText={myUltText}
                  oppPassiveText={oppPassiveText}
                  oppUltText={oppUltText}
                  // dmg ranges
                  myDmgRange={myDmgRange}
                  oppDmgRange={oppDmgRange}
                  // fx keys
                  pulseLeftPassive={pulseLeftPassive}
                  pulseLeftUlt={pulseLeftUlt}
                  pulseRightPassive={pulseRightPassive}
                  pulseRightUlt={pulseRightUlt}
                  hpGlowLeft={hpGlowLeft}
                  hpGlowRight={hpGlowRight}
                  blockFlashLeft={blockFlashLeft}
                  blockFlashRight={blockFlashRight}
                  ultFlashLeft={ultFlashLeft}
                  ultFlashRight={ultFlashRight}
                  ultShakeLeft={ultShakeLeft}
                  ultShakeRight={ultShakeRight}
                  hitShakeLeft={hitShakeLeft}
                  hitShakeRight={hitShakeRight}
                  blockBumpLeft={blockBumpLeft}
                  blockBumpRight={blockBumpRight}
                  // results
                  duelResult={duelResult}
                  rewards={rewards}
                  // log
                  combatLog={combatLog}
                />
              )}
            </div>
          </main>
        </div>
      </div>
      <BigStaminaBar current={staminaCurrent ?? 0} max={staminaMax ?? 10} />
    </div>
  );
}
