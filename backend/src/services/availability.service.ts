import { Train } from '../models/Train';
import { Coach } from '../models/Coach';
import { Seat } from '../models/Seat';
import { Booking } from '../models/Booking';
import { BookingStatus, CoachClass, ISeatAvailabilityDTO } from '../types';
import { checkSegmentOverlap, isValidJourneySegment } from '../utils/segment';

export interface IAvailabilityRequest {
  trainId: string;
  originStationId: string;
  destinationStationId: string;
}

export const getSeatAvailability = async ({
  trainId,
  originStationId,
  destinationStationId,
}: IAvailabilityRequest) => {
  // 1. Fetch train and locate origin/destination stations in route
  const train = await Train.findById(trainId);
  if (!train) {
    throw new Error('Train schedule not found');
  }

  const originRoute = train.stations.find(
    (st) => st.stationId.toString() === originStationId
  );
  const destRoute = train.stations.find(
    (st) => st.stationId.toString() === destinationStationId
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

  // 2. Query all confirmed bookings on this train that overlap with [fromSequence, toSequence)
  // Overlap condition in MongoDB query: fromSeq < reqToSeq AND toSeq > reqFromSeq
  const overlappingBookings = await Booking.find({
    trainId: train._id,
    status: BookingStatus.CONFIRMED,
    $and: [
      { fromSequence: { $lt: toSequence } },
      { toSequence: { $gt: fromSequence } },
    ],
  });

  // Map of booked seat ID string -> list of conflicting booking details
  const bookedSeatMap = new Map<string, Array<{ fromStationName: string; toStationName: string; fromSequence: number; toSequence: number }>>();

  for (const b of overlappingBookings) {
    const sId = b.seatId.toString();
    const existing = bookedSeatMap.get(sId) || [];
    existing.push({
      fromStationName: b.originStationName,
      toStationName: b.destinationStationName,
      fromSequence: b.fromSequence,
      toSequence: b.toSequence,
    });
    bookedSeatMap.set(sId, existing);
  }

  // 3. Fetch all coaches and seats
  const coaches = await Coach.find().sort({ classType: 1 });
  const seats = await Seat.find().sort({ row: 1, column: 1 });

  const coachMap = new Map(coaches.map((c) => [c._id.toString(), c]));

  // 4. Construct seat availability DTOs
  const seatAvailabilityResults: ISeatAvailabilityDTO[] = seats.map((seat) => {
    const coach = coachMap.get(seat.coachId.toString());
    const conflicts = bookedSeatMap.get(seat._id.toString());
    const isAvailable = !conflicts || conflicts.length === 0;

    return {
      seatId: seat._id.toString(),
      seatNumber: seat.seatNumber,
      row: seat.row,
      column: seat.column,
      coachId: seat.coachId.toString(),
      coachName: coach ? coach.name : 'Unknown Coach',
      coachClass: coach ? coach.classType : CoachClass.THIRD,
      isAvailable,
      conflictingSegments: conflicts || [],
    };
  });

  return {
    train: {
      id: train._id,
      trainNumber: train.trainNumber,
      name: train.name,
    },
    journey: {
      origin: originRoute,
      destination: destRoute,
      fromSequence,
      toSequence,
      segmentCount: toSequence - fromSequence,
    },
    coaches: coaches.map((c) => ({
      id: c._id.toString(),
      name: c.name,
      classType: c.classType,
      totalSeats: c.totalSeats,
      layoutRows: c.layoutRows,
      layoutCols: c.layoutCols,
    })),
    seats: seatAvailabilityResults,
  };
};
