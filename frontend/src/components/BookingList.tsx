import React, { useState } from 'react';
import { Booking } from '../types';
import { Ticket, ChevronDown, ChevronUp, User, ArrowRight, CheckCircle2 } from 'lucide-react';

interface BookingListProps {
  bookings: Booking[];
}

export const BookingList: React.FC<BookingListProps> = ({ bookings }) => {
  const [isOpen, setIsOpen] = useState(true);

  if (bookings.length === 0) {
    return null;
  }

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left focus:outline-none"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <Ticket className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Active Segment Reservations
              <span className="bg-blue-500/20 text-blue-300 text-xs font-semibold px-2 py-0.5 rounded-full border border-blue-500/30">
                {bookings.length} Bookings
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Live database state showing non-overlapping segment sharing
            </p>
          </div>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        )}
      </button>

      {isOpen && (
        <div className="mt-4 space-y-2.5 max-h-72 overflow-y-auto pr-1">
          {bookings.map((b) => {
            const seatNum = typeof b.seatId === 'object' ? b.seatId.seatNumber : 'Seat';
            return (
              <div
                key={b._id}
                className="glass-card rounded-xl p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs border border-slate-800/80 hover:border-slate-700 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                    {seatNum}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                      <User className="w-3 h-3 text-slate-400" />
                      <span>{b.passengerName}</span>
                      <span className="text-slate-500">({b.passengerEmail})</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>{b.status}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-300 font-medium">
                  <span className="text-emerald-400">{b.originStationName}</span>
                  <ArrowRight className="w-3 h-3 text-slate-500" />
                  <span className="text-rose-400">{b.destinationStationName}</span>
                  <span className="text-slate-500 text-[10px] ml-1">
                    [Seq {b.fromSequence} ➔ {b.toSequence}]
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
