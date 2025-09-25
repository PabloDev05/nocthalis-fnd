import { EquipmentSlot } from "../../../../types/character";

export default function EquipmentSlotView({
  slot,
  icon: Icon,
  itemId,
  extraClass,
}: {
  slot: EquipmentSlot;
  icon: any;
  itemId: string | null;
  extraClass?: string;
}) {
  return (
    <div
      className={`equipment-slot ${extraClass ?? ""} flex items-center justify-center`}
      title={itemId ?? slot}
    >
      <Icon className="w-10 h-10 text-gray-500" />
    </div>
  );
}
