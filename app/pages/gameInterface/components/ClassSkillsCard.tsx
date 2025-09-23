import { Flame, Shield } from "lucide-react";

export default function ClassSkillsCard({ data }: { data: any }) {
  return (
    <div className="dark-panel p-3 md:p-4 overflow-visible">
      <h3 className="stat-text font-semibold mb-3 flex items-center text-base">
        <Flame className="w-4 h-4 mr-2 text-accent" /> Class Skills
      </h3>

      {/* Passive */}
      {((data as any)?.passiveDefaultSkill ??
      (data as any)?.class?.passiveDefaultSkill) ? (
        <div className="mb-3 rounded-lg border border-[var(--border)] bg-[var(--panel-2)] p-2.5">
          <div className="flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-gray-300 mt-0.5" />
            <div className="min-w-0">
              <div className="text-white font-semibold">
                Passive:{" "}
                {
                  (
                    (data as any)?.passiveDefaultSkill ??
                    (data as any)?.class?.passiveDefaultSkill
                  ).name
                }
              </div>
              <div className="text-[11px] text-gray-300 mt-0.5 whitespace-pre-wrap">
                {(
                  (data as any)?.passiveDefaultSkill?.shortDescEn ??
                  (data as any)?.passiveDefaultSkill?.longDescEn ??
                  (data as any)?.class?.passiveDefaultSkill?.shortDescEn ??
                  (data as any)?.class?.passiveDefaultSkill?.longDescEn ??
                  "—"
                ).toString()}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-3 text-[11px] text-gray-400">No passive.</div>
      )}

      {/* Ultimate */}
      {((data as any)?.ultimateSkill ?? (data as any)?.class?.ultimateSkill) ? (
        <div className="rounded-lg border border-[var(--accent-weak)] bg-[var(--panel-2)] p-3">
          <div className="flex items-start gap-2.5">
            <Flame className="w-4 h-4 text-orange-400 mt-0.5" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-white font-semibold">
                  Ultimate:{" "}
                  {
                    (
                      (data as any)?.ultimateSkill ??
                      (data as any)?.class?.ultimateSkill
                    ).name
                  }
                </span>
                <span className="badge-level px-1.5 py-0.5 rounded text-[10px]">
                  Ready
                </span>
              </div>
              <div className="text-[11px] text-gray-300 mt-0.5 whitespace-pre-wrap">
                {(
                  (data as any)?.ultimateSkill?.description ??
                  (data as any)?.class?.ultimateSkill?.description ??
                  "—"
                )
                  .toString()
                  .slice(0, 600)}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-[11px] text-gray-400">No ultimate.</div>
      )}
    </div>
  );
}
