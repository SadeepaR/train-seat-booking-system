export interface IStation {
  id: number | string;
  name: string;
  code: string;
  sequence: number;
  distanceFromOriginKm: number;
}

export enum CoachClass {
  FIRST = 'FIRST',
  SECOND = 'SECOND',
  THIRD = 'THIRD',
}

export interface ICoach {
  id: number | string;
  name: string;
  classType: CoachClass;
  totalSeats: number;
  layoutRows: number;
  layoutCols: number;
}

export interface ISeat {
  id: number | string;
  coachId: number | string;
  seatNumber: string;
  row: number;
  column: number;
}

export interface ITrainStationRoute {
  stationId: number | string;
  name: string;
  code: string;
  sequence: number;
  distanceFromOriginKm: number;
  arrivalTime?: string;
  departureTime?: string;
}

export interface ITrain {
  id: number | string;
  trainNumber: string;
  name: string;
  stations: ITrainStationRoute[];
}

export enum BookingStatus {
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
}

export interface IBooking {
  id: number | string;
  trainId: number | string;
  seatId: number | string;
  passengerName: string;
  passengerEmail: string;
  originStationId: number | string;
  destinationStationId: number | string;
  originStationName: string;
  destinationStationName: string;
  fromSequence: number;
  toSequence: number;
  distanceKm: number;
  fareAmount: number;
  status: BookingStatus;
  createdAt?: Date;
}

// Seat availability DTO
export interface ISeatAvailabilityDTO {
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
  conflictingSegments?: {
    fromStationName: string;
    toStationName: string;
    fromSequence: number;
    toSequence: number;
  }[];
}
