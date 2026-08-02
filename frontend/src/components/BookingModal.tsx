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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel w-full max-w-lg rounded-3xl p-6 relative border border-slate-700/80 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-blue-500/20 border border-blue-500/30 text-blue-400">
            <Ticket className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Confirm Seat Reservation</h2>
            <p className="text-xs text-slate-400">
              Segment Journey: {originStation.name} ➔ {destinationStation.name}
            </p>
          </div>
        </div>

        {/* Journey & Seat Summary Card */}
        <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800 mb-6 space-y-3">
          <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-800">
            <span className="text-slate-400">Train Schedule:</span>
            <span className="font-semibold text-white">{train.trainNumber}</span>
          </div>

          <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-800">
            <span className="text-slate-400">Segment Route:</span>
            <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
              <span>{originStation.name}</span>
              <ArrowRight className="w-3 h-3 text-slate-500" />
              <span>{destinationStation.name}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-800">
            <span className="text-slate-400">Carriage & Seat:</span>
            <div className="flex items-center gap-2">
              <span className="bg-blue-500/20 text-blue-300 font-semibold px-2 py-0.5 rounded text-[11px] border border-blue-500/30">
                {seat.coachName}
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 font-bold px-2.5 py-0.5 rounded text-xs border border-emerald-500/30">
                Seat {seat.seatNumber}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-slate-400">Distance & Calculated Fare:</span>
            <div className="text-right">
              <div className="text-emerald-400 font-extrabold text-sm">
                LKR {(seat.fareAmount || 0).toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-500 font-medium">
                {seat.distanceKm || Math.abs((destinationStation.distanceFromOriginKm || 0) - (originStation.distanceFromOriginKm || 0))} km travel distance
              </div>
            </div>
          </div>
        </div>

        {/* Error alert */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Passenger Information Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-400" />
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
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-teal-400" />
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
              className="w-1/3 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition-all"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-2/3 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 hover:from-blue-500 hover:to-emerald-400 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all transform active:scale-95 disabled:opacity-50"
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
