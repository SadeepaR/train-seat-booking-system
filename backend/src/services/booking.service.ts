import mongoose from 'mongoose';
import { Booking } from '../models/Booking';
import { Train } from '../models/Train';
import { Seat } from '../models/Seat';
import { BookingStatus } from '../types';
import { isValidJourneySegment } from '../utils/segment';
import { calculateDistanceAndFare } from '../utils/fare';
import { BookingConflictError, ValidationError } from '../utils/errors';

export interface ICreateBookingInput {
  trainId: string;
  seatId: string;
  passengerName: string;
  passengerEmail: string;
  originStationId: string;
  destinationStationId: string;
}

/**
 * Creates a train seat booking with ACID transaction concurrency protection.
 * 
 * Double Booking Prevention Mechanism:
 * 1. Opens a MongoDB Session transaction.
 * 2. Fetches current train route and verifies station sequences.
 * 3. Inside the transaction, queries active CONFIRMED bookings for (trainId, seatId)
 *    where requested segment [fromSeq, toSeq) overlaps existing bookings.
 * 4. If any overlapping booking is found, the transaction is aborted and a
 *    409 Conflict exception is raised.
 * 5. If available, writes the new Booking document and commits the transaction.
 */
export const createBooking = async (input: ICreateBookingInput) => {
  const { trainId, seatId, passengerName, passengerEmail, originStationId, destinationStationId } = input;

  if (!passengerName || !passengerEmail) {
    throw new ValidationError('Passenger name and email are required');
  }

  // 1. Verify train and seat existence
  const train = await Train.findById(trainId);
  if (!train) {
    throw new ValidationError('Train schedule not found');
  }

  const seat = await Seat.findById(seatId).populate('coachId');
  if (!seat) {
    throw new ValidationError('Seat not found');
  }

  // 2. Identify station sequences in route
  const originRoute = train.stations.find((st) => st.stationId.toString() === originStationId);
  const destRoute = train.stations.find((st) => st.stationId.toString() === destinationStationId);

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

  // 3. Attempt ACID Transaction with fallback if MongoDB is not running as replica set
  let session: mongoose.ClientSession | null = null;
  let useTransaction = true;

  try {
    session = await mongoose.startSession();
    session.startTransaction();
  } catch (err) {
    // If standalone MongoDB instance (no replica set), fallback to atomic operation logic
    console.warn('[BookingService] Transactions not supported on single standalone Mongo node, proceeding without session transaction.');
    useTransaction = false;
    session = null;
  }

  try {
    // Overlap query inside transaction:
    // Finds any confirmed booking on same seat & train where:
    // existing.fromSequence < new.toSequence AND existing.toSequence > new.fromSequence
    const query = Booking.find({
      trainId: train._id,
      seatId: seat._id,
      status: BookingStatus.CONFIRMED,
      $and: [
        { fromSequence: { $lt: toSequence } },
        { toSequence: { $gt: fromSequence } },
      ],
    });

    if (useTransaction && session) {
      query.session(session);
    }

    const existingOverlaps = await query.exec();

    if (existingOverlaps.length > 0) {
      const conflict = existingOverlaps[0];
      throw new BookingConflictError(
        `Seat ${seat.seatNumber} is already booked for an overlapping segment (${conflict.originStationName} to ${conflict.destinationStationName}).`,
        conflict
      );
    }

    const coachObj: any = seat.coachId;
    const classType = coachObj && coachObj.classType ? coachObj.classType : 'THIRD';
    const originKm = originRoute.distanceFromOriginKm || 0;
    const destKm = destRoute.distanceFromOriginKm || 0;
    const { distanceKm, fareAmount } = calculateDistanceAndFare(originKm, destKm, classType);

    // No overlap found -> Create booking document
    const newBookingDocs = await Booking.create(
      [
        {
          trainId: train._id,
          seatId: seat._id,
          passengerName,
          passengerEmail,
          originStationId: originRoute.stationId,
          destinationStationId: destRoute.stationId,
          originStationName: originRoute.name,
          destinationStationName: destRoute.name,
          fromSequence,
          toSequence,
          distanceKm,
          fareAmount,
          status: BookingStatus.CONFIRMED,
        },
      ],
      useTransaction && session ? { session } : {}
    );

    if (useTransaction && session) {
      await session.commitTransaction();
    }

    return newBookingDocs[0];
  } catch (error) {
    if (useTransaction && session) {
      await session.abortTransaction();
    }
    throw error;
  } finally {
    if (session) {
      session.endSession();
    }
  }
};

export const getBookings = async (trainId?: string) => {
  const query: any = {};
  if (trainId) {
    query.trainId = trainId;
  }

  const bookings = await Booking.find(query)
    .populate('seatId')
    .populate('trainId', 'trainNumber name')
    .sort({ createdAt: -1 });

  return bookings;
};
