import React from 'react';
import { Coach, SeatAvailability } from '../types';
import { Armchair, Compass, Info, AlertTriangle } from 'lucide-react';

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
  // Filter seats for the active coach
  const coachSeats = seats.filter((s) => s.coachId === coach.id);

  // Group seats by row
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
    <div className="glass-panel rounded-2xl p-6 relative overflow-hidden border border-slate-800">
      {/* Locomotive Direction Indicator */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800/80">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <Compass className="w-4 h-4 text-blue-400" />
          <span>Engine / Direction of Travel ➔</span>
        </div>
        <div className="text-xs text-slate-400">
          Carriage:{' '}
          <span className="text-white font-semibold">{coach.name}</span> ({coach.totalSeats} Seats)
        </div>
      </div>

      {/* Train Carriage Shell Grid */}
      <div className="max-w-xl mx-auto bg-slate-950/80 rounded-3xl p-6 border-2 border-slate-800 shadow-2xl relative">
        {/* Decorative Windows */}
        <div className="flex justify-between px-2 mb-4">
          <div className="h-1.5 w-16 bg-blue-500/20 rounded-full"></div>
          <div className="h-1.5 w-16 bg-blue-500/20 rounded-full"></div>
          <div className="h-1.5 w-16 bg-blue-500/20 rounded-full"></div>
        </div>

        {/* Seat Rows */}
        <div className="space-y-3">
          {Array.from(rowsMap.entries()).map(([rowNum, rowSeats]) => {
            // Sort seats by column order (1, 2, 3, 4)
            const sortedRowSeats = [...rowSeats].sort((a, b) => a.column - b.column);
            
            // Left side seats (Cols 1, 2)
            const leftSeats = sortedRowSeats.filter((s) => s.column <= 2);
            // Right side seats (Cols 3, 4)
            const rightSeats = sortedRowSeats.filter((s) => s.column > 2);

            return (
              <div key={rowNum} className="flex items-center justify-between gap-4">
                {/* Left Window / Seats */}
                <div className="flex items-center gap-2">
                  {leftSeats.map((seat) => (
                    <SeatButton
                      key={seat.seatId}
                      seat={seat}
                      isSelected={seat.seatId === selectedSeatId}
                      onSelectSeat={onSelectSeat}
                    />
                  ))}
                </div>

                {/* Central Aisle / Row Label */}
                <div className="flex-1 flex justify-center items-center py-1">
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full">
                    ROW {rowNum}
                  </span>
                </div>

                {/* Right Window / Seats */}
                <div className="flex items-center gap-2">
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

        {/* Decorative Rear Windows */}
        <div className="flex justify-between px-2 mt-4">
          <div className="h-1.5 w-16 bg-blue-500/20 rounded-full"></div>
          <div className="h-1.5 w-16 bg-blue-500/20 rounded-full"></div>
          <div className="h-1.5 w-16 bg-blue-500/20 rounded-full"></div>
        </div>
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
  let iconStyles = '';

  if (isSelected) {
    buttonStyles =
      'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/40 ring-2 ring-blue-400 scale-105';
    iconStyles = 'text-white';
  } else if (!isAvailable) {
    buttonStyles =
      'bg-rose-950/40 border-rose-800/60 text-rose-400 opacity-60 cursor-not-allowed';
    iconStyles = 'text-rose-500';
  } else {
    buttonStyles =
      'bg-emerald-950/30 border-emerald-700/50 text-emerald-300 hover:bg-emerald-600/20 hover:border-emerald-400 cursor-pointer active:scale-95';
    iconStyles = 'text-emerald-400';
  }

  const conflictInfo =
    conflictingSegments && conflictingSegments.length > 0
      ? `Booked for: ${conflictingSegments.map((c) => `${c.fromStationName} -> ${c.toStationName}`).join(', ')}`
      : 'Available for booking';

  return (
    <div className="relative group">
      <button
        onClick={() => isAvailable && onSelectSeat(seat)}
        disabled={!isAvailable}
        title={`Seat ${seatNumber} - ${conflictInfo}`}
        className={`w-12 h-12 rounded-xl border flex flex-col items-center justify-center transition-all duration-150 relative ${buttonStyles}`}
      >
        <Armchair className={`w-4 h-4 mb-0.5 ${iconStyles}`} />
        <span className="text-[11px] font-bold tracking-tight">{seatNumber}</span>
      </button>

      {/* Tooltip on hover */}
      <div className="absolute z-20 bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 rounded-lg bg-slate-900 border border-slate-700 shadow-xl text-[11px] text-slate-200 pointer-events-none">
        <div className="font-bold flex items-center gap-1 mb-1">
          <span>Seat {seatNumber}</span>
          {!isAvailable && <AlertTriangle className="w-3 h-3 text-rose-400 inline" />}
        </div>
        {isAvailable ? (
          <span className="text-emerald-400 font-medium">✓ Available for journey</span>
        ) : (
          <div className="text-rose-300 text-[10px]">
            <div className="font-semibold text-rose-400 mb-0.5">Overlap Conflict:</div>
            {conflictingSegments.map((c, idx) => (
              <div key={idx}>
                • {c.fromStationName} ➔ {c.toStationName}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
