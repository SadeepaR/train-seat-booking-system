import { pool } from '../config/db';
import { CoachClass, ISeatAvailabilityDTO } from '../types';
import { isValidJourneySegment } from '../utils/segment';
import { calculateDistanceAndFare } from '../utils/fare';

export interface IAvailabilityRequest {
  trainId: string | number;
  originStationId: string | number;
  destinationStationId: string | number;
}

export const getSeatAvailability = async ({
  trainId,
  originStationId,
  destinationStationId,
}: IAvailabilityRequest) => {
  // 1. Fetch train route
  const trainRes = await pool.query(`SELECT * FROM trains WHERE id = $1`, [trainId]);
  if (trainRes.rows.length === 0) {
    throw new Error('Train schedule not found');
  }

  const train = trainRes.rows[0];
  const stationsRoute: any[] = typeof train.route_stations === 'string'
    ? JSON.parse(train.route_stations)
    : train.route_stations;

  const originRoute = stationsRoute.find(
    (st: any) => st.stationId.toString() === originStationId.toString()
  );
  const destRoute = stationsRoute.find(
    (st: any) => st.stationId.toString() === destinationStationId.toString()
  );

  if (!originRoute || !destRoute) {
    throw new Error('Origin or Destination station not found on train route');
  }

  const fromSequence = originRoute.sequence;
  const toSequence = destRoute.sequence;

  if (!isValidJourneySegment(fromSequence, toSequence)) {
    throw new Error(
      `Invalid journey: Destination (${destRoute.name}) must be downstream of Origin (${originRoute.name})`
    );
  }

  // 2. Query confirmed bookings using PostgreSQL native range overlap operator (&&)
  const overlapQuery = `
    SELECT b.*
    FROM bookings b
    WHERE b.train_id = $1 
      AND b.status = 'CONFIRMED'
      AND int4range(b.from_sequence, b.to_sequence, '[)') && int4range($2, $3, '[)')
  `;
  const overlapRes = await pool.query(overlapQuery, [train.id, fromSequence, toSequence]);

  const bookedSeatMap = new Map<string, Array<{ fromStationName: string; toStationName: string; fromSequence: number; toSequence: number }>>();

  for (const b of overlapRes.rows) {
    const sId = b.seat_id.toString();
    const existing = bookedSeatMap.get(sId) || [];
    existing.push({
      fromStationName: b.origin_station_name,
      toStationName: b.destination_station_name,
      fromSequence: b.from_sequence,
      toSequence: b.to_sequence,
    });
    bookedSeatMap.set(sId, existing);
  }

  // 3. Query all coaches and seats
  const coachesRes = await pool.query(`SELECT * FROM coaches ORDER BY class_type ASC`);
  const seatsRes = await pool.query(`SELECT * FROM seats ORDER BY row_num ASC, col_num ASC`);

  const coachMap = new Map<string, any>(coachesRes.rows.map((c: any) => [c.id.toString(), c]));

  const originKm = originRoute.distanceFromOriginKm || 0;
  const destKm = destRoute.distanceFromOriginKm || 0;

  // 4. Construct seat availability DTOs
  const seatAvailabilityResults: ISeatAvailabilityDTO[] = seatsRes.rows.map((seat: any) => {
    const coach: any = coachMap.get(seat.coach_id.toString());
    const conflicts = bookedSeatMap.get(seat.id.toString());
    const isAvailable = !conflicts || conflicts.length === 0;

    const classType = (coach ? coach.class_type : CoachClass.THIRD) as CoachClass;
    const { distanceKm, fareAmount } = calculateDistanceAndFare(originKm, destKm, classType);

    return {
      seatId: seat.id.toString(),
      seatNumber: seat.seat_number,
      row: seat.row_num,
      column: seat.col_num,
      coachId: seat.coach_id.toString(),
      coachName: coach ? coach.name : 'Unknown Coach',
      coachClass: classType,
      isAvailable,
      distanceKm,
      fareAmount,
      conflictingSegments: conflicts || [],
    };
  });

  return {
    train: {
      id: train.id.toString(),
      trainNumber: train.train_number,
      name: train.name,
    },
    journey: {
      origin: originRoute,
      destination: destRoute,
      fromSequence,
      toSequence,
      segmentCount: toSequence - fromSequence,
    },
    coaches: coachesRes.rows.map((c: any) => ({
      id: c.id.toString(),
      name: c.name,
      classType: c.class_type,
      totalSeats: c.total_seats,
      layoutRows: c.layout_rows,
      layoutCols: c.layout_cols,
    })),
    seats: seatAvailabilityResults,
  };
};
