import React from 'react';
import { Station, Train } from '../types';
import { MapPin, Navigation, TrainTrack, Search, ArrowRight } from 'lucide-react';

interface StationSelectorProps {
  stations: Station[];
  trains: Train[];
  selectedTrainId: string;
  selectedOriginId: string;
  selectedDestinationId: string;
  onTrainChange: (trainId: string) => void;
  onOriginChange: (stationId: string) => void;
  onDestinationChange: (stationId: string) => void;
  onSearch: () => void;
  isLoading: boolean;
}

export const StationSelector: React.FC<StationSelectorProps> = ({
  stations,
  trains,
  selectedTrainId,
  selectedOriginId,
  selectedDestinationId,
  onTrainChange,
  onOriginChange,
  onDestinationChange,
  onSearch,
  isLoading,
}) => {
  const originStation = stations.find((s) => s._id === selectedOriginId);
  
  // Filter destinations to only stations AFTER the selected origin in route order
  const validDestinations = originStation
    ? stations.filter((s) => s.sequence > originStation.sequence)
    : stations;

  const currentTrain = trains.find((t) => t._id === selectedTrainId);

  return (
    <div className="glass-panel rounded-2xl p-6 shadow-2xl border border-slate-800">
      <div className="flex items-center gap-2 mb-4 text-blue-400 text-sm font-semibold tracking-wide uppercase">
        <TrainTrack className="w-4 h-4" />
        <span>Journey Search & Segment Selector</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
        {/* Train Select */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
            <TrainTrack className="w-3.5 h-3.5 text-teal-400" />
            Select Express Train
          </label>
          <select
            value={selectedTrainId}
            onChange={(e) => onTrainChange(e.target.value)}
            className="w-full glass-input rounded-xl px-3.5 py-2.5 text-sm bg-slate-900/90 text-white font-medium focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            {trains.map((t) => (
              <option key={t._id} value={t._id} className="bg-slate-900 text-white">
                {t.trainNumber} - {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Origin Station */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            Boarding Station (Origin)
          </label>
          <select
            value={selectedOriginId}
            onChange={(e) => {
              onOriginChange(e.target.value);
              // Reset destination if invalid
              const newOrig = stations.find((s) => s._id === e.target.value);
              const dest = stations.find((s) => s._id === selectedDestinationId);
              if (newOrig && dest && dest.sequence <= newOrig.sequence) {
                const firstValid = stations.find((s) => s.sequence > newOrig.sequence);
                if (firstValid) onDestinationChange(firstValid._id);
              }
            }}
            className="w-full glass-input rounded-xl px-3.5 py-2.5 text-sm bg-slate-900/90 text-white font-medium focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            {stations.map((s) => (
              <option key={s._id} value={s._id} className="bg-slate-900 text-white">
                [Stop {s.sequence}] {s.name} ({s.code})
              </option>
            ))}
          </select>
        </div>

        {/* Destination Station */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Navigation className="w-3.5 h-3.5 text-rose-400" />
            Alighting Station (Destination)
          </label>
          <select
            value={selectedDestinationId}
            onChange={(e) => onDestinationChange(e.target.value)}
            className="w-full glass-input rounded-xl px-3.5 py-2.5 text-sm bg-slate-900/90 text-white font-medium focus:ring-2 focus:ring-rose-500 cursor-pointer"
          >
            {validDestinations.map((s) => (
              <option key={s._id} value={s._id} className="bg-slate-900 text-white">
                [Stop {s.sequence}] {s.name} ({s.code})
              </option>
            ))}
          </select>
        </div>

        {/* Search Button */}
        <div>
          <button
            onClick={onSearch}
            disabled={isLoading || !selectedOriginId || !selectedDestinationId}
            className="w-full h-[42px] rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all transform active:scale-95 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Search Available Seats</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Visual Journey Route Pills */}
      {originStation && (
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-emerald-400">{originStation.name}</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-semibold text-rose-400">
              {stations.find((s) => s._id === selectedDestinationId)?.name || 'Destination'}
            </span>
          </div>
          <div className="text-slate-400 text-xs">
            Segment Span:{' '}
            <span className="text-blue-400 font-bold">
              {(stations.find((s) => s._id === selectedDestinationId)?.sequence || 0) - originStation.sequence} Stations
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
