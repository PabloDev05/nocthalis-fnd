// app/pages/arena/index.tsx
import { Flame, RotateCcw } from "lucide-react";
import Navbar from "../gameInterface/components/Navbar";
import Sidebar from "../gameInterface/components/Sidebar";
import { BigStaminaBar } from "./components/LadderAndStamina";
import { SelectView } from "./views/SelectView";
import { DuelView } from "./views/DuelView";
import { useAuth } from "../../context/AuthContext";
import { useArena } from "./hooks/useArena";

export default function Arena() {
  const { staminaCurrent, staminaMax } = useAuth();
  const { loading, err, view, refillStamina, selectProps, duelProps } =
    useArena();

  return (
    <div className="min-h-screen text-sm leading-tight bg-[var(--bg)] text-[13px]">
      {/* Navbar común */}
      <div className="mx-auto max-w-[1440px] xl:px-6 lg:px-5 md:px-4 px-3">
        <Navbar />
      </div>

      {/* Grid */}
      <div className="mx-auto max-w-[1440px] xl:px-6 lg:px-5 md:px-4 px-3 pb-24">
        <div
          className="
            relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-3 xl:gap-4 pb-4
            items-stretch min-h-[calc(100dvh-6rem)]
          "
        >
          {/* Sidebar común (ya incluye VersionBadge abajo) */}
          <Sidebar />

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
              {!loading && view === "select" && selectProps && (
                <SelectView {...selectProps} />
              )}

              {/* DUEL */}
              {!loading && view === "duel" && duelProps && (
                <DuelView {...duelProps} />
              )}
            </div>
          </main>
        </div>
      </div>

      <BigStaminaBar current={staminaCurrent ?? 0} max={staminaMax ?? 10} />
    </div>
  );
}
