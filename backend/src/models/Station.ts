import mongoose, { Schema, Document } from 'mongoose';
import { IStation } from '../types';

export interface IStationDocument extends Document, Omit<IStation, '_id'> {}

const StationSchema: Schema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    code: { type: String, required: true, unique: true, uppercase: true },
    sequence: { type: Number, required: true, index: true },
  },
  { timestamps: true }
);

export const Station = mongoose.model<IStationDocument>('Station', StationSchema);
