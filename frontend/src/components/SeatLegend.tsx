import React from 'react';

export const SeatLegend: React.FC = () => {
  return (
    <div className="flex items-center gap-4 text-[11px] text-[#8b949e] shrink-0">
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/40"></div>
        <span>Available</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded bg-indigo-500 border border-indigo-400"></div>
        <span>Selected</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded bg-rose-500/20 border border-rose-500/40"></div>
        <span>Occupied</span>
      </div>
    </div>
  );
};
