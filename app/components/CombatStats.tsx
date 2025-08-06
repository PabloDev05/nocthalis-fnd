interface CombatStatsProps {
  combat: {
    damage: string;
    attack: number;
    roar: number;
    vitality: number;
    influence: number;
  };
}

const CombatStats = ({ combat }: CombatStatsProps) => {
  return (
    <div className="w-48 bg-gray-900/90 border border-gray-600 rounded-b-lg shadow-lg border-t-0">
      <div className="p-3 space-y-2">
        {Object.entries(combat).map(([label, value]) => (
          <div key={label} className="flex justify-between items-center">
            <span className="text-gray-300 capitalize text-xs font-medium">
              {label}
            </span>
            <span className="text-purple-400 font-bold text-xs">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CombatStats;
