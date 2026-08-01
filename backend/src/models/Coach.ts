import mongoose, { Schema, Document } from 'mongoose';
import { ICoach, CoachClass } from '../types';

export interface ICoachDocument extends Document, Omit<ICoach, '_id'> {}

const CoachSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    classType: {
      type: String,
      enum: Object.values(CoachClass),
      required: true,
    },
    totalSeats: { type: Number, required: true },
    layoutRows: { type: Number, required: true, default: 5 },
    layoutCols: { type: Number, required: true, default: 4 },
  },
  { timestamps: true }
);

export const Coach = mongoose.model<ICoachDocument>('Coach', CoachSchema);
