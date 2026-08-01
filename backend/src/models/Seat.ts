import mongoose, { Schema, Document } from 'mongoose';
import { ISeat } from '../types';

export interface ISeatDocument extends Document, Omit<ISeat, '_id'> {}

const SeatSchema: Schema = new Schema(
  {
    coachId: { type: Schema.Types.ObjectId, ref: 'Coach', required: true, index: true },
    seatNumber: { type: String, required: true },
    row: { type: Number, required: true },
    column: { type: Number, required: true },
  },
  { timestamps: true }
);

// Compound index to ensure uniqueness of seat number per coach
SeatSchema.index({ coachId: 1, seatNumber: 1 }, { unique: true });

export const Seat = mongoose.model<ISeatDocument>('Seat', SeatSchema);
