import { Booking } from '../models/Booking';
import { Seat } from '../models/Seat';
import { Coach } from '../models/Coach';
import { Station } from '../models/Station';
import { Train } from '../models/Train';
import { BookingStatus, CoachClass } from '../types';

export interface IAdminStatsResponse {
  summary: {
    totalBookings: number;
    totalRevenueLKR: number;
    totalSeatsInTrain: number;
    overallOccupancyRate: number; // percentage
    segmentReusedSeatsCount: number; // count of seats with >1 booking
    revenueEfficiencyGainedLKR: number; // estimated extra revenue from leg re-selling
  };
  classBreakdown: {
    classType: CoachClass;
    className: string;
    totalSeats: number;
    bookedSegmentsCount: number;
    occupancyPercentage: number;
  }[];
  recentReservations: any[];
  stationOccupancy: {
    stationName: string;
    code: string;
    sequence: number;
    boardingCount: number;
    alightingCount: number;
  }[];
}

export const getAdminDepartmentStats = async (): Promise<IAdminStatsResponse> => {
  // 1. Fetch active bookings
  const confirmedBookings = await Booking.find({ status: BookingStatus.CONFIRMED })
    .populate('seatId')
    .sort({ createdAt: -1 });

  // 2. Fetch seats, coaches, stations, and trains
  const seats = await Seat.find();
  const coaches = await Coach.find();
  const stations = await Station.find().sort({ sequence: 1 });
  const trains = await Train.find();

  const totalSeatsInTrain = seats.length;
  const totalStations = stations.length;
  const totalSegmentsPerTrain = totalStations > 1 ? totalStations - 1 : 1;
  const totalTrainCapacitySegments = totalSeatsInTrain * totalSegmentsPerTrain * (trains.length || 1);

  // 3. Compute total segments occupied across all confirmed bookings
  let totalBookedSegmentUnits = 0;
  let calculatedRevenue = 0;

  // Map seatId -> count of bookings for segment sharing analysis
  const seatBookingCounts = new Map<string, number>();

  for (const booking of confirmedBookings) {
    const segmentSpan = Math.max(1, booking.toSequence - booking.fromSequence);
    totalBookedSegmentUnits += segmentSpan;

    // Standard fare estimation based on distance/span until explicit fare model is added
    const seatObj: any = booking.seatId;
    const baseRatePerStop = 250; // LKR
    const bookingFare = (booking as any).fareAmount || (segmentSpan * baseRatePerStop);
    calculatedRevenue += bookingFare;

    const sId = booking.seatId ? (booking.seatId as any)._id?.toString() || booking.seatId.toString() : '';
    if (sId) {
      seatBookingCounts.set(sId, (seatBookingCounts.get(sId) || 0) + 1);
    }
  }

  // Count seats booked more than once (segment re-selling success)
  let segmentReusedSeatsCount = 0;
  seatBookingCounts.forEach((count) => {
    if (count > 1) segmentReusedSeatsCount++;
  });

  // Calculate efficiency bonus: seats that yielded 2+ bookings
  const revenueEfficiencyGainedLKR = Math.round(segmentReusedSeatsCount * 1200);

  // 4. Overall Occupancy Rate
  const overallOccupancyRate = totalTrainCapacitySegments > 0
    ? Math.min(100, Math.round((totalBookedSegmentUnits / totalTrainCapacitySegments) * 100 * 10) / 10)
    : 0;

  // 5. Coach Class Breakdown
  const coachMap = new Map(coaches.map((c) => [c._id.toString(), c]));
  const classStatsMap = new Map<CoachClass, { totalSeats: number; bookedSegments: number }>();

  for (const c of coaches) {
    const existing = classStatsMap.get(c.classType) || { totalSeats: 0, bookedSegments: 0 };
    existing.totalSeats += c.totalSeats;
    classStatsMap.set(c.classType, existing);
  }

  for (const booking of confirmedBookings) {
    const seatObj: any = booking.seatId;
    if (seatObj && seatObj.coachId) {
      const coach = coachMap.get(seatObj.coachId.toString());
      if (coach) {
        const stats = classStatsMap.get(coach.classType);
        if (stats) {
          stats.bookedSegments += Math.max(1, booking.toSequence - booking.fromSequence);
        }
      }
    }
  }

  const classBreakdown = Array.from(classStatsMap.entries()).map(([classType, stats]) => {
    const maxCapacity = stats.totalSeats * totalSegmentsPerTrain;
    const occupancyPercentage = maxCapacity > 0
      ? Math.min(100, Math.round((stats.bookedSegments / maxCapacity) * 100 * 10) / 10)
      : 0;

    let className = '3rd Class Reserved';
    if (classType === CoachClass.FIRST) className = '1st Class Observation';
    if (classType === CoachClass.SECOND) className = '2nd Class Reserved';

    return {
      classType,
      className,
      totalSeats: stats.totalSeats,
      bookedSegmentsCount: stats.bookedSegments,
      occupancyPercentage,
    };
  });

  // 6. Station Boarding & Alighting Activity
  const stationOccupancy = stations.map((st) => {
    const boardingCount = confirmedBookings.filter(
      (b) => b.originStationId.toString() === st._id.toString()
    ).length;

    const alightingCount = confirmedBookings.filter(
      (b) => b.destinationStationId.toString() === st._id.toString()
    ).length;

    return {
      stationName: st.name,
      code: st.code,
      sequence: st.sequence,
      boardingCount,
      alightingCount,
    };
  });

  // 7. Recent 10 Reservations
  const recentReservations = confirmedBookings.slice(0, 10).map((b) => ({
    id: b._id,
    passengerName: b.passengerName,
    passengerEmail: b.passengerEmail,
    seatNumber: (b.seatId as any)?.seatNumber || 'N/A',
    originStationName: b.originStationName,
    destinationStationName: b.destinationStationName,
    fromSequence: b.fromSequence,
    toSequence: b.toSequence,
    fareAmount: (b as any).fareAmount || (b.toSequence - b.fromSequence) * 250,
    createdAt: b.createdAt,
  }));

  return {
    summary: {
      totalBookings: confirmedBookings.length,
      totalRevenueLKR: calculatedRevenue,
      totalSeatsInTrain,
      overallOccupancyRate,
      segmentReusedSeatsCount,
      revenueEfficiencyGainedLKR,
    },
    classBreakdown,
    recentReservations,
    stationOccupancy,
  };
};
