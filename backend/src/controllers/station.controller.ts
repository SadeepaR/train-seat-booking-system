import { Request, Response, NextFunction } from 'express';
import { Station } from '../models/Station';

export const getStations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stations = await Station.find().sort({ sequence: 1 });
    res.status(200).json({ success: true, data: stations });
  } catch (error) {
    next(error);
  }
};
