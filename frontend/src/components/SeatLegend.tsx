import React from 'react';

export const SeatLegend: React.FC = () => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-6 py-3 px-4 glass-card rounded-xl text-xs text-slate-300">
      {/* Available */}
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-md bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center shadow-sm">
          <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
        </div>
        <span className="font-medium text-slate-200">Available</span>
      </div>

      {/* Selected */}
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-md bg-blue-600 border border-blue-400 flex items-center justify-center shadow-md shadow-blue-500/30">
          <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
        </div>
        <span className="font-medium text-slate-200">Selected</span>
      </div>

      {/* Occupied (Overlapping Journey Segment) */}
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-md bg-rose-500/20 border border-rose-500/50 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-rose-500"></div>
        </div>
        <span className="font-medium text-slate-200">Occupied (Overlap Conflict)</span>
      </div>
    </div>
  );
};
