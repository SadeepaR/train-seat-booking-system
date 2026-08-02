import { Types } from 'mongoose';

export interface IStation {
  _id?: Types.ObjectId;
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
  _id?: Types.ObjectId;
  name: string;
  classType: CoachClass;
  totalSeats: number;
  layoutRows: number;
  layoutCols: number;
}

export interface ISeat {
  _id?: Types.ObjectId;
  coachId: Types.ObjectId;
  seatNumber: string; // e.g. "1A", "1B"
  row: number;
  column: number;
}

export interface ITrainStationRoute {
  stationId: Types.ObjectId;
  name: string;
  code: string;
  sequence: number;
  distanceFromOriginKm: number;
  arrivalTime?: string;
  departureTime?: string;
}

export interface ITrain {
  _id?: Types.ObjectId;
  trainNumber: string;
  name: string;
  stations: ITrainStationRoute[];
}

export enum BookingStatus {
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
}

export interface IBooking {
  _id?: Types.ObjectId;
  trainId: Types.ObjectId;
  seatId: Types.ObjectId;
  passengerName: string;
  passengerEmail: string;
  originStationId: Types.ObjectId;
  destinationStationId: Types.ObjectId;
  originStationName: string;
  destinationStationName: string;
  fromSequence: number; // Inclusive start index
  toSequence: number;   // Exclusive end index
  distanceKm: number;
  fareAmount: number;
  status: BookingStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

// Seat availability response DTO
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
