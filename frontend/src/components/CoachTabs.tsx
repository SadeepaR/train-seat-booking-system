import React from 'react';
import { Coach, CoachClass } from '../types';
import { ShieldCheck, Armchair, Sparkles } from 'lucide-react';

interface CoachTabsProps {
  coaches: Coach[];
  activeCoachId: string;
  onSelectCoach: (coachId: string) => void;
}

export const CoachTabs: React.FC<CoachTabsProps> = ({ coaches, activeCoachId, onSelectCoach }) => {
  const getClassBadgeStyle = (classType: CoachClass) => {
    switch (classType) {
      case CoachClass.FIRST:
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case CoachClass.SECOND:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case CoachClass.THIRD:
        return 'bg-teal-500/20 text-teal-300 border-teal-500/30';
      default:
        return 'bg-slate-700 text-slate-300';
    }
  };

  return (
    <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
      {coaches.map((coach) => {
        const isActive = coach.id === activeCoachId;
        return (
          <button
            key={coach.id}
            onClick={() => onSelectCoach(coach.id)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border font-medium text-sm transition-all duration-200 shrink-0 ${
              isActive
                ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/50'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            <div
              className={`p-2 rounded-lg ${
                isActive ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              <Armchair className="w-4 h-4" />
            </div>

            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-100">{coach.name}</span>
                {coach.classType === CoachClass.FIRST && (
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                )}
              </div>
              <span
                className={`inline-block mt-0.5 text-[10px] font-semibold px-2 py-0.5 rounded border ${getClassBadgeStyle(
                  coach.classType
                )}`}
              >
                {coach.classType} CLASS
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
};
