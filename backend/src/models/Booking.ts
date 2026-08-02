import mongoose, { Schema, Document } from 'mongoose';
import { IBooking, BookingStatus } from '../types';

export interface IBookingDocument extends Document, Omit<IBooking, '_id'> {}

const BookingSchema: Schema = new Schema(
  {
    trainId: { type: Schema.Types.ObjectId, ref: 'Train', required: true, index: true },
    seatId: { type: Schema.Types.ObjectId, ref: 'Seat', required: true, index: true },
    passengerName: { type: String, required: true },
    passengerEmail: { type: String, required: true },
    originStationId: { type: Schema.Types.ObjectId, ref: 'Station', required: true },
    destinationStationId: { type: Schema.Types.ObjectId, ref: 'Station', required: true },
    originStationName: { type: String, required: true },
    destinationStationName: { type: String, required: true },
    fromSequence: { type: Number, required: true, index: true },
    toSequence: { type: Number, required: true, index: true },
    distanceKm: { type: Number, required: true, default: 0 },
    fareAmount: { type: Number, required: true, default: 0 },
    status: {
      type: String,
      enum: Object.values(BookingStatus),
      default: BookingStatus.CONFIRMED,
      index: true,
    },
  },
  { timestamps: true }
);

// Compound index to optimize concurrency overlap queries
BookingSchema.index({ trainId: 1, seatId: 1, status: 1, fromSequence: 1, toSequence: 1 });

export const Booking = mongoose.model<IBookingDocument>('Booking', BookingSchema);
