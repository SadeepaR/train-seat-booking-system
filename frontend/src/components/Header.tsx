import React from 'react';
import { Train, RefreshCw, Sparkles, LayoutDashboard, Ticket } from 'lucide-react';

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
    <header className="glass-panel sticky top-0 z-30 border-b border-slate-800/80 px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-teal-400 flex items-center justify-center shadow-lg shadow-blue-500/20 ring-1 ring-white/20">
            <Train className="h-5.5 w-5.5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight">
                Colombo Fort <span className="text-blue-400">➔</span> Badulla
              </h1>
              <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Main Line
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Segment-Based Train Seat Booking System
            </p>
          </div>
        </div>

        {/* View Switcher & Reset Button */}
        <div className="flex items-center gap-3">
          {/* Navigation Mode Tabs */}
          <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => onViewChange('booking')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeView === 'booking'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Ticket className="w-3.5 h-3.5" />
              <span>Passenger View</span>
            </button>

            <button
              onClick={() => onViewChange('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeView === 'admin'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-500/30'
                  : 'text-slate-400 hover:text-slate-200'
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
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700/60 transition-all hover:border-slate-500 active:scale-95 disabled:opacity-50"
            title="Reset database to seed defaults"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isResetting ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isResetting ? 'Resetting...' : 'Reset DB'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
