import { pool } from '../config/db';
import { BookingStatus, CoachClass } from '../types';
import { isValidJourneySegment } from '../utils/segment';
import { calculateDistanceAndFare } from '../utils/fare';
import { BookingConflictError, ValidationError } from '../utils/errors';

export interface ICreateBookingInput {
  trainId: string | number;
  seatId: string | number;
  passengerName: string;
  passengerEmail: string;
  originStationId: string | number;
  destinationStationId: string | number;
}

export const createBooking = async (input: ICreateBookingInput) => {
  const { trainId, seatId, passengerName, passengerEmail, originStationId, destinationStationId } = input;

  if (!passengerName || !passengerEmail) {
    throw new ValidationError('Passenger name and email are required');
  }

  // 1. Fetch train and seat
  const trainRes = await pool.query(`SELECT * FROM trains WHERE id = $1`, [trainId]);
  if (trainRes.rows.length === 0) {
    throw new ValidationError('Train schedule not found');
  }
  const train = trainRes.rows[0];

  const seatRes = await pool.query(`
    SELECT s.*, c.class_type, c.name as coach_name 
    FROM seats s 
    JOIN coaches c ON s.coach_id = c.id 
    WHERE s.id = $1
  `, [seatId]);
  
  if (seatRes.rows.length === 0) {
    throw new ValidationError('Seat not found');
  }
  const seat = seatRes.rows[0];

  // 2. Identify station sequences in route
  const stationsRoute: any[] = typeof train.route_stations === 'string'
    ? JSON.parse(train.route_stations)
    : train.route_stations;

  const originRoute = stationsRoute.find((st: any) => st.stationId.toString() === originStationId.toString());
  const destRoute = stationsRoute.find((st: any) => st.stationId.toString() === destinationStationId.toString());

  if (!originRoute || !destRoute) {
    throw new ValidationError('Origin or Destination station not found on train route');
  }

  const fromSequence = originRoute.sequence;
  const toSequence = destRoute.sequence;

  if (!isValidJourneySegment(fromSequence, toSequence)) {
    throw new ValidationError(
      `Invalid journey: Destination (${destRoute.name}) must be downstream of Origin (${originRoute.name})`
    );
  }

  // 3. Compute distance and fare
  const classType = (seat.class_type || CoachClass.THIRD) as CoachClass;
  const originKm = originRoute.distanceFromOriginKm || 0;
  const destKm = destRoute.distanceFromOriginKm || 0;
  const { distanceKm, fareAmount } = calculateDistanceAndFare(originKm, destKm, classType);

  // 4. Attempt SQL Insert - Database engine enforces exclusion constraint
  try {
    const insertQuery = `
      INSERT INTO bookings (
        train_id, seat_id, passenger_name, passenger_email,
        origin_station_id, destination_station_id, origin_station_name, destination_station_name,
        from_sequence, to_sequence, distance_km, fare_amount, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const res = await pool.query(insertQuery, [
      train.id,
      seat.id,
      passengerName.trim(),
      passengerEmail.trim(),
      originRoute.stationId,
      destRoute.stationId,
      originRoute.name,
      destRoute.name,
      fromSequence,
      toSequence,
      distanceKm,
      fareAmount,
      BookingStatus.CONFIRMED,
    ]);

    const b = res.rows[0];
    return {
      _id: b.id.toString(),
      trainId: b.train_id.toString(),
      seatId: { _id: b.seat_id.toString(), seatNumber: seat.seat_number },
      passengerName: b.passenger_name,
      passengerEmail: b.passenger_email,
      originStationName: b.origin_station_name,
      destinationStationName: b.destination_station_name,
      fromSequence: b.from_sequence,
      toSequence: b.to_sequence,
      distanceKm: b.distance_km,
      fareAmount: b.fare_amount,
      status: b.status,
      createdAt: b.created_at,
    };
  } catch (error: any) {
    // Catch PostgreSQL code 23P01 (exclusion_violation)
    if (error.code === '23P01') {
      throw new BookingConflictError(
        `Seat ${seat.seat_number} is already booked for an overlapping segment on this train.`
      );
    }
    throw error;
  }
};

export const getBookings = async (trainId?: string | number) => {
  let query = `
    SELECT b.*, s.seat_number, t.train_number, t.name as train_name
    FROM bookings b
    JOIN seats s ON b.seat_id = s.id
    JOIN trains t ON b.train_id = t.id
  `;
  const params: any[] = [];

  if (trainId) {
    query += ` WHERE b.train_id = $1`;
    params.push(trainId);
  }

  query += ` ORDER BY b.created_at DESC`;

  const res = await pool.query(query, params);

  return res.rows.map((b: any) => ({
    _id: b.id.toString(),
    trainId: { _id: b.train_id.toString(), trainNumber: b.train_number, name: b.train_name },
    seatId: { _id: b.seat_id.toString(), seatNumber: b.seat_number },
    passengerName: b.passenger_name,
    passengerEmail: b.passenger_email,
    originStationName: b.origin_station_name,
    destinationStationName: b.destination_station_name,
    fromSequence: b.from_sequence,
    toSequence: b.to_sequence,
    distanceKm: b.distance_km,
    fareAmount: b.fare_amount,
    status: b.status,
    createdAt: b.created_at,
  }));
};
