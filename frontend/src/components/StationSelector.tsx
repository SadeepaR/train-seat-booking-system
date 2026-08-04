import React from 'react';
import { Station, Train } from '../types';
import { MapPin, Navigation, Search } from 'lucide-react';

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
  
  const validDestinations = originStation
    ? stations.filter((s) => s.sequence > originStation.sequence)
    : stations;

  return (
    <div className="glass-panel rounded-2xl p-5">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        <div>
          <label className="block text-xs font-semibold text-[#8b949e] mb-1.5">
            Train
          </label>
          <select
            value={selectedTrainId}
            onChange={(e) => onTrainChange(e.target.value)}
            className="w-full glass-input rounded-xl px-3.5 py-2.5 text-sm font-medium cursor-pointer"
          >
            {trains.map((t) => (
              <option key={t._id} value={t._id} className="bg-[#1e1f2b] text-[#e2e4ea]">
                {t.trainNumber}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#8b949e] mb-1.5 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-emerald-400" />
            From
          </label>
          <select
            value={selectedOriginId}
            onChange={(e) => {
              onOriginChange(e.target.value);
              const newOrig = stations.find((s) => s._id === e.target.value);
              const dest = stations.find((s) => s._id === selectedDestinationId);
              if (newOrig && dest && dest.sequence <= newOrig.sequence) {
                const firstValid = stations.find((s) => s.sequence > newOrig.sequence);
                if (firstValid) onDestinationChange(firstValid._id);
              }
            }}
            className="w-full glass-input rounded-xl px-3.5 py-2.5 text-sm font-medium cursor-pointer"
          >
            {stations.map((s) => (
              <option key={s._id} value={s._id} className="bg-[#1e1f2b] text-[#e2e4ea]">
                {s.name} ({s.code})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#8b949e] mb-1.5 flex items-center gap-1">
            <Navigation className="w-3 h-3 text-rose-400" />
            To
          </label>
          <select
            value={selectedDestinationId}
            onChange={(e) => onDestinationChange(e.target.value)}
            className="w-full glass-input rounded-xl px-3.5 py-2.5 text-sm font-medium cursor-pointer"
          >
            {validDestinations.map((s) => (
              <option key={s._id} value={s._id} className="bg-[#1e1f2b] text-[#e2e4ea]">
                {s.name} ({s.code})
              </option>
            ))}
          </select>
        </div>

        <div>
          <button
            onClick={onSearch}
            disabled={isLoading || !selectedOriginId || !selectedDestinationId}
            className="w-full h-[42px] rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all transform active:scale-95 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Search Seats</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
