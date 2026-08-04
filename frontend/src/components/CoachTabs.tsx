import React from 'react';
import { Coach, CoachClass } from '../types';

interface CoachTabsProps {
  coaches: Coach[];
  activeCoachId: string;
  onSelectCoach: (coachId: string) => void;
}

const classLabel = (ct: CoachClass) => {
  switch (ct) {
    case CoachClass.FIRST: return '1st Class';
    case CoachClass.SECOND: return '2nd Class';
    case CoachClass.THIRD: return '3rd Class';
    default: return ct;
  }
};

export const CoachTabs: React.FC<CoachTabsProps> = ({ coaches, activeCoachId, onSelectCoach }) => {
  return (
    <div className="flex items-center gap-2">
      {coaches.map((coach, index) => {
        const isActive = coach.id === activeCoachId;
        return (
          <button
            key={coach.id}
            onClick={() => onSelectCoach(coach.id)}
            className={`px-4 py-2 rounded-xl border text-xs font-semibold transition-all duration-200 shrink-0 ${
              isActive
                ? 'bg-indigo-500/25 border-indigo-400 text-indigo-200'
                : 'bg-[#313445] border-[#3f4359] text-[#a0a7ba] hover:border-[#4a4e68] hover:text-[#f0f2f7]'
            }`}
          >
            Coach {index + 1} - {classLabel(coach.classType)}
            <span className="text-[10px] font-normal text-[#a0a7ba] ml-1.5 opacity-80">
              {coach.totalSeats} seats
            </span>
          </button>
        );
      })}
    </div>
  );
};
