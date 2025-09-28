import { useAuth } from "../../context/AuthContext";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import ProfileCard from "./components/ProfileCard";
import ClassSkillsCard from "./components/ClassSkillsCard";
import CombatMetrics from "./components/CombatMetrics";
import ResistancesCard from "./components/ResistancesCard";
import EquipmentAndInventory from "./components/EquipmentAndInventory";
import AttributesPanel from "./components/AttributesPanel";
import StaminaBar from "./components/StaminaBar";
import FeedbackForm from "./components/FeedbackForm"; // ⬅️ NUEVO
import { useCharacter } from "./hooks/useCharacter";
import { asInt } from "./lib/statUtils";
import {
  resolvePrimaryCombatKey,
  primaryBaseStatForClass,
} from "../../lib/primary";

export default function GameInterface() {
  const { staminaCurrent, staminaMax, user: userFromCtx } = useAuth();
  const {
    data,
    progression,
    loading,
    error,
    setError,
    allocating,
    allocateOne,
  } = useCharacter();

  const lvl = progression?.level ?? (data as any)?.level ?? "—";
  const pct100 = Math.max(0, Math.min(100, asInt(progression?.xpPercent ?? 0)));
  const xpSince = asInt(progression?.xpSinceLevel);
  const xpForLevel = Math.max(1, asInt(progression?.xpForThisLevel));
  const className =
    (data as any)?.class?.name ?? (data as any)?.className ?? "—";
  const ctxName =
    typeof userFromCtx === "string"
      ? userFromCtx
      : ((userFromCtx as any)?.username ?? null);
  const displayName =
    (data as any)?.username ?? ctxName ?? (data as any)?.name ?? "—";

  const availablePoints = asInt(
    (progression as any)?.availablePoints ?? (data as any)?.availablePoints
  );
  const reachedThreshold = xpSince >= xpForLevel;
  const canAllocateStrict =
    (progression?.canAllocateNow ?? false) ||
    availablePoints > 0 ||
    reachedThreshold;

  const primaryKey = resolvePrimaryCombatKey(
    (data as any)?.primaryPowerKey,
    className
  );
  const primaryBase = primaryBaseStatForClass(className);

  return (
    <div className="min-h-screen text-sm leading-tight bg-[var(--bg)] text-[13px]">
      <style>{`
        @keyframes statGlowPop { 0%{text-shadow:none;transform:translateZ(0)}25%{text-shadow:0 0 10px rgba(120,120,255,.9),0 0 20px rgba(120,120,255,.5)}100%{text-shadow:none} }
        .stat-glow { animation: statGlowPop 900ms ease-out; }
      `}</style>

      <div className="mx-auto max-w-[1440px] xl:px-6 lg:px-5 md:px-4 px-3">
        <Navbar />
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-3 xl:gap-4 pb-24">
          <Sidebar />

          {/* left */}
          <main className="lg:col-span-5 xl:col-span-6 space-y-4">
            {/* Panel superior (profile + skills + metrics) */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-2)] p-3 md:p-4 space-y-4 shadow-lg overflow-visible">
              {loading && (
                <div className="card-muted p-3 text-xs stat-text-muted">
                  Loading character…
                </div>
              )}
              {error && !loading && (
                <div className="card-muted p-3 text-xs text-red-400">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ProfileCard
                  displayName={displayName}
                  lvl={lvl}
                  xpSince={xpSince}
                  xpForLevel={xpForLevel}
                  className={className}
                />
                <ClassSkillsCard data={data} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-fr">
                <ResistancesCard data={data ?? (null as any)} />
                <CombatMetrics data={data ?? (null as any)} />
              </div>
            </div>

            {/* ⬇️ Panel de Feedback: ocupa justo el bloque verde de tu captura */}
            <FeedbackForm
              defaultUsername={displayName} // opcional; el email se prellena desde el JWT
            />
          </main>

          {/* right */}
          <aside className="lg:col-span-5 xl:col-span-4 space-y-4">
            <EquipmentAndInventory
              data={data}
              displayName={displayName}
              pct100={pct100}
              lvl={lvl}
              xpSince={xpSince}
              xpForLevel={xpForLevel}
            />

            {data && (
              <AttributesPanel
                data={data}
                canAllocate={canAllocateStrict}
                availablePoints={availablePoints}
                allocating={allocating}
                allocateOne={allocateOne}
                primaryKey={primaryKey}
                primaryBase={primaryBase}
              />
            )}
          </aside>
        </div>
      </div>

      <StaminaBar current={staminaCurrent ?? 0} max={staminaMax ?? 10} />
    </div>
  );
}
