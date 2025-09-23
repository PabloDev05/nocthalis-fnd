import {
  Shield,
  Sword,
  Backpack,
  CircleDot,
  Shirt,
  Hand,
  DockIcon as Boots,
  NetworkIcon as Necklace,
  BellIcon as Belt,
  BellRingIcon as Ring,
  User,
} from "lucide-react";
import EquipmentSlotView from "./EquipmentSlot";

export default function EquipmentAndInventory({
  data,
  displayName,
  pct100,
  lvl,
  xpSince,
  xpForLevel,
}: any) {
  return (
    <div className="dark-panel p-4">
      <div className="flex justify-center mb-6">
        <div className="relative w-full max-w-[360px] md:max-w-[380px]">
          <div className="grid grid-cols-3 gap-6 xl:gap-7 items-center">
            <div className="flex flex-col gap-3 xl:gap-4 items-center justify-center">
              <EquipmentSlotView
                slot="helmet"
                icon={CircleDot}
                itemId={(data as any)?.equipment?.helmet ?? null}
                extraClass="equip-sm"
              />
              <EquipmentSlotView
                slot="chest"
                icon={Shirt}
                itemId={(data as any)?.equipment?.chest ?? null}
                extraClass="equip-sm"
              />
              <EquipmentSlotView
                slot="gloves"
                icon={Hand}
                itemId={(data as any)?.equipment?.gloves ?? null}
                extraClass="equip-sm"
              />
              <EquipmentSlotView
                slot="boots"
                icon={Boots}
                itemId={(data as any)?.equipment?.boots ?? null}
                extraClass="equip-sm"
              />
            </div>

            <div className="flex flex-col items-center justify-center">
              <div className="w-32 md:w-36 text-center text-base text-accent font-bold px-3 py-1 bg-[var(--panel-2)] border border-[var(--border)]">
                {displayName}
              </div>
              <div className="w-32 md:w-36 h-40 md:h-44 bg-[var(--panel-2)] shadow-inner flex items-center justify-center border-x border-[var(--border)]">
                <User className="w-16 h-16 text-gray-300" />
              </div>

              <div className="w-32 md:w-36 h-6 rounded-b-xl border border-[var(--border)] relative overflow-hidden bg-[var(--panel-2)] shadow-[inset_0_1px_0_rgba(255,255,255,.04),inset_0_-1px_0_rgba(0,0,0,.4)]">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-[var(--accent-weak)] via-[var(--accent)] to-[var(--accent)]/90 shadow-[0_0_10px_rgba(120,120,255,.25),inset_0_0_6px_rgba(0,0,0,.5)] transition-[width] duration-700 ease-out"
                  style={{ width: `${pct100}%` }}
                />
                <div className="relative z-10 w-full h-full flex items-center justify-center">
                  <span className="text-white font-bold text-[11px] tracking-wide">
                    Level {lvl} · {xpSince}/{xpForLevel}
                  </span>
                </div>
              </div>

              <div className="flex gap-1.5 md:gap-2 mt-4 justify-center">
                <EquipmentSlotView
                  slot="mainWeapon"
                  icon={Sword}
                  itemId={(data as any)?.equipment?.mainWeapon ?? null}
                  extraClass="equip-sm"
                />
                <EquipmentSlotView
                  slot="offWeapon"
                  icon={Shield}
                  itemId={(data as any)?.equipment?.offWeapon ?? null}
                  extraClass="equip-sm"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 xl:gap-4 items-center justify-center">
              <EquipmentSlotView
                slot="amulet"
                icon={Necklace}
                itemId={(data as any)?.equipment?.amulet ?? null}
                extraClass="equip-sm"
              />
              <EquipmentSlotView
                slot="belt"
                icon={Belt}
                itemId={(data as any)?.equipment?.belt ?? null}
                extraClass="equip-sm"
              />
              <EquipmentSlotView
                slot="ring"
                icon={Ring}
                itemId={(data as any)?.equipment?.ring ?? null}
                extraClass="equip-sm"
              />
              <div className="w-16 h-16" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-1 pt-4 border-t border-[var(--border)]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold flex items-center text-sm">
            <Backpack className="w-4 h-4 mr-2 text-gray-400" />
            Inventory
          </h3>
        </div>
        <div className="slot-grid-5">
          {Array.from({ length: 5 }, (_, i) => (
            <div
              key={i}
              className="equipment-slot slot-fluid flex items-center justify-center hover:border-[var(--accent-weak)] transition-colors cursor-pointer"
            >
              {i === 0 && <Sword className="w-5 h-5 text-gray-400" />}
              {i === 1 && <Shield className="w-5 h-5 text-gray-400" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
