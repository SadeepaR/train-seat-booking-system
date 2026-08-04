import React, { useState } from 'react';
import { SeatAvailability, Station, Train } from '../types';
import { X, User, Mail, Ticket, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

interface BookingModalProps {
  seat: SeatAvailability;
  train: Train;
  originStation: Station;
  destinationStation: Station;
  onClose: () => void;
  onSubmitBooking: (passengerName: string, passengerEmail: string) => Promise<void>;
  isSubmitting: boolean;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  seat,
  train,
  originStation,
  destinationStation,
  onClose,
  onSubmitBooking,
  isSubmitting,
}) => {
  const [passengerName, setPassengerName] = useState('');
  const [passengerEmail, setPassengerEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passengerName.trim() || !passengerEmail.trim()) {
      setErrorMsg('Please provide passenger name and email address.');
      return;
    }
    setErrorMsg(null);
    try {
      await onSubmitBooking(passengerName.trim(), passengerEmail.trim());
    } catch (err: any) {
      // Error handled at parent / toast banner
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#16171f]/80 backdrop-blur-sm animate-fadeIn">
      <div className="glass-panel w-full max-w-lg rounded-2xl p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-[#1e1f2b] hover:bg-[#2a2c3a] text-[#8b949e] hover:text-[#e2e4ea] transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Ticket className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#e2e4ea]">Confirm Seat Reservation</h2>
            <p className="text-xs text-[#8b949e]">
              {originStation.name} ➔ {destinationStation.name}
            </p>
          </div>
        </div>

        {/* Journey & Seat Summary Card */}
        <div className="bg-[#1e1f2b] rounded-xl p-4 border border-[#33354a] mb-5 space-y-2.5">
          <div className="flex items-center justify-between text-xs pb-2.5 border-b border-[#33354a]">
            <span className="text-[#8b949e]">Train:</span>
            <span className="font-semibold text-[#e2e4ea]">{train.trainNumber}</span>
          </div>

          <div className="flex items-center justify-between text-xs pb-2.5 border-b border-[#33354a]">
            <span className="text-[#8b949e]">Route:</span>
            <div className="flex items-center gap-1.5 font-semibold text-[#e2e4ea]">
              <span>{originStation.name}</span>
              <ArrowRight className="w-3 h-3 text-[#8b949e]" />
              <span>{destinationStation.name}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pb-2.5 border-b border-[#33354a]">
            <span className="text-[#8b949e]">Carriage & Seat:</span>
            <div className="flex items-center gap-2">
              <span className="bg-indigo-500/10 text-indigo-400 font-semibold px-2 py-0.5 rounded text-[11px] border border-indigo-500/20">
                {seat.coachName}
              </span>
              <span className="bg-emerald-500/10 text-emerald-400 font-bold px-2.5 py-0.5 rounded text-xs border border-emerald-500/20">
                Seat {seat.seatNumber}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-0.5">
            <span className="text-[#8b949e]">Fare:</span>
            <div className="text-right">
              <div className="text-indigo-400 font-extrabold text-sm">
                LKR {(seat.fareAmount || 0).toLocaleString()}
              </div>
              <div className="text-[10px] text-[#8b949e] font-medium">
                {seat.distanceKm || Math.abs((destinationStation.distanceFromOriginKm || 0) - (originStation.distanceFromOriginKm || 0))} km
              </div>
            </div>
          </div>
        </div>

        {/* Error alert */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Passenger Information Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-[#8b949e] mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-400" />
              Passenger Full Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Sahan Perera"
              value={passengerName}
              onChange={(e) => setPassengerName(e.target.value)}
              className="w-full glass-input rounded-xl px-4 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#8b949e] mb-1.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-indigo-400" />
              Passenger Email Address
            </label>
            <input
              type="email"
              required
              placeholder="e.g. sahan@example.com"
              value={passengerEmail}
              onChange={(e) => setPassengerEmail(e.target.value)}
              className="w-full glass-input rounded-xl px-4 py-2.5 text-sm"
            />
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-3 rounded-xl bg-[#2a2c3e] hover:bg-[#33354a] text-[#c9d1d9] font-semibold text-sm transition-all border border-[#3a3d52]"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-2/3 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all transform active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm & Book Seat</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
