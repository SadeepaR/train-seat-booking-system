import React from 'react';
import { Coach, SeatAvailability } from '../types';
import { AlertTriangle } from 'lucide-react';

interface SeatMapProps {
  coach: Coach;
  seats: SeatAvailability[];
  selectedSeatId: string | null;
  onSelectSeat: (seat: SeatAvailability) => void;
}

export const SeatMap: React.FC<SeatMapProps> = ({
  coach,
  seats,
  selectedSeatId,
  onSelectSeat,
}) => {
  const coachSeats = seats.filter((s) => s.coachId === coach.id);
  const rowsMap = new Map<number, SeatAvailability[]>();
  
  for (let r = 1; r <= coach.layoutRows; r++) {
    rowsMap.set(r, []);
  }

  for (const s of coachSeats) {
    const rowList = rowsMap.get(s.row) || [];
    rowList.push(s);
    rowsMap.set(s.row, rowList);
  }

  return (
    <div className="glass-panel rounded-2xl p-5">
      <div className="max-w-md mx-auto space-y-2">
        {Array.from(rowsMap.entries()).map(([rowNum, rowSeats]) => {
          const sortedRowSeats = [...rowSeats].sort((a, b) => a.column - b.column);
          const leftSeats = sortedRowSeats.filter((s) => s.column <= 2);
          const rightSeats = sortedRowSeats.filter((s) => s.column > 2);

          return (
            <div key={rowNum} className="flex items-center justify-center gap-6">
              <div className="flex items-center gap-1.5">
                {leftSeats.map((seat) => (
                  <SeatButton
                    key={seat.seatId}
                    seat={seat}
                    isSelected={seat.seatId === selectedSeatId}
                    onSelectSeat={onSelectSeat}
                  />
                ))}
              </div>
              <div className="w-4" />
              <div className="flex items-center gap-1.5">
                {rightSeats.map((seat) => (
                  <SeatButton
                    key={seat.seatId}
                    seat={seat}
                    isSelected={seat.seatId === selectedSeatId}
                    onSelectSeat={onSelectSeat}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface SeatButtonProps {
  seat: SeatAvailability;
  isSelected: boolean;
  onSelectSeat: (seat: SeatAvailability) => void;
}

const SeatButton: React.FC<SeatButtonProps> = ({ seat, isSelected, onSelectSeat }) => {
  const { isAvailable, seatNumber, conflictingSegments } = seat;

  let buttonStyles = '';

  if (isSelected) {
    buttonStyles =
      'bg-indigo-500 border-indigo-400 text-white shadow-md shadow-indigo-500/30 ring-2 ring-indigo-400/50 scale-105';
  } else if (!isAvailable) {
    buttonStyles =
      'bg-rose-900/30 border-rose-800/50 text-rose-400 opacity-70 cursor-not-allowed';
  } else {
    buttonStyles =
      'bg-emerald-900/30 border-emerald-700/40 text-emerald-400 hover:bg-emerald-800/40 hover:border-emerald-600/50 cursor-pointer active:scale-95';
  }

  const conflictInfo =
    conflictingSegments && conflictingSegments.length > 0
      ? `Booked: ${conflictingSegments.map((c) => `${c.fromStationName} → ${c.toStationName}`).join(', ')}`
      : 'Available';

  return (
    <div className="relative group">
      <button
        onClick={() => isAvailable && onSelectSeat(seat)}
        disabled={!isAvailable}
        title={`${seatNumber} - ${conflictInfo}`}
        className={`w-11 h-11 rounded-lg border flex items-center justify-center transition-all duration-150 ${buttonStyles}`}
      >
        <span className="text-xs font-bold">{seatNumber}</span>
      </button>

      <div className="absolute z-20 bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-44 p-2 rounded-lg bg-[#16171f] border border-[#2a2c3a] shadow-lg text-[11px] text-[#c9d1d9] pointer-events-none">
        <div className="font-bold mb-0.5">Seat {seatNumber}</div>
        {isAvailable ? (
          <span className="text-emerald-400 font-medium">✓ Available</span>
        ) : (
          <div className="text-rose-300 text-[10px]">
            <div className="font-semibold text-rose-400 mb-0.5 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Overlap Conflict
            </div>
            {conflictingSegments.map((c, idx) => (
              <div key={idx}>• {c.fromStationName} → {c.toStationName}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
