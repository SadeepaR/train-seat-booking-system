export interface Station {
  _id: string;
  name: string;
  code: string;
  sequence: number;
  distanceFromOriginKm: number;
}

export interface TrainRouteStation {
  stationId: string;
  name: string;
  code: string;
  sequence: number;
  distanceFromOriginKm: number;
  arrivalTime?: string;
  departureTime?: string;
}

export interface Train {
  _id: string;
  trainNumber: string;
  name: string;
  stations: TrainRouteStation[];
}

export enum CoachClass {
  FIRST = 'FIRST',
  SECOND = 'SECOND',
  THIRD = 'THIRD',
}

export interface Coach {
  id: string;
  name: string;
  classType: CoachClass;
  totalSeats: number;
  layoutRows: number;
  layoutCols: number;
}

export interface SeatAvailability {
  seatId: string;
  seatNumber: string;
  row: number;
  column: number;
  coachId: string;
  coachName: string;
  coachClass: CoachClass;
  isAvailable: boolean;
  distanceKm: number;
  fareAmount: number;
  conflictingSegments: {
    fromStationName: string;
    toStationName: string;
    fromSequence: number;
    toSequence: number;
  }[];
}

export interface AvailabilityResponse {
  train: {
    id: string;
    trainNumber: string;
    name: string;
  };
  journey: {
    origin: TrainRouteStation;
    destination: TrainRouteStation;
    fromSequence: number;
    toSequence: number;
    segmentCount: number;
  };
  coaches: Coach[];
  seats: SeatAvailability[];
}

export interface Booking {
  _id: string;
  trainId: string | Train;
  seatId: string | { _id: string; seatNumber: string };
  passengerName: string;
  passengerEmail: string;
  originStationName: string;
  destinationStationName: string;
  fromSequence: number;
  toSequence: number;
  distanceKm: number;
  fareAmount: number;
  status: 'CONFIRMED' | 'CANCELLED';
  createdAt: string;
}

export interface CreateBookingRequest {
  trainId: string;
  seatId: string;
  passengerName: string;
  passengerEmail: string;
  originStationId: string;
  destinationStationId: string;
}
