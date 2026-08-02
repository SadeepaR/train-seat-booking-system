import mongoose, { Schema, Document } from 'mongoose';
import { ITrain } from '../types';

export interface ITrainDocument extends Document, Omit<ITrain, '_id'> {}

const TrainStationRouteSchema: Schema = new Schema({
  stationId: { type: Schema.Types.ObjectId, ref: 'Station', required: true },
  name: { type: String, required: true },
  code: { type: String, required: true },
  sequence: { type: Number, required: true },
  distanceFromOriginKm: { type: Number, required: true, default: 0 },
  arrivalTime: { type: String },
  departureTime: { type: String },
});

const TrainSchema: Schema = new Schema(
  {
    trainNumber: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    stations: [TrainStationRouteSchema],
  },
  { timestamps: true }
);

export const Train = mongoose.model<ITrainDocument>('Train', TrainSchema);
