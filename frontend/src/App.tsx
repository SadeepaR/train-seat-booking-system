import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { StationSelector } from './components/StationSelector';
import { CoachTabs } from './components/CoachTabs';
import { SeatLegend } from './components/SeatLegend';
import { SeatMap } from './components/SeatMap';
import { BookingModal } from './components/BookingModal';
import { BookingList } from './components/BookingList';
import { ToastBanner, ToastMessage } from './components/ToastBanner';
import { api } from './services/api';
import { Station, Train, AvailabilityResponse, SeatAvailability, Booking } from './types';
import { Train as TrainIcon, Route, AlertCircle } from 'lucide-react';

export function App() {
  const [stations, setStations] = useState<Station[]>([]);
  const [trains, setTrains] = useState<Train[]>([]);
  const [selectedTrainId, setSelectedTrainId] = useState<string>('');
  const [selectedOriginId, setSelectedOriginId] = useState<string>('');
  const [selectedDestinationId, setSelectedDestinationId] = useState<string>('');

  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [activeCoachId, setActiveCoachId] = useState<string>('');
  const [selectedSeat, setSelectedSeat] = useState<SeatAvailability | null>(null);
  
  const [bookings, setBookings] = useState<Booking[]>([]);

  const [isLoadingStations, setIsLoadingStations] = useState<boolean>(true);
  const [isSearchingAvailability, setIsSearchingAvailability] = useState<boolean>(false);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState<boolean>(false);
  const [isResettingDB, setIsResettingDB] = useState<boolean>(false);

  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Load initial data
  const loadInitialData = async () => {
    setIsLoadingStations(true);
    try {
      const [fetchedStations, fetchedTrains] = await Promise.all([
        api.getStations(),
        api.getTrains(),
      ]);

      setStations(fetchedStations);
      setTrains(fetchedTrains);

      if (fetchedTrains.length > 0) {
        setSelectedTrainId(fetchedTrains[0]._id);
      }

      if (fetchedStations.length >= 2) {
        setSelectedOriginId(fetchedStations[0]._id); // Colombo Fort
        // Default to Kandy (seq 6) or 4th station
        const kandy = fetchedStations.find((s) => s.code === 'KDY') || fetchedStations[6] || fetchedStations[1];
        setSelectedDestinationId(kandy._id);
      }

      await refreshBookings();
    } catch (err: any) {
      showToast('error', 'Initialization Failed', err.message || 'Failed to connect to backend API');
    } finally {
      setIsLoadingStations(false);
    }
  };

  const refreshBookings = async () => {
    try {
      const fetchedBookings = await api.getBookings();
      setBookings(fetchedBookings);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Trigger search availability
  const handleSearchAvailability = async () => {
    if (!selectedTrainId || !selectedOriginId || !selectedDestinationId) return;

    setIsSearchingAvailability(true);
    setSelectedSeat(null);
    try {
      const res = await api.getSeatAvailability(
        selectedTrainId,
        selectedOriginId,
        selectedDestinationId
      );
      setAvailability(res);

      if (res.coaches.length > 0) {
        setActiveCoachId(res.coaches[0].id);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to search seat availability';
      showToast('error', 'Search Error', errorMsg);
    } finally {
      setIsSearchingAvailability(false);
    }
  };

  // Auto-search availability when initial values load
  useEffect(() => {
    if (selectedTrainId && selectedOriginId && selectedDestinationId && !availability) {
      handleSearchAvailability();
    }
  }, [selectedTrainId, selectedOriginId, selectedDestinationId]);

  // Handle booking submission
  const handleConfirmBooking = async (passengerName: string, passengerEmail: string) => {
    if (!selectedSeat || !selectedTrainId || !selectedOriginId || !selectedDestinationId) return;

    setIsSubmittingBooking(true);
    try {
      await api.createBooking({
        trainId: selectedTrainId,
        seatId: selectedSeat.seatId,
        passengerName,
        passengerEmail,
        originStationId: selectedOriginId,
        destinationStationId: selectedDestinationId,
      });

      showToast(
        'success',
        'Booking Confirmed!',
        `Seat ${selectedSeat.seatNumber} successfully booked for ${passengerName}.`
      );

      setSelectedSeat(null);
      await handleSearchAvailability();
      await refreshBookings();
    } catch (err: any) {
      const status = err.response?.status;
      const message = err.response?.data?.message || err.message || 'Booking failed';

      if (status === 409) {
        showToast(
          'error',
          'Booking Conflict (Double Booking Blocked)',
          message
        );
      } else {
        showToast('error', 'Booking Failed', message);
      }
      throw err;
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  // Reset & Seed database
  const handleResetDatabase = async () => {
    setIsResettingDB(true);
    try {
      await api.seedDatabase();
      showToast('success', 'Database Reset', 'Seeded fresh stations, coaches, seats, and schedule!');
      setAvailability(null);
      await loadInitialData();
    } catch (err: any) {
      showToast('error', 'Reset Failed', err.message || 'Failed to reset database');
    } finally {
      setIsResettingDB(false);
    }
  };

  const showToast = (type: 'success' | 'error', title: string, message: string) => {
    setToast({
      id: Date.now().toString(),
      type,
      title,
      message,
    });
  };

  const currentCoach = availability?.coaches.find((c) => c.id === activeCoachId);
  const originStation = stations.find((s) => s._id === selectedOriginId);
  const destinationStation = stations.find((s) => s._id === selectedDestinationId);
  const currentTrain = trains.find((t) => t._id === selectedTrainId);

  return (
    <div className="min-h-screen pb-16">
      {/* Navbar Header */}
      <Header onResetDatabase={handleResetDatabase} isResetting={isResettingDB} />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Loading Spinner */}
        {isLoadingStations ? (
          <div className="flex flex-col items-center justify-center py-24 glass-panel rounded-3xl">
            <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
            <p className="text-slate-300 text-sm font-medium">Connecting to Colombo Fort Railway API...</p>
          </div>
        ) : (
          <>
            {/* Journey Search Box */}
            <StationSelector
              stations={stations}
              trains={trains}
              selectedTrainId={selectedTrainId}
              selectedOriginId={selectedOriginId}
              selectedDestinationId={selectedDestinationId}
              onTrainChange={(tId) => {
                setSelectedTrainId(tId);
                setAvailability(null);
              }}
              onOriginChange={(oId) => {
                setSelectedOriginId(oId);
                setAvailability(null);
              }}
              onDestinationChange={(dId) => {
                setSelectedDestinationId(dId);
                setAvailability(null);
              }}
              onSearch={handleSearchAvailability}
              isLoading={isSearchingAvailability}
            />

            {/* Active Bookings Summary */}
            <BookingList bookings={bookings} />

            {/* Seat Map Section */}
            {availability && (
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <Route className="w-5 h-5 text-blue-400" />
                      Train Seat Map & Real-Time Availability
                    </h2>
                    <p className="text-xs text-slate-400">
                      Segment: <span className="text-emerald-400 font-semibold">{originStation?.name}</span> to{' '}
                      <span className="text-rose-400 font-semibold">{destinationStation?.name}</span>
                    </p>
                  </div>

                  {/* Seat Legend */}
                  <SeatLegend />
                </div>

                {/* Coach Selection Tabs */}
                {availability.coaches.length > 0 && (
                  <CoachTabs
                    coaches={availability.coaches}
                    activeCoachId={activeCoachId}
                    onSelectCoach={(cId) => {
                      setActiveCoachId(cId);
                      setSelectedSeat(null);
                    }}
                  />
                )}

                {/* Interactive 2D Seat Grid */}
                {currentCoach ? (
                  <SeatMap
                    coach={currentCoach}
                    seats={availability.seats}
                    selectedSeatId={selectedSeat?.seatId || null}
                    onSelectSeat={(seat) => setSelectedSeat(seat)}
                  />
                ) : (
                  <div className="glass-panel p-8 text-center text-slate-400 text-sm rounded-2xl">
                    Select a carriage above to inspect the seat map.
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Booking Modal */}
      {selectedSeat && currentTrain && originStation && destinationStation && (
        <BookingModal
          seat={selectedSeat}
          train={currentTrain}
          originStation={originStation}
          destinationStation={destinationStation}
          onClose={() => setSelectedSeat(null)}
          onSubmitBooking={handleConfirmBooking}
          isSubmitting={isSubmittingBooking}
        />
      )}

      {/* Toast Alert Banner */}
      <ToastBanner toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
