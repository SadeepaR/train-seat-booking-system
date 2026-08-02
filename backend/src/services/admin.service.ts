import { pool } from '../config/db';
import { CoachClass } from '../types';

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
  // 1. Fetch active confirmed bookings
  const bookingsRes = await pool.query(`
    SELECT b.*, s.seat_number, s.coach_id, c.class_type, c.name as coach_name
    FROM bookings b
    JOIN seats s ON b.seat_id = s.id
    JOIN coaches c ON s.coach_id = c.id
    WHERE b.status = 'CONFIRMED'
    ORDER BY b.created_at DESC
  `);
  const confirmedBookings = bookingsRes.rows;

  // 2. Fetch seats, coaches, stations, and trains
  const seatsRes = await pool.query(`SELECT * FROM seats`);
  const coachesRes = await pool.query(`SELECT * FROM coaches`);
  const stationsRes = await pool.query(`SELECT * FROM stations ORDER BY sequence ASC`);
  const trainsRes = await pool.query(`SELECT * FROM trains`);

  const totalSeatsInTrain = seatsRes.rows.length;
  const totalStations = stationsRes.rows.length;
  const totalSegmentsPerTrain = totalStations > 1 ? totalStations - 1 : 1;
  const totalTrainCapacitySegments = totalSeatsInTrain * totalSegmentsPerTrain * (trainsRes.rows.length || 1);

  // 3. Compute revenue and segment reuse metrics
  let totalBookedSegmentUnits = 0;
  let calculatedRevenue = 0;

  const seatBookingCounts = new Map<string, number>();

  for (const booking of confirmedBookings) {
    const segmentSpan = Math.max(1, booking.to_sequence - booking.from_sequence);
    totalBookedSegmentUnits += segmentSpan;

    calculatedRevenue += Number(booking.fare_amount || 0);

    const sId = booking.seat_id.toString();
    seatBookingCounts.set(sId, (seatBookingCounts.get(sId) || 0) + 1);
  }

  // Count seats booked more than once (segment re-selling success)
  let segmentReusedSeatsCount = 0;
  seatBookingCounts.forEach((count) => {
    if (count > 1) segmentReusedSeatsCount++;
  });

  const revenueEfficiencyGainedLKR = Math.round(segmentReusedSeatsCount * 1200);

  // 4. Overall Occupancy Rate
  const overallOccupancyRate = totalTrainCapacitySegments > 0
    ? Math.min(100, Math.round((totalBookedSegmentUnits / totalTrainCapacitySegments) * 100 * 10) / 10)
    : 0;

  // 5. Coach Class Breakdown
  const classStatsMap = new Map<CoachClass, { totalSeats: number; bookedSegments: number }>();

  for (const c of coachesRes.rows) {
    const classType = c.class_type as CoachClass;
    const existing = classStatsMap.get(classType) || { totalSeats: 0, bookedSegments: 0 };
    existing.totalSeats += Number(c.total_seats);
    classStatsMap.set(classType, existing);
  }

  for (const booking of confirmedBookings) {
    const classType = booking.class_type as CoachClass;
    const stats = classStatsMap.get(classType);
    if (stats) {
      stats.bookedSegments += Math.max(1, booking.to_sequence - booking.from_sequence);
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
  const stationOccupancy = stationsRes.rows.map((st: any) => {
    const boardingCount = confirmedBookings.filter(
      (b: any) => b.origin_station_id.toString() === st.id.toString()
    ).length;

    const alightingCount = confirmedBookings.filter(
      (b: any) => b.destination_station_id.toString() === st.id.toString()
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
  const recentReservations = confirmedBookings.slice(0, 10).map((b: any) => ({
    id: b.id.toString(),
    passengerName: b.passenger_name,
    passengerEmail: b.passenger_email,
    seatNumber: b.seat_number,
    originStationName: b.origin_station_name,
    destinationStationName: b.destination_station_name,
    fromSequence: b.from_sequence,
    toSequence: b.to_sequence,
    fareAmount: Number(b.fare_amount || 0),
    createdAt: b.created_at,
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
