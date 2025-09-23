import { LadderList } from "../components/LadderAndStamina";

type Props = {
  opponents: any[];
  selectedId: string | null;
  setSelectedId: (id: string) => void;
  q: string;
  setQ: (s: string) => void;
  canAttack: boolean;
  isFighting: boolean;
  onAttack: () => void;
  staminaCost: number;
};

export function SelectView({
  opponents,
  selectedId,
  setSelectedId,
  q,
  setQ,
  canAttack,
  isFighting,
  onAttack,
  staminaCost,
}: Props) {
  const disabled = !selectedId || !canAttack || isFighting;

  return (
    <div className="space-y-3">
      <LadderList
        opponents={opponents}
        selectedId={selectedId}
        setSelectedId={setSelectedId}
        q={q}
        setQ={setQ}
      />

      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={onAttack}
          disabled={disabled}
          className="px-6 py-2 rounded-xl bg-[var(--accent)]/80 hover:bg-[var(--accent)] disabled:opacity-50 text-white font-semibold shadow-[0_0_10px_rgba(120,120,255,.25)]"
          title={!canAttack ? `You need ${staminaCost} stamina` : `Start fight`}
        >
          {isFighting ? "Preparing..." : "Attack"}
        </button>
        {!canAttack && (
          <div className="text-[11px] text-zinc-400">
            You need {staminaCost} stamina to attack.
          </div>
        )}
      </div>
    </div>
  );
}
