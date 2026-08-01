import React from 'react';
import { Train, RefreshCw, Sparkles } from 'lucide-react';

interface HeaderProps {
  onResetDatabase: () => void;
  isResetting: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onResetDatabase, isResetting }) => {
  return (
    <header className="glass-panel sticky top-0 z-30 border-b border-slate-800/80 px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-teal-400 flex items-center justify-center shadow-lg shadow-blue-500/20 ring-1 ring-white/20">
            <Train className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">
                Colombo Fort <span className="text-blue-400">➔</span> Badulla
              </h1>
              <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Main Line
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Segment-Based Train Seat Booking System
            </p>
          </div>
        </div>

        {/* Database Seed / Reset Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={onResetDatabase}
            disabled={isResetting}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700/60 transition-all hover:border-slate-500 active:scale-95 disabled:opacity-50"
            title="Reset database to seed defaults"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isResetting ? 'animate-spin' : ''}`} />
            {isResetting ? 'Resetting DB...' : 'Reset & Seed Demo Data'}
          </button>
        </div>
      </div>
    </header>
  );
};
