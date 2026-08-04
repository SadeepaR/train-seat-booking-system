import React from 'react';
import { Train, RefreshCw, LayoutDashboard, Ticket } from 'lucide-react';

interface HeaderProps {
  onResetDatabase: () => void;
  isResetting: boolean;
  activeView: 'booking' | 'admin';
  onViewChange: (view: 'booking' | 'admin') => void;
}

export const Header: React.FC<HeaderProps> = ({
  onResetDatabase,
  isResetting,
  activeView,
  onViewChange,
}) => {
  return (
    <header className="header-bar sticky top-0 z-30 px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Train className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#f0f2f7] tracking-tight">
              Colombo Fort <span className="text-indigo-400">➔</span> Badulla
            </h1>
            <p className="text-[11px] text-[#9fa6b8]">
              Segment-Based Train Seat Booking System
            </p>
          </div>
        </div>

        {/* View Switcher & Reset Button */}
        <div className="flex items-center gap-3">
          {/* Navigation Mode Tabs */}
          <div className="flex items-center bg-[#232532] p-1 rounded-xl border border-[#3f4359]">
            <button
              onClick={() => onViewChange('booking')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeView === 'booking'
                  ? 'bg-[#373a4d] text-indigo-300 shadow-sm border border-[#4a4e68]'
                  : 'text-[#9fa6b8] hover:text-[#f0f2f7]'
              }`}
            >
              <Ticket className="w-3.5 h-3.5" />
              <span>Passenger View</span>
            </button>

            <button
              onClick={() => onViewChange('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeView === 'admin'
                  ? 'bg-[#373a4d] text-indigo-300 shadow-sm border border-[#4a4e68]'
                  : 'text-[#9fa6b8] hover:text-[#f0f2f7]'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Department Admin</span>
            </button>
          </div>

          {/* Seed/Reset DB Button */}
          <button
            onClick={onResetDatabase}
            disabled={isResetting}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#373a4d] hover:bg-[#454961] text-[#e8eaef] text-xs font-medium border border-[#4a4e68] transition-all active:scale-95 disabled:opacity-50"
            title="Reset database to seed defaults"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${isResetting ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isResetting ? 'Resetting...' : 'Reset DB'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
